import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../api/axios";
import Icon from "../../components/ui/Icon";
import Spinner from "../../components/ui/Spinner";
import { DEMO_ACCOUNTS, ROUTES, dashboardFor } from "../../utils/constants";

const FEATURES = [
  {
    icon: "bolt",
    title: "Live sessions over WebSockets",
    body: "A teacher opens a session and every enrolled student sees it instantly. Each mark appears on the roster in real time — no polling, no refresh.",
  },
  {
    icon: "key",
    title: "Join codes and role-based access",
    body: "Students join with a six-character code. Teachers only ever reach their own classes; every roster read is checked server-side.",
  },
  {
    icon: "clock",
    title: "Present, late and absent",
    body: "Marks after the grace period are recorded as late, and ending a session backfills absences, so attendance rates are counted rather than inferred.",
  },
  {
    icon: "chart",
    title: "History and CSV export",
    body: "Per-class rates for students, per-session rosters and a one-click CSV export for teachers.",
  },
];

const STACK = [
  "React 19",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express 5",
  "MongoDB",
  "Mongoose",
  "WebSocket (ws)",
  "JWT",
  "Zod",
  "Vitest",
];

const LandingPage = () => {
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);

  const signInAsDemo = async (role) => {
    setPending(role);
    try {
      const account = DEMO_ACCOUNTS[role];
      const signedIn = await login(account);
      toast(`Signed in as the demo ${role}.`, "success");
      navigate(dashboardFor(signedIn.role));
    } catch (error) {
      toast(errorMessage(error, "Demo sign-in failed. The API may still be waking up."), "error");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-pulse-600 flex items-center justify-center text-white">
            <Icon name="bolt" size={16} filled />
          </span>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Attend</p>
            <p className="text-[10px] font-mono text-ink-400 uppercase tracking-widest">Live attendance</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link to={dashboardFor(user.role)} className="btn-primary btn-sm">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to={ROUTES.SIGNUP} className="btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-6">
        <section className="pt-10 pb-14 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-pulse-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative animate-fade-up">
            <span className="badge-active mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" />
              Real-time by design
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
              Classroom attendance that updates the moment a student marks in
            </h1>
            <p className="text-ink-300 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
              A full-stack attendance platform: a teacher starts a live session, students mark
              themselves present from their own devices, and the roster fills in front of the class
              over a WebSocket connection.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                type="button"
                onClick={() => signInAsDemo("teacher")}
                disabled={Boolean(pending)}
                className="btn-primary"
              >
                {pending === "teacher" ? <Spinner size="sm" /> : <Icon name="user" size={16} />}
                Try it as a teacher
              </button>
              <button
                type="button"
                onClick={() => signInAsDemo("student")}
                disabled={Boolean(pending)}
                className="btn-ghost"
              >
                {pending === "student" ? <Spinner size="sm" /> : <Icon name="graduation" size={16} />}
                Try it as a student
              </button>
            </div>
            <p className="text-xs text-ink-400 font-mono mt-4">
              Demo accounts, pre-loaded with classes and history. Open both in two windows to watch
              a session run live.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 pb-14">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-pulse-600/15 text-pulse-300 mb-3">
                <Icon name={feature.icon} size={18} />
              </span>
              <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
              <p className="text-sm text-ink-300 mt-1.5 leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="card mb-14">
          <p className="stat-label mb-3">Built with</p>
          <div className="flex flex-wrap gap-2">
            {STACK.map((item) => (
              <span key={item} className="badge-inactive">
                {item}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-6 py-8 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-ink-400">Built by Eshwar Manupati</p>
        <a
          href="https://github.com/Eshwarmanupati/Live-Attendence-Platform"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-pulse-300 hover:text-pulse-200 transition-colors focus-ring rounded"
        >
          View the source on GitHub
        </a>
      </footer>
    </div>
  );
};

export default LandingPage;
