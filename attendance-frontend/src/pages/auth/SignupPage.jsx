import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../api/axios";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";
import { ROLES, ROUTES, dashboardFor } from "../../utils/constants";

const ROLE_OPTIONS = [
  { value: ROLES.STUDENT, label: "Student", icon: "graduation", hint: "Join classes and mark attendance" },
  { value: ROLES.TEACHER, label: "Teacher", icon: "user", hint: "Create classes and run sessions" },
];

const SignupPage = () => {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: ROLES.STUDENT });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.name || form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email address";
    // Matches the API and the User model, which both require 8.
    if (!form.password || form.password.length < 8) next.password = "Password must be at least 8 characters";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    setLoading(true);
    try {
      const user = await signup(form);
      toast("Account created. Welcome aboard.", "success");
      navigate(dashboardFor(user.role), { replace: true });
    } catch (error) {
      toast(errorMessage(error, "Sign-up failed."), "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-pulse-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-7">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pulse-600/20 border border-pulse-500/30 mb-4 text-pulse-300 focus-ring"
            aria-label="Back to home"
          >
            <Icon name="bolt" size={20} filled />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm text-ink-300">Start running live attendance in a minute</p>
        </div>

        <div className="card">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <fieldset>
              <legend className="input-label">I am a</legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((option) => {
                  const selected = form.role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role: option.value }))}
                      aria-pressed={selected}
                      className={`px-3 py-3 rounded-lg text-sm font-semibold transition-colors border text-left focus-ring
                        ${selected
                          ? "bg-pulse-600/20 border-pulse-500 text-pulse-200"
                          : "border-ink-700 text-ink-300 hover:border-ink-600"}`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon name={option.icon} size={15} />
                        {option.label}
                      </span>
                      <span className="block text-[11px] font-normal text-ink-400 mt-1 leading-snug">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="input-label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? "border-rose-500" : ""}`}
                placeholder="Alex Chen"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="text-xs text-rose-300 mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="signup-email">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                className={`input-field ${errors.email ? "border-rose-500" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-xs text-rose-300 mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className={`input-field ${errors.password ? "border-rose-500" : ""}`}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <p className="text-xs text-rose-300 mt-1.5">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-5">
            Already have an account?{" "}
            <Link to={ROUTES.LOGIN} className="text-pulse-300 hover:text-pulse-200 transition-colors focus-ring rounded">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
