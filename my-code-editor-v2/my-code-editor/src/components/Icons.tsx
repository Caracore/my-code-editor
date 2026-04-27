// Minimal inline SVG icon set — no external dependencies
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const I = {
  Files: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </svg>
  ),
  Search: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Git: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="12" r="2.2" />
      <path d="M6 8.2v7.6" />
      <path d="M8.2 6h4.6a3 3 0 0 1 3 3v.8" />
    </svg>
  ),
  Debug: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="7" y="8" width="10" height="12" rx="5" />
      <path d="M12 12v6" />
      <path d="M9 4l2 2M15 4l-2 2" />
      <path d="M3 14h4M17 14h4M3 18h4M17 18h4" />
    </svg>
  ),
  Extensions: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M10 3h4v4h3a2 2 0 0 1 2 2v3h-2a2 2 0 1 0 0 4h2v3a2 2 0 0 1-2 2h-3v-2a2 2 0 1 0-4 0v2H7a2 2 0 0 1-2-2v-3H3v-4h2a2 2 0 1 0 0-4H3V9a2 2 0 0 1 2-2h5z" />
    </svg>
  ),
  Terminal: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3" />
      <path d="M13 15h5" />
    </svg>
  ),
  Settings: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  Account: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  ChevronRight: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  ChevronDown: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Folder: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  FolderOpen: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3z" />
      <path d="M3 9h18l-2 9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  File: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </svg>
  ),
  Close: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Min: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  Max: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="5" y="5" width="14" height="14" rx="1" />
    </svg>
  ),
  Plus: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Split: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
    </svg>
  ),
  More: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18" cy="12" r="1.4" />
    </svg>
  ),
  Bell: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Branch: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M6 7v10" />
      <path d="M18 11c0 4-4 4-6 5" />
    </svg>
  ),
  Error: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h0" />
    </svg>
  ),
  Warn: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18h0" />
    </svg>
  ),
  Play: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M7 5v14l12-7z" fill="currentColor" />
    </svg>
  ),
  Stop: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
    </svg>
  ),
  Trash: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    </svg>
  ),
  Sparkle: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
    </svg>
  ),
  Database: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  Ai: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  Wifi: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M2 9a16 16 0 0 1 20 0" />
      <path d="M5 13a11 11 0 0 1 14 0" />
      <path d="M8.5 16.5a6 6 0 0 1 7 0" />
      <circle cx="12" cy="20" r="0.6" fill="currentColor" />
    </svg>
  ),
  Check: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <polyline points="4 12 10 18 20 6" />
    </svg>
  ),
  Send: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  ),
  FilePlus: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M12 12v6M9 15h6" />
    </svg>
  ),
  FolderPlus: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  ),
  Edit: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
  Copy: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  Refresh: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 4v4h-4" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 20v-4h4" />
    </svg>
  ),
  CheckSquare: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  ),
  Square: ({ size, ...p }: IconProps) => (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
};

export const Logo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7c5cff" />
        <stop offset="100%" stopColor="#5ad1ff" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="7" fill="url(#logo-grad)" />
    <path
      d="M11 10 7 16l4 6M21 10l4 6-4 6M18 9l-4 14"
      stroke="#0f1115"
      strokeWidth="2.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

