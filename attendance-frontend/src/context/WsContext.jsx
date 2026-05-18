import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const WsContext = createContext(null);

export const WsProvider = ({ children }) => {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const listenersRef = useRef({}); // eventType → Set of callbacks
  const reconnectTimer = useRef(null);
  const [connected, setConnected] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // { classId, classTitle, startedAt }

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:5001"}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("🔌 WebSocket connected");
      // Clear any pending reconnect
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, ...payload } = msg;

        // Handle session-level state centrally
        if (type === "SESSION_STARTED") {
          setActiveSession({
            classId: String(payload.classId),
            classTitle: payload.classTitle,
            startedAt: payload.startedAt,
          });
        }
        if (type === "SESSION_ENDED") {
          setActiveSession(null);
        }

        // Dispatch to all registered listeners for this event type
        const handlers = listenersRef.current[type];
        if (handlers) handlers.forEach((fn) => fn(payload));

        // Also dispatch to wildcard listeners
        const wildcards = listenersRef.current["*"];
        if (wildcards) wildcards.forEach((fn) => fn({ type, ...payload }));
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("🔌 WebSocket disconnected, reconnecting in 3s…");
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
      ws.close();
    };
  }, [token]);

  // Connect when token is available
  useEffect(() => {
    if (token) connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [token, connect]);

  /** Send a structured event to the server */
  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn("WS not connected, cannot send:", type);
    }
  }, []);

  /** Register an event listener. Returns an unsubscribe function. */
  const subscribe = useCallback((eventType, handler) => {
    if (!listenersRef.current[eventType]) {
      listenersRef.current[eventType] = new Set();
    }
    listenersRef.current[eventType].add(handler);
    return () => listenersRef.current[eventType]?.delete(handler);
  }, []);

  return (
    <WsContext.Provider value={{ connected, send, subscribe, activeSession }}>
      {children}
    </WsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWs = () => {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
};
