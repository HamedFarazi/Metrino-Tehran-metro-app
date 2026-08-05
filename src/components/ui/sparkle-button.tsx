/**
 * SparkleButton — uiverse.io sparkle style, pure CSS.
 * disabled: rotating dots border + shimmer sweep
 * hover/active: purple radial glow + sparkle icon pulse
 */
import { cn } from "@/lib/utils";

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      className="sparkle-icon" aria-hidden="true">
      <path className="sparkle-path sparkle-path-1" strokeLinejoin="round" strokeLinecap="round"
        stroke="currentColor" fill="currentColor"
        d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" />
      <path className="sparkle-path sparkle-path-2" strokeLinejoin="round" strokeLinecap="round"
        stroke="currentColor" fill="currentColor"
        d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" />
      <path className="sparkle-path sparkle-path-3" strokeLinejoin="round" strokeLinecap="round"
        stroke="currentColor" fill="currentColor"
        d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" />
    </svg>
  );
}

const STYLES = `
.sparkle-btn {
  --active: 0;
  --br: 9999px;
  --tr: 0.3s ease-in-out;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem 2rem;
  background: transparent;
  border: none;
  border-radius: var(--br);
  transform: scale(calc(1 + var(--active) * 0.04));
  transition: transform var(--tr);
  margin-top: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
}
.sparkle-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.sparkle-btn:not(:disabled):is(:hover,:focus-visible) { --active: 1; }
.sparkle-btn:not(:disabled):active { transform: scale(0.98); }

/* bg layer */
.sparkle-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: hsla(0 0% 10% / 1);
  border-radius: var(--br);
  box-shadow:
    inset 0 0.5px hsl(0 0% 100% / 0.12),
    inset 0 -1px 2px hsl(0 0% 0% / 0.8),
    0 4px 10px -4px hsla(0 0% 0% / calc(1 - var(--active))),
    0 0 0 calc(var(--active) * 0.35rem) hsla(260 97% 50% / 0.65);
  transition: all var(--tr);
  z-index: 0;
}

/* purple glow on hover */
.sparkle-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: hsla(260 97% 61% / 0.7)
    radial-gradient(at 51% 89%, hsla(266 45% 74% / 1) 0, transparent 50%),
    radial-gradient(at 100% 100%, hsla(266 36% 60% / 1) 0, transparent 50%),
    radial-gradient(at 22% 91%, hsla(266 36% 60% / 1) 0, transparent 50%);
  opacity: var(--active);
  border-radius: var(--br);
  transition: opacity var(--tr);
  z-index: 1;
}

/* dots ring */
.sparkle-dots {
  overflow: hidden;
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% + 3px);
  height: calc(100% + 3px);
  border-radius: var(--br);
  z-index: -1;
}
.sparkle-dots::before {
  content: "";
  position: absolute;
  top: 30%; left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) rotate(0deg);
  width: 100%;
  height: 2rem;
  background: white;
  mask: linear-gradient(transparent 0%, white 120%);
  animation: sp-rotate 2s linear infinite;
}
@keyframes sp-rotate { to { transform: translate(-50%,-50%) rotate(360deg); } }

/* shimmer on disabled */
.sparkle-btn:disabled .sparkle-dots::after {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 55%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.07) 35%,
    rgba(255,255,255,0.16) 50%,
    rgba(255,255,255,0.07) 65%,
    transparent 100%
  );
  animation: sp-shimmer 2.4s ease-in-out infinite;
}
@keyframes sp-shimmer { 0% { left: -100%; } 100% { left: 160%; } }

/* sparkle icon */
.sparkle-icon {
  position: relative;
  z-index: 10;
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
  color: white;
}
.sparkle-path { transform-origin: center; }
.sparkle-btn:not(:disabled):is(:hover,:focus) .sparkle-path {
  animation: sp-path 1.5s linear 0.5s infinite;
}
.sparkle-path-1 { --s: 1.2; }
.sparkle-path-2 { --s: 1.15; }
.sparkle-path-3 { --s: 1.1; }
@keyframes sp-path {
  0%,34%,71%,100% { transform: scale(1); }
  17% { transform: scale(var(--s,1)); }
  49% { transform: scale(var(--s,1)); }
  83% { transform: scale(var(--s,1)); }
}

/* text */
.sparkle-text {
  position: relative;
  z-index: 10;
  background-image: linear-gradient(
    90deg,
    hsl(0 0% 100% / 1) 0%,
    hsl(0 0% 100% / calc(0.35 + var(--active) * 0.65)) 120%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 600;
}
`;

interface SparkleButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SparkleButton({ disabled = false, onClick, children, className }: SparkleButtonProps) {
  return (
    <>
      <style>{STYLES}</style>
      <button className={cn("sparkle-btn", className)} onClick={onClick} disabled={disabled}>
        <div className="sparkle-dots" aria-hidden="true" />
        <SparkleIcon />
        <span className="sparkle-text">{children}</span>
      </button>
    </>
  );
}
