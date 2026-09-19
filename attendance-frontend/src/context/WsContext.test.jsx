import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { WsProvider, useWs } from "./WsContext";
import { MockWebSocket } from "../test/setup";

// The WebSocket client reads its token from AuthContext; stub that out so these
// tests exercise the socket logic on its own.
vi.mock("./AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

const Probe = () => {
  const { status, activeSessions } = useWs();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="sessions">{Object.keys(activeSessions).join(",")}</span>
    </div>
  );
};

const renderProvider = () =>
  render(
    <WsProvider>
      <Probe />
    </WsProvider>
  );

const latestSocket = () => MockWebSocket.instances.at(-1);

beforeEach(() => {
  MockWebSocket.instances.length = 0;
  vi.useRealTimers();
});

describe("WsProvider connection state", () => {
  it("reports an open connection once the socket opens", async () => {
    renderProvider();
    act(() => latestSocket().simulateOpen());

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("open"));
  });

  it("passes the token as a query parameter", () => {
    renderProvider();
    expect(latestSocket().url).toContain("token=test-token");
  });
});

describe("session tracking", () => {
  it("tracks several classes at once, so one live class does not hide another", async () => {
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    act(() =>
      socket.simulateMessage({
        type: "SESSION_STARTED",
        classId: "class-a",
        classTitle: "Class A",
        startedAt: new Date().toISOString(),
      })
    );
    act(() =>
      socket.simulateMessage({
        type: "SESSION_STARTED",
        classId: "class-b",
        classTitle: "Class B",
        startedAt: new Date().toISOString(),
      })
    );

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("class-a,class-b"));
  });

  it("removes only the class whose session ended", async () => {
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    act(() => socket.simulateMessage({ type: "SESSION_STARTED", classId: "class-a" }));
    act(() => socket.simulateMessage({ type: "SESSION_STARTED", classId: "class-b" }));
    act(() => socket.simulateMessage({ type: "SESSION_ENDED", classId: "class-a" }));

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("class-b"));
  });

  it("replaces its view of live sessions when the server confirms a subscription", async () => {
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    act(() =>
      socket.simulateMessage({
        type: "SUBSCRIBED",
        classIds: ["class-x"],
        activeSessions: [{ classId: "class-x", classTitle: "Class X" }],
      })
    );

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("class-x"));
  });

  it("ignores a malformed frame instead of crashing the app", async () => {
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    act(() => socket.onmessage({ data: "{not json" }));

    expect(screen.getByTestId("status")).toHaveTextContent("open");
  });
});

describe("reconnection", () => {
  it("retries after an unexpected close", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    act(() => socket.close(1006)); // abnormal closure
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("reconnecting"));

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });

    expect(MockWebSocket.instances.length).toBeGreaterThan(1);
  });

  it("stops retrying when the server rejects the credentials", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderProvider();
    const socket = latestSocket();
    act(() => socket.simulateOpen());

    // 4001 is the server's "unauthorized" close code; retrying cannot help, and
    // the old client reconnected every 3 seconds forever in this case.
    act(() => socket.close(4001));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("unauthorized"));

    const socketsBefore = MockWebSocket.instances.length;
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(MockWebSocket.instances.length).toBe(socketsBefore);
  });

  it("does not reconnect after the provider unmounts", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { unmount } = renderProvider();
    act(() => latestSocket().simulateOpen());

    const socketsBefore = MockWebSocket.instances.length;
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(MockWebSocket.instances.length).toBe(socketsBefore);
  });
});
