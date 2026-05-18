// Re-exports useAuth from context so imports look cleaner across the app.
// Instead of: import { useAuth } from "../context/AuthContext"
// You write:  import useAuth from "../hooks/useAuth"
export { useAuth as default } from "../context/AuthContext";