/**
 * Thin wrapper around localStorage with JSON support and error handling.
 * Prevents crashes if localStorage is blocked (private browsing, etc.)
 */
const storage = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("storage.set failed:", e); }
  },

  remove(key) {
    try { localStorage.removeItem(key); }
    catch { /* silent */ }
  },

  clear() {
    try { localStorage.clear(); }
    catch { /* silent */ }
  },
};

export default storage;