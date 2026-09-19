import { useState } from "react";
import Spinner from "../ui/Spinner";

const ClassForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    title: initial.title ?? "",
    description: initial.description ?? "",
  });
  const [errors, setErrors] = useState({});

  const submit = (event) => {
    event.preventDefault();
    const trimmed = form.title.trim();
    if (trimmed.length < 3) {
      setErrors({ title: "Title must be at least 3 characters" });
      return;
    }
    onSubmit({ title: trimmed, description: form.description.trim() });
  };

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="input-label" htmlFor="class-title">
          Class title
        </label>
        <input
          id="class-title"
          type="text"
          className={`input-field ${errors.title ? "border-rose-500" : ""}`}
          placeholder="e.g. Distributed Systems"
          value={form.title}
          onChange={set("title")}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-xs text-rose-300 mt-1.5">{errors.title}</p>}
      </div>

      <div>
        <label className="input-label" htmlFor="class-description">
          Description <span className="text-ink-500 normal-case">(optional)</span>
        </label>
        <textarea
          id="class-description"
          className="input-field resize-none"
          placeholder="What this class covers…"
          rows={3}
          maxLength={500}
          value={form.description}
          onChange={set("description")}
        />
        <p className="text-[11px] font-mono text-ink-500 mt-1">{form.description.length}/500</p>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" /> Saving…
            </>
          ) : initial.id || initial._id ? (
            "Save changes"
          ) : (
            "Create class"
          )}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
