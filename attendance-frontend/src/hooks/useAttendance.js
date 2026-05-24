import { useState, useEffect, useCallback } from "react";
import { attendanceService } from "../api/attendance";
import useWs from "./useWs";
import useAuth from "./useAuth";
import { getUserId } from "../utils/userId";

const useAttendance = (classId) => {
  const { user } = useAuth();
  const userId = getUserId(user);
  const { send, subscribe } = useWs();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await attendanceService.getByClass(classId);
      setRecords(res.data.data.attendance || []);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchRecords();
    });
    return () => { active = false; };
  }, [fetchRecords]);

  useEffect(() => {
    const unsubUpdated = subscribe("ATTENDANCE_UPDATED", (payload) => {
      if (String(payload.classId) !== String(classId)) return;

      if (String(payload.studentId) === String(userId)) {
        setMarked(true);
        setMarking(false);
      }

      setRecords((prev) => {
        const exists = prev.some(
          (r) => String(r.studentId?._id ?? r.studentId) === String(payload.studentId)
        );
        if (exists) return prev;
        return [
          {
            _id: Date.now(),
            studentId: { _id: payload.studentId, name: payload.studentName },
            status: "present",
            timestamp: payload.timestamp,
            isNew: true,
          },
          ...prev,
        ];
      });
    });

    const unsubError = subscribe("ERROR", () => {
      setMarking(false);
    });

    return () => {
      unsubUpdated();
      unsubError();
    };
  }, [classId, subscribe, userId]);

  const markAttendance = useCallback(() => {
    if (!classId || !userId || marked || marking) return;
    setMarking(true);
    send("MARK_ATTENDANCE", { classId, studentId: userId });
  }, [classId, userId, marked, marking, send]);

  return { records, loading, marked, marking, markAttendance, refetch: fetchRecords };
};

export default useAttendance;
