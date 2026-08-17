/**
 * Developer Easter Egg Modal
 * Triggered by F12 in production builds only
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DevEasterEggProps {
  onClose: () => void;
}

export function DevEasterEgg({ onClose }: DevEasterEggProps) {
  const [countdown, setCountdown] = useState(5);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    // Try to play audio
    const audio = new Audio("/Phil_Rey_-_Morning_Light.mp3");
    audio.loop = false;
    
    // Store in window for global metro commands
    (window as any).__metroAudio = audio;

    audio.play().catch(() => {
      // Autoplay blocked - this is expected
      setAudioError(true);
    });

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onClose, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [onClose]);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          backdropFilter: "blur(8px)",
          background: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg"
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            boxShadow: "0 0 60px rgba(139, 92, 246, 0.2), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            background: "rgba(10, 10, 20, 0.5)",
          }}
        >
          {/* Video Background */}
          <div className="absolute inset-0 overflow-hidden rounded-[24px]" style={{ zIndex: 0 }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                opacity: 0.65,
                filter: "saturate(1.2) brightness(0.85)",
              }}
            >
              <source src="/hey.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Dark overlay */}
          <div 
            className="absolute inset-0 rounded-[24px] pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(10, 10, 20, 0.50), rgba(20, 15, 35, 0.45))",
              zIndex: 1,
            }}
          />

          {/* Close button with countdown */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:bg-white/5"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 20,
            }}
          >
            <motion.span
              key={countdown}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-mono tabular-nums"
              style={{ color: "#22D3EE" }}
            >
              {countdown}
            </motion.span>
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="relative p-8 pt-12" dir="rtl" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(139, 92, 246, 0.2)",
                  border: "2px solid rgba(139, 92, 246, 0.4)",
                }}
              >
                <span className="text-2xl">🚇</span>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#F8FAFF" }}>
                  METRO Tehran
                </h2>
                <p className="text-sm" style={{ color: "rgba(168, 85, 247, 0.8)" }}>
                  Tehran Metro Navigation Experience
                </p>
              </div>
            </div>

            {/* Main message */}
            <div 
              className="rounded-2xl p-6 mb-6"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <p 
                className="text-lg leading-relaxed text-center"
                style={{ 
                  color: "#F1F5F9",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                همکار عزیز،
                <br />
                این آهنگ تقدیم به تو{" "}
                <span style={{ color: "#F472B6" }}>❤️</span>
              </p>
            </div>

            {/* Developer card */}
            <div 
              className="rounded-xl p-4 mb-4"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex-shrink-0 flex items-center justify-center rounded-full text-2xl"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3))",
                    border: "2px solid rgba(139, 92, 246, 0.5)",
                  }}
                >
                  👨‍💻
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-base font-bold mb-1" style={{ color: "#F8FAFF" }}>
                    Hamed Farazi
                  </h3>
                  <p className="text-sm mb-2" style={{ color: "rgba(168, 85, 247, 0.8)" }}>
                    Frontend Developer
                  </p>
                  <a
                    href="https://github.com/HamedFarazi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline inline-flex items-center gap-1"
                    style={{ color: "#22D3EE" }}
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    github.com/HamedFarazi
                  </a>
                </div>
              </div>
            </div>

            {/* Audio player */}
            <div 
              className="rounded-xl p-4"
              style={{
                background: "rgba(34, 211, 238, 0.08)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(34, 211, 238, 0.2)",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                  }}
                >
                  <svg className="h-5 w-5" style={{ color: "#22D3EE" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-semibold" style={{ color: "#F8FAFF" }}>
                    Morning Light
                  </p>
                  <p className="text-xs" style={{ color: "rgba(34, 211, 238, 0.6)" }}>
                    {audioError ? "کلیک کنید برای پخش" : "در حال پخش..."}
                  </p>
                </div>
              </div>
              
              <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                برای قطع کردن آهنگ، داخل Console بنویس:
                <br />
                <code 
                  className="font-mono px-1.5 py-0.5 rounded"
                  style={{ 
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#22D3EE",
                  }}
                >
                  metro.stop()
                </code>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
