/**
 * BeamButton — Button with animated light beams converging from edges.
 * Only shows beams when button is disabled (no origin/destination selected).
 * When active, beams stop and button glows normally.
 */
import { cn } from "@/lib/utils";

interface BeamButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// ── Beam SVG Lines (4 beams from corners/edges toward center) ────────────────
// Each beam: a line coming from outside toward the button
// Rendered as SVG overlaid on the button's parent container

function Beams({ active }: { active: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top beam */}
          <linearGradient id="beam-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#67C5F5" stopOpacity="0.9" />
          </linearGradient>
          {/* Bottom beam */}
          <linearGradient id="beam-bottom" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#2F4389" stopOpacity="0.9" />
          </linearGradient>
          {/* Left beam */}
          <linearGradient id="beam-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#8B47AC" stopOpacity="0.9" />
          </linearGradient>
          {/* Right beam */}
          <linearGradient id="beam-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.9" />
          </linearGradient>
          {/* Diagonal top-left */}
          <linearGradient id="beam-tl" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#E0001F" stopOpacity="0.7" />
          </linearGradient>
          {/* Diagonal top-right */}
          <linearGradient id="beam-tr" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#F8E100" stopOpacity="0.7" />
          </linearGradient>

          <style>{`
            @keyframes beam-in-top    { 0%{stroke-dashoffset:120;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.9} }
            @keyframes beam-in-bottom { 0%{stroke-dashoffset:120;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.9} }
            @keyframes beam-in-left   { 0%{stroke-dashoffset:180;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.9} }
            @keyframes beam-in-right  { 0%{stroke-dashoffset:180;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.9} }
            @keyframes beam-in-tl     { 0%{stroke-dashoffset:200;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.7} }
            @keyframes beam-in-tr     { 0%{stroke-dashoffset:200;opacity:0} 30%{opacity:1} 100%{stroke-dashoffset:0;opacity:0.7} }

            .beam-top    { stroke-dasharray:120; stroke-dashoffset:120; animation: beam-in-top    2.4s ease-in-out 0s    infinite; }
            .beam-bottom { stroke-dasharray:120; stroke-dashoffset:120; animation: beam-in-bottom 2.4s ease-in-out 0.3s  infinite; }
            .beam-left   { stroke-dasharray:180; stroke-dashoffset:180; animation: beam-in-left   2.4s ease-in-out 0.15s infinite; }
            .beam-right  { stroke-dasharray:180; stroke-dashoffset:180; animation: beam-in-right  2.4s ease-in-out 0.45s infinite; }
            .beam-tl     { stroke-dasharray:200; stroke-dashoffset:200; animation: beam-in-tl     2.8s ease-in-out 0.6s  infinite; }
            .beam-tr     { stroke-dasharray:200; stroke-dashoffset:200; animation: beam-in-tr     2.8s ease-in-out 0.9s  infinite; }

            .beam-paused { animation-play-state: paused !important; opacity: 0 !important; }
          `}</style>
        </defs>

        {/* Top beam — comes from above center to button top */}
        <line
          x1="50%" y1="-80" x2="50%" y2="50%"
          stroke="url(#beam-top)" strokeWidth="1.5" strokeLinecap="round"
          className={cn("beam-top", !active && "beam-paused")}
        />

        {/* Bottom beam */}
        <line
          x1="50%" y1="calc(100% + 80px)" x2="50%" y2="50%"
          stroke="url(#beam-bottom)" strokeWidth="1.5" strokeLinecap="round"
          className={cn("beam-bottom", !active && "beam-paused")}
        />

        {/* Left beam */}
        <line
          x1="-120" y1="50%" x2="50%" y2="50%"
          stroke="url(#beam-left)" strokeWidth="1.5" strokeLinecap="round"
          className={cn("beam-left", !active && "beam-paused")}
        />

        {/* Right beam */}
        <line
          x1="calc(100% + 120px)" y1="50%" x2="50%" y2="50%"
          stroke="url(#beam-right)" strokeWidth="1.5" strokeLinecap="round"
          className={cn("beam-right", !active && "beam-paused")}
        />

        {/* Top-left diagonal */}
        <line
          x1="-100" y1="-60" x2="50%" y2="50%"
          stroke="url(#beam-tl)" strokeWidth="1" strokeLinecap="round"
          className={cn("beam-tl", !active && "beam-paused")}
        />

        {/* Top-right diagonal */}
        <line
          x1="calc(100% + 100px)" y1="-60" x2="50%" y2="50%"
          stroke="url(#beam-tr)" strokeWidth="1" strokeLinecap="round"
          className={cn("beam-tr", !active && "beam-paused")}
        />
      </svg>
    </div>
  );
}

export function BeamButton({ disabled = false, onClick, children, className }: BeamButtonProps) {
  // beams show when disabled (waiting for input)
  const showBeams = disabled;

  return (
    <div className="relative w-full">
      <Beams active={showBeams} />
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative w-full inline-flex items-center justify-center gap-2",
          "h-12 rounded-2xl px-8 text-base font-semibold",
          "transition-all duration-300 select-none active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-40",
          className
        )}
      >
        {children}
      </button>
    </div>
  );
}
