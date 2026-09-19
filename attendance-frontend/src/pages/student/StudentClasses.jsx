import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { classService } from "../../api/classes";
import { errorMessage } from "../../api/axios";
import { useToast } from "../../components/ui/Toast";
import useClasses from "../../hooks/useClasses";
import { CardSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";
import { formatDate } from "../../utils/formatDate";

const StudentClasses = () => {
  const toast = useToast();
  const enrolled = useClasses({ onError: (m) => toast(m, "error") });
  const available = useClasses({ scope: "available" });

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [search, setSearch] = useState("");
  const [leaving, setLeaving] = useState(null);
  const [leavePending, setLeavePending] = useState(false);

  const afterMembershipChange = () => {
    // Both lists shift when membership changes, so refresh the pair.
    enrolled.refetch();
    available.refetch();
  };

  const joinWithCode = async (event) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast("A join code is six characters.", "warning");
      return;
    }

    setJoining(true);
    try {
      const res = await classService.joinByCode(code);
      toast(`Joined ${res.data.data.class.title}.`, "success");
      setJoinCode("");
      afterMembershipChange();
    } catch (error) {
      toast(errorMessage(error, "Could not join that class."), "error");
    } finally {
      setJoining(false);
    }
  };

  const joinById = async (cls) => {
    try {
      await classService.enroll(cls.id ?? cls._id);
      toast(`Joined ${cls.title}.`, "success");
      afterMembershipChange();
    } catch (error) {
      toast(errorMessage(error, "Could not join that class."), "error");
    }
  };

  const confirmLeave = async () => {
    setLeavePending(true);
    try {
      await classService.leave(leaving.id ?? leaving._id);
      toast(`Left ${leaving.title}.`, "info");
      setLeaving(null);
      afterMembershipChange();
    } catch (error) {
      toast(errorMessage(error, "Could not leave that class."), "error");
    } finally {
      setLeavePending(false);
    }
  };

  const filteredAvailable = available.classes.filter((cls) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      cls.title.toLowerCase().includes(needle) ||
      cls.description?.toLowerCase().includes(needle) ||
      cls.teacher?.name?.toLowerCase().includes(needle)
    );
  });

  return (
    <DashboardLayout title="My classes" subtitle="Join a class and manage your enrolments">
      <form onSubmit={joinWithCode} className="card mb-6 max-w-xl">
        <label className="input-label" htmlFor="join-code">
          Join a class with a code
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="join-code"
            type="text"
            className="input-field font-mono tracking-[0.3em] uppercase"
            placeholder="ABC123"
            maxLength={6}
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary flex-shrink-0" disabled={joining}>
            {joining ? <Spinner size="sm" /> : <Icon name="key" size={15} />} Join
          </button>
        </div>
        <p className="text-xs text-ink-400 mt-2">Your teacher shares this code with the class.</p>
      </form>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-ink-200 uppercase tracking-wider font-mono mb-4">
          Enrolled {!enrolled.loading && `(${enrolled.classes.length})`}
        </h2>

        {enrolled.loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : enrolled.classes.length === 0 ? (
          <EmptyState
            title="Not enrolled in anything yet"
            message="Use a join code above, or pick one of the classes below."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrolled.classes.map((cls) => (
              <div key={cls.id ?? cls._id} className="card flex flex-col">
                <h3 className="font-semibold text-white truncate">{cls.title}</h3>
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">
                  {cls.description || "No description"}
                </p>
                <div className="text-xs text-ink-400 font-mono mt-3 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Icon name="user" size={12} /> {cls.teacher?.name}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Icon name="users" size={12} /> {cls.students?.length ?? 0} enrolled
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaving(cls)}
                  className="btn-ghost btn-sm mt-4 self-start"
                >
                  <Icon name="leave" size={13} /> Leave class
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-200 uppercase tracking-wider font-mono">
            Classes you can join
          </h2>
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              <Icon name="search" size={15} />
            </span>
            <input
              type="search"
              className="input-field !pl-9 !py-2"
              placeholder="Search classes…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search classes"
            />
          </div>
        </div>

        {available.loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredAvailable.length === 0 ? (
          <EmptyState
            icon="search"
            title={search ? "Nothing matches that search" : "No other classes available"}
            message={search ? "Try a different term." : "You have joined everything on offer."}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAvailable.map((cls) => (
              <div key={cls.id ?? cls._id} className="card flex flex-col hover:border-ink-700 transition-colors">
                <h3 className="font-semibold text-white truncate">{cls.title}</h3>
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">
                  {cls.description || "No description"}
                </p>
                <div className="text-xs text-ink-400 font-mono mt-3 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Icon name="user" size={12} /> {cls.teacher?.name}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Icon name="clock" size={12} /> {formatDate(cls.createdAt)}
                  </p>
                </div>
                <button type="button" onClick={() => joinById(cls)} className="btn-success btn-sm mt-4 self-start">
                  <Icon name="plus" size={13} /> Join class
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(leaving)}
        title="Leave this class?"
        message={`You will stop receiving live sessions for "${leaving?.title}". Your past attendance records are kept.`}
        confirmLabel="Leave class"
        destructive
        loading={leavePending}
        onConfirm={confirmLeave}
        onCancel={() => setLeaving(null)}
      />
    </DashboardLayout>
  );
};

export default StudentClasses;
