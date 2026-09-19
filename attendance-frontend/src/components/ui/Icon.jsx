/**
 * A single inline SVG icon set, replacing the mix of Unicode glyphs and emoji
 * that were used as icons before. Those rendered differently on every platform
 * (and some not at all), could not be sized or coloured, and were read aloud by
 * screen readers. These inherit currentColor and are hidden from assistive tech
 * unless given a label.
 */
const paths = {
  dashboard: "M3 3h7v7H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 14h7v7H3z",
  classes: "M4 5h16v14H4zM4 9h16M9 9v10",
  check: "M4 12.5l5 5L20 6.5",
  clock: "M12 7v5l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  users: "M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 7a3 3 0 100 6 3 3 0 000-6zM22 19v-1a4 4 0 00-3-3.87M16 4.13A4 4 0 0119 8",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
  play: "M6 4l14 8-14 8z",
  stop: "M6 6h12v12H6z",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  edit: "M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  chart: "M3 21h18M7 21V10M12 21V4M17 21v-7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  key: "M15 7a4 4 0 104 4M21 3l-6 6M15 9l-2-2M11 13l-8 8v3h3l8-8",
  copy: "M8 8h11v11H8zM16 8V5H5v11h3",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z",
  info: "M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  menu: "M3 6h18M3 12h18M3 18h18",
  history: "M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8M12 7v5l4 2",
  signal: "M5 19v-4M10 19V9M15 19V5M20 19v-9",
  graduation: "M22 10L12 5 2 10l10 5 10-5zM6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5",
  leave: "M17 16l4-4-4-4M21 12H9M13 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15",
};

const Icon = ({ name, size = 18, className = "", label, strokeWidth = 1.75, filled = false }) => {
  const path = paths[name];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
};

export default Icon;
