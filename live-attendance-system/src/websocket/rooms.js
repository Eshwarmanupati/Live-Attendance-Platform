/**
 * A minimal pub/sub registry mapping a classId to the sockets watching it.
 *
 * The previous implementation broadcast every event to every connected client,
 * so a student in one class received live updates — and session banners — for
 * every other class in the system. Rooms scope each event to the class it
 * belongs to.
 */
export class RoomRegistry {
  constructor() {
    this.rooms = new Map(); // classId -> Set<ws>
  }

  join(classId, ws) {
    const key = String(classId);
    if (!this.rooms.has(key)) this.rooms.set(key, new Set());
    this.rooms.get(key).add(ws);
    ws.rooms ??= new Set();
    ws.rooms.add(key);
  }

  leave(classId, ws) {
    const key = String(classId);
    const room = this.rooms.get(key);
    if (!room) return;
    room.delete(ws);
    ws.rooms?.delete(key);
    if (room.size === 0) this.rooms.delete(key);
  }

  /** Removes a socket from every room it joined. Called on disconnect. */
  leaveAll(ws) {
    ws.rooms?.forEach((key) => {
      const room = this.rooms.get(key);
      room?.delete(ws);
      if (room?.size === 0) this.rooms.delete(key);
    });
    ws.rooms?.clear();
  }

  members(classId) {
    return this.rooms.get(String(classId)) ?? new Set();
  }

  size(classId) {
    return this.members(classId).size;
  }
}

export default RoomRegistry;
