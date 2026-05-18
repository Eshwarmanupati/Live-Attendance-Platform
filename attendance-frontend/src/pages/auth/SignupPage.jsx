import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import Spinner from "../../components/ui/Spinner";

const SignupPage = () => {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await signup(form);
      toast("Account created!", "success");
      navigate(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err) {
      toast(err.response?.data?.message || "Signup failed", "error");
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-pulse-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pulse-600/20 border border-pulse-500/30 mb-4">
            <span className="text-xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-sm text-ink-400">Join the live attendance system</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role toggle */}
            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["student", "teacher"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border capitalize
                      ${form.role === r
                        ? "bg-pulse-600/20 border-pulse-500 text-pulse-300"
                        : "border-ink-700 text-ink-400 hover:border-ink-600"
                      }`}
                  >
                    {r === "student" ? "🎓" : "👨‍🏫"} {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">Full name</label>
              <input
                type="text"
                className={`input-field ${errors.name ? "border-rose-500" : ""}`}
                placeholder="John Doe"
                value={form.name}
                onChange={set("name")}
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-rose-500" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                className={`input-field ${errors.password ? "border-rose-500" : ""}`}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set("password")}
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Creating account…</> : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-pulse-400 hover:text-pulse-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
