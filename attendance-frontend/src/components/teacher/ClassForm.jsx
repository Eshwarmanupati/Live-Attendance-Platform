import { useState } from "react";
import Spinner from "../ui/Spinner";

const ClassForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ title: "", description: "", ...initial });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title || form.title.length < 3) errs.title = "Title must be at least 3 characters";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">
          Class title *
        </label>
        <input
          type="text"
          className={`input-field ${errors.title ? "border-rose-500" : ""}`}
          placeholder="e.g. Mathematics 101"
          value={form.title}
          onChange={set("title")}
        />
        {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-xs font-mono text-ink-400 mb-1.5 uppercase tracking-wider">
          Description
        </label>
        <textarea
          className="input-field resize-none"
          placeholder="Brief description of the class…"
          rows={3}
          value={form.description}
          onChange={set("description")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? <><Spinner size="sm" /> Saving…</> : (initial._id ? "Update class" : "Create class")}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
