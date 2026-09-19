import config from "../config/env.js";

/**
 * Minimal structured logger. Silent under NODE_ENV=test so the test output
 * stays readable, JSON in production so a host's log drain can parse it.
 */
const write = (level, message, meta) => {
  if (config.isTest) return;

  if (config.isProduction) {
    console[level === "debug" ? "log" : level](
      JSON.stringify({ level, message, ...meta, time: new Date().toISOString() })
    );
    return;
  }

  const stamp = new Date().toISOString().slice(11, 19);
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console[level === "debug" ? "log" : level](`${stamp} ${level.toUpperCase().padEnd(5)} ${message}${suffix}`);
};

const logger = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};

export default logger;
