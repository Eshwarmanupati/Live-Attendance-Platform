const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
};

const Spinner = ({ size = "md", className = "", label = "Loading" }) => (
  <span
    role="status"
    aria-label={label}
    className={`inline-block ${sizes[size]} rounded-full border-pulse-500/25 border-t-pulse-400 animate-spin ${className}`}
  />
);

export default Spinner;
