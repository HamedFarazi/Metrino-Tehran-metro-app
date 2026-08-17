import { useCallback, useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

/** Very subtle network particles — theme primary purple / muted cyan. */
export function ParticlesNetworkBackdrop() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 36,
      detectRetina: true,
      particles: {
        number: {
          value: 28,
          density: { enable: true, width: 420, height: 420 },
        },
        color: {
          // Match dark theme tokens: primary / accent / muted cyan
          value: ["#A78BFA", "#C4B5FD", "#8B95AD", "#6366F1"],
        },
        links: {
          enable: true,
          distance: 110,
          color: "#A78BFA",
          opacity: 0.12,
          width: 0.7,
        },
        move: {
          enable: true,
          speed: 0.25,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        opacity: { value: { min: 0.08, max: 0.22 } },
        size: { value: { min: 0.6, max: 1.4 } },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
          resize: { enable: true },
        },
      },
    }),
    []
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
      aria-hidden
    >
      <ParticlesProvider init={init}>
        <Particles
          id="home-network-particles"
          className="absolute inset-0 h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full"
          options={options}
        />
      </ParticlesProvider>

      <div
        className="absolute inset-x-0 top-0 h-16"
        style={{
          background: "linear-gradient(to bottom, var(--color-background), transparent)",
        }}
      />
    </div>
  );
}
