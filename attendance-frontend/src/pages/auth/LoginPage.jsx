import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import Spinner from "../../components/ui/Spinner";

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form);
      toast("Logged in successfully!", "success");
      navigate(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-pulse-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pulse-600/20 border border-pulse-500/30 mb-4">
            <span className="text-xl">⊕</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-ink-400">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-rose-500 focus:border-rose-500" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                className={`input-field ${errors.password ? "border-rose-500 focus:border-rose-500" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Signing in…</> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            No account?{" "}
            <Link to="/signup" className="text-pulse-400 hover:text-pulse-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
