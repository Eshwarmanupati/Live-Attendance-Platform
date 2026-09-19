import { useState, useEffect, useCallback } from "react";
import { classService } from "../api/classes";
import { errorMessage } from "../api/axios";

/**
 * Loads a class list once and exposes the local mutations the pages need, so
 * three pages no longer repeat the same fetch/catch/finally block.
 */
const useClasses = ({ scope, onError } = {}) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classService.getAll(scope);
      setClasses(res.data.data.classes);
      setError(null);
      return res.data.data.classes;
    } catch (err) {
      const message = errorMessage(err, "Could not load your classes.");
      setError(message);
      onError?.(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [scope, onError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await classService.getAll(scope).catch((err) => {
        if (!cancelled) {
          const message = errorMessage(err, "Could not load your classes.");
          setError(message);
          onError?.(message);
        }
        return null;
      });
      if (cancelled) return;
      if (res) {
        setClasses(res.data.data.classes);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // onError is intentionally excluded: it is a toast callback that changes
    // identity on every render and would restart the request each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const upsert = useCallback((cls) => {
    setClasses((prev) => {
      const id = cls.id ?? cls._id;
      const exists = prev.some((c) => String(c.id ?? c._id) === String(id));
      return exists
        ? prev.map((c) => (String(c.id ?? c._id) === String(id) ? cls : c))
        : [cls, ...prev];
    });
  }, []);

  const remove = useCallback((id) => {
    setClasses((prev) => prev.filter((c) => String(c.id ?? c._id) !== String(id)));
  }, []);

  return { classes, loading, error, refetch, upsert, remove, setClasses };
};

export default useClasses;
