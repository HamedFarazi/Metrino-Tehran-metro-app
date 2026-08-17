/**
 * Global Metro Developer Console Commands
 * Available in production only
 */

export function initMetroCommands() {
  if (!import.meta.env.PROD) {
    return;
  }

  const metro = {
    stop: () => {
      const audio = (window as any).__metroAudio as HTMLAudioElement | undefined;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        console.log(
          '%c🚇 METRO Tehran\n' +
          '%c────────────────────────────────────────\n' +
          '%cMusic stopped.\n' +
          '%cAudio player has been reset.',
          'font-size: 14px; font-weight: 600; color: #8B5CF6;',
          'color: #3a3a3a; font-size: 11px;',
          'color: #22D3EE; font-size: 12px;',
          'color: #93C5FD; font-size: 11px;'
        );
      } else {
        console.log(
          '%c🚇 METRO Tehran\n' +
          '%cNo audio is currently playing.',
          'font-size: 14px; font-weight: 600; color: #8B5CF6;',
          'color: rgba(255, 255, 255, 0.6); font-size: 11px;'
        );
      }
    },

    help: () => {
      console.log(
        '%c🚇 METRO Tehran\n' +
        '%c────────────────────────────────────────\n' +
        '%cAvailable commands:\n' +
        '%cmetro.stop()%c     Stop the music\n' +
        '%cmetro.help()%c     Show available commands\n' +
        '%cmetro.about()%c    About the developer\n' +
        '%c────────────────────────────────────────',
        // Title
        'font-size: 14px; font-weight: 600; color: #8B5CF6; font-family: -apple-system, sans-serif;',
        // Divider
        'color: #3a3a3a; font-size: 11px;',
        // "Available commands:"
        'color: #22D3EE; font-size: 12px; font-weight: 600;',
        // metro.stop()
        'color: #A855F7; font-size: 11px; font-family: "SF Mono", Monaco, monospace; font-weight: 600;',
        'color: rgba(255, 255, 255, 0.6); font-size: 11px;',
        // metro.help()
        'color: #A855F7; font-size: 11px; font-family: "SF Mono", Monaco, monospace; font-weight: 600;',
        'color: rgba(255, 255, 255, 0.6); font-size: 11px;',
        // metro.about()
        'color: #A855F7; font-size: 11px; font-family: "SF Mono", Monaco, monospace; font-weight: 600;',
        'color: rgba(255, 255, 255, 0.6); font-size: 11px;',
        // Bottom divider
        'color: #3a3a3a; font-size: 11px;'
      );
    },

    about: () => {
      console.log(
        '%c🚇 METRO Tehran\n' +
        '%c────────────────────────────────────────\n' +
        '%cHamed Farazi\n' +
        '%cFrontend Developer\n\n' +
        '%cGitHub:%c https://github.com/HamedFarazi\n' +
        '%c────────────────────────────────────────\n' +
        '%cBuilt with ☕ in Tehran',
        // Title
        'font-size: 14px; font-weight: 600; color: #8B5CF6;',
        // Divider
        'color: #3a3a3a; font-size: 11px;',
        // Name
        'color: #F8FAFF; font-size: 13px; font-weight: 600;',
        // Role
        'color: #A855F7; font-size: 12px;',
        // GitHub label
        'color: #22D3EE; font-size: 11px; font-weight: 600;',
        // GitHub URL
        'color: #8B5CF6; font-size: 11px; text-decoration: underline;',
        // Divider
        'color: #3a3a3a; font-size: 11px;',
        // Footer
        'color: rgba(255, 255, 255, 0.5); font-size: 11px; font-style: italic;'
      );
    },
  };

  // Expose to window
  (window as any).metro = metro;

  // Log welcome message
  console.log(
    '%c🚇 Developer commands available!\n' +
    '%cType %cmetro.help()%c to see available commands.',
    'color: #8B5CF6; font-size: 12px; font-weight: 600;',
    'color: rgba(255, 255, 255, 0.6); font-size: 11px;',
    'color: #22D3EE; font-size: 11px; font-family: monospace; font-weight: 600;',
    'color: rgba(255, 255, 255, 0.6); font-size: 11px;'
  );
}
