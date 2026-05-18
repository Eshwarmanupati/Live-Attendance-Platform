const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
};

const Spinner = ({ size = "md", className = "" }) => (
  <div
    className={`${sizes[size]} rounded-full border-pulse-500/30 border-t-pulse-400 animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export default Spinner;
