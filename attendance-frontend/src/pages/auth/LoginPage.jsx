import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../api/axios";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";
import { DEMO_ACCOUNTS, ROUTES, dashboardFor } from "../../utils/constants";

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
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
      const user = await login(form);
      toast(`Welcome back, ${user.name.split(" ")[0]}.`, "success");
      navigate(location.state?.from ?? dashboardFor(user.role), { replace: true });
    } catch (error) {
      toast(errorMessage(error, "Sign-in failed."), "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const fillDemo = (role) => {
    setForm(DEMO_ACCOUNTS[role]);
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-ink-300">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="input-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? "border-rose-500" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-rose-300 mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`input-field ${errors.password ? "border-rose-500" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-rose-300 mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-ink-800">
            <p className="stat-label mb-2">Or use a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => fillDemo("teacher")} className="btn-ghost btn-sm">
                <Icon name="user" size={14} /> Teacher
              </button>
              <button type="button" onClick={() => fillDemo("student")} className="btn-ghost btn-sm">
                <Icon name="graduation" size={14} /> Student
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-ink-400 mt-5">
            No account?{" "}
            <Link to={ROUTES.SIGNUP} className="text-pulse-300 hover:text-pulse-200 transition-colors focus-ring rounded">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
