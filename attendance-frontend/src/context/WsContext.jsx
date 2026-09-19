import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { WS_URL, WS_OUT } from "../utils/constants";

const WsContext = createContext(null);

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
/** The server closes with this code when the token is bad; retrying is pointless. */
const CLOSE_UNAUTHORIZED = 4001;
/** Stable empty object, so a signed-out render does not change identity. */
const EMPTY_SESSIONS = Object.freeze({});

export const WsProvider = ({ children }) => {
  const { token } = useAuth();

  const socketRef = useRef(null);
  const listenersRef = useRef(new Map()); // eventType -> Set<handler>
  const reconnectTimerRef = useRef(null);
  const attemptsRef = useRef(0);
  // Set when the app itself closes the socket, so onclose does not reconnect.
  const intentionalCloseRef = useRef(false);
  // Holds the latest `connect`, so the reconnect timer can call it without the
  // callback having to reference itself before it is declared.
  const connectRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | connecting | open | reconnecting | unauthorized
  /** classId -> { sessionId, classId, classTitle, startedAt, enrolled } */
  const [activeSessions, setActiveSessions] = useState({});

  const emit = useCallback((type, payload) => {
    listenersRef.current.get(type)?.forEach((handler) => handler(payload));
    listenersRef.current.get("*")?.forEach((handler) => handler({ type, ...payload }));
  }, []);

  const clearReconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (!token) return;
    const existing = socketRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalCloseRef.current = false;
    setStatus((prev) => (prev === "idle" ? "connecting" : prev));

    const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      attemptsRef.current = 0;
      clearReconnect();
      setStatus("open");
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      const { type, ...payload } = message;

      // Session state is tracked here so every page sees the same live view.
      if (type === WS_OUT.SUBSCRIBED) {
        setActiveSessions(
          Object.fromEntries((payload.activeSessions ?? []).map((s) => [String(s.classId), s]))
        );
      } else if (type === WS_OUT.SESSION_STARTED) {
        setActiveSessions((prev) => ({ ...prev, [String(payload.classId)]: payload }));
      } else if (type === WS_OUT.SESSION_ENDED) {
        setActiveSessions((prev) => {
          const next = { ...prev };
          delete next[String(payload.classId)];
          return next;
        });
      }

      emit(type, payload);
    };

    socket.onclose = (event) => {
      if (intentionalCloseRef.current) return;

      // Bad credentials will fail again on every retry — stop and let the app
      // handle it, rather than hammering the server every few seconds forever.
      if (event.code === CLOSE_UNAUTHORIZED) {
        setStatus("unauthorized");
        return;
      }

      setStatus("reconnecting");
      // Exponential backoff with jitter, so many clients reconnecting after a
      // deploy do not arrive in lockstep.
      const attempt = (attemptsRef.current += 1);
      const backoff = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (attempt - 1), MAX_RECONNECT_DELAY_MS);
      const delay = backoff * (0.7 + Math.random() * 0.6);

      clearReconnect();
      reconnectTimerRef.current = setTimeout(() => connectRef.current?.(), delay);
    };

    socket.onerror = () => {
      // onclose always follows, and that is where reconnection is decided.
    };
  }, [token, emit]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!token) {
      // Logged out: close deliberately and drop any live state.
      intentionalCloseRef.current = true;
      clearReconnect();
      socketRef.current?.close();
      socketRef.current = null;
      attemptsRef.current = 0;
      return undefined;
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      clearReconnect();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [token, connect]);

  const send = useCallback((type, payload = {}) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type, ...payload }));
    return true;
  }, []);

  /** Registers a handler and returns its unsubscribe function. */
  const subscribe = useCallback((eventType, handler) => {
    const listeners = listenersRef.current;
    if (!listeners.has(eventType)) listeners.set(eventType, new Set());
    listeners.get(eventType).add(handler);

    return () => {
      const set = listeners.get(eventType);
      set?.delete(handler);
      if (set?.size === 0) listeners.delete(eventType);
    };
  }, []);

  // Signed out: report idle and no live sessions without having to reset state
  // from inside an effect.
  const effectiveStatus = token ? status : "idle";
  const effectiveSessions = token ? activeSessions : EMPTY_SESSIONS;

  const value = useMemo(
    () => ({
      status: effectiveStatus,
      connected: effectiveStatus === "open",
      activeSessions: effectiveSessions,
      sessionFor: (classId) => effectiveSessions[String(classId)] ?? null,
      send,
      subscribe,
      reconnect: () => {
        attemptsRef.current = 0;
        connect();
      },
    }),
    [effectiveStatus, effectiveSessions, send, subscribe, connect]
  );

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWs = () => {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
};
