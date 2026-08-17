/**
 * Developer Console Utility
 * Shows a polished branded banner in production builds only.
 * Does not interfere with development logging.
 */

export function initDeveloperConsole() {
  // Only show banner in production
  if (!import.meta.env.PROD) {
    return;
  }

  try {
    const env = import.meta.env.PROD ? 'Production' : 'Development';

    // === CONSOLE ENTRY 1: BRANDED HEADER ===
    console.log(
      '%c🚇  METRO Tehran\n' +
      '%cTehran Metro Navigation Experience\n' +
      '%cBy Hamed Farazi\n' +
      '%c────────────────────────────────────────\n' +
      '%cLOOKING UNDER THE HOOD?\n' +
      '%cRespect. You found the developer console. 👀\n',
      // 🚇 METRO Tehran
      'font-size: 24px; font-weight: 700; color: #8B5CF6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: -0.3px; line-height: 1.2;',
      // Tehran Metro Navigation Experience
      'font-size: 13px; color: #A855F7; font-weight: 500; line-height: 1.4;',
      // By Hamed Farazi
      'font-size: 12px; color: #93C5FD; font-weight: 400; line-height: 1.4;',
      // Divider
      'color: #3a3a3a; font-size: 11px; line-height: 1.6;',
      // LOOKING UNDER THE HOOD?
      'font-size: 11px; color: #22D3EE; font-weight: 600; letter-spacing: 0.5px; line-height: 1.6;',
      // Respect...
      'font-size: 11px; color: #93C5FD; font-weight: 400; line-height: 1.6;'
    );

    // === CONSOLE ENTRY 2: TECHNICAL INFO BLOCK ===
    console.log(
      '%c VERSION       %c1.0.0%c\n' +
      ' ENVIRONMENT   %c' + env + '%c\n' +
      ' FRAMEWORK     %cReact + TypeScript%c\n' +
      ' MAP ENGINE    %cMapLibre GL%c\n' +
      ' PWA           %cEnabled%c\n' +
      ' RTL           %cNative%c\n' +
      ' ────────────────────────────────────────\n' +
      ' %cGitHub%c        %cgithub.com/HamedFarazi/metroapp%c\n' +
      ' Built with ☕ in Tehran',
      // VERSION label
      'background: #0d0d14; color: #606875; padding: 14px 20px 2px 20px; font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace; font-size: 10px; line-height: 2; border-radius: 8px 8px 0 0; border: 1px solid #1f2937; border-bottom: none;',
      // VERSION value
      'color: #A855F7; font-weight: 600; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // ENVIRONMENT value
      'color: #22D3EE; font-weight: 600; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // FRAMEWORK value
      'color: #F1F5F9; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // MAP ENGINE value
      'color: #F1F5F9; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // PWA value
      'color: #14E6B5; font-weight: 600; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // RTL value
      'color: #F1F5F9; background: #0d0d14;',
      // Newline
      'background: #0d0d14; color: #606875;',
      // GitHub label
      'color: #606875; font-weight: 600; background: #0d0d14;',
      // Spacing
      'background: #0d0d14; color: #606875;',
      // GitHub link value
      'color: #8B5CF6; background: #0d0d14; text-decoration: underline; padding-bottom: 14px; border-radius: 0 0 8px 8px; border: 1px solid #1f2937; border-top: none;',
      // Rest of block (divider + footer)
      'background: #0d0d14; color: #606875;'
    );
  } catch (error) {
    // Silently fail if console is not available
  }
}

/**
 * Suppress debug logs in production.
 * Preserves console.error and console.warn for legitimate issues.
 */
export function suppressProductionDebugLogs() {
  if (!import.meta.env.PROD) {
    return;
  }

  // Store original methods
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // Override console.log to filter debug messages
  console.log = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress known debug patterns (including RTLFix chrome extension noise)
      const debugPatterns = [
        '[RTLFix DEBUG]',
        'CONTENT SCRIPT LOADED',
        'MESSAGE LISTENER REGISTERED',
        'RTLFix: Initializing',
        'RTLFix: Extension is disabled',
        'RTLFix: Extension',
        'MapLibre GL',
        'Workbox',
      ];

      if (debugPatterns.some(pattern => message.includes(pattern))) {
        return; // Suppress
      }
    }
    // Pass through everything else
    originalLog.apply(console, args);
  };

  // Override console.debug to suppress all debug logs in production
  console.debug = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      const debugPatterns = [
        '[RTLFix DEBUG]',
        'CONTENT SCRIPT',
        'MESSAGE LISTENER',
        'RTLFix',
      ];
      if (debugPatterns.some(pattern => message.includes(pattern))) {
        return; // Suppress
      }
    }
    // Pass through non-RTLFix debug messages
    originalDebug.apply(console, args);
  };

  // Suppress console.info in production (can be adjusted)
  console.info = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Allow important info messages
      const importantPatterns = ['PWA', 'Service Worker', 'Update available'];
      if (importantPatterns.some(pattern => message.includes(pattern))) {
        originalInfo.apply(console, args);
      }
    }
  };

  // Keep console.error and console.warn unchanged for legitimate issues
}
