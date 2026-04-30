/**
 * Centralized theme tokens + CSS injection.
 *
 * Goal: one place to update colors/font sizing that affects:
 * - the React app itself
 * - Webflow pages rendered inside an iframe (srcDoc)
 * - Webflow pages rendered directly into the DOM (embedded)
 */

export const theme = {
  light: {
    text: '#6b6375',
    textH: '#08060d',
    bg: '#fff',
    border: '#e5e4e7',
    codeBg: '#fff4eb',
    accent: '#ED6D00',
    accentBg: 'rgba(237, 109, 0, 0.1)',
    accentBorder: 'rgba(237, 109, 0, 0.5)',
    socialBg: 'rgba(237, 109, 0, 0.1)',
    shadow:
      'rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px',
  },
  dark: {
    text: '#9ca3af',
    textH: '#f3f4f6',
    bg: '#16171d',
    border: '#2e303a',
    codeBg: '#2a1f18',
    accent: '#FF8A29',
    accentBg: 'rgba(255, 138, 41, 0.15)',
    accentBorder: 'rgba(255, 138, 41, 0.5)',
    socialBg: 'rgba(255, 138, 41, 0.15)',
    shadow:
      'rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px',
  },
  fonts: {
    sans: "system-ui, 'Segoe UI', Roboto, sans-serif",
    heading: "system-ui, 'Segoe UI', Roboto, sans-serif",
    mono: 'ui-monospace, Consolas, monospace',
  },
  typography: {
    baseFontSizeDesktop: '18px',
    baseFontSizeMobile: '16px',
    lineHeight: '145%',
    letterSpacing: '0.18px',
  },
}

const STYLE_ID = 'talentsza-theme-style'

export function getThemeVarsCss() {
  const light = theme.light
  const dark = theme.dark

  // Keep this as "real CSS" (not JS-in-CSS) so it can be injected into iframes too.
  return `
    :root, body {
      --text: ${light.text};
      --text-h: ${light.textH};
      --bg: ${light.bg};
      --border: ${light.border};
      --code-bg: ${light.codeBg};
      --accent: ${light.accent};
      --accent-bg: ${light.accentBg};
      --accent-border: ${light.accentBorder};
      --social-bg: ${light.socialBg};
      --shadow: ${light.shadow};

      --sans: ${theme.fonts.sans};
      --heading: ${theme.fonts.heading};
      --mono: ${theme.fonts.mono};
      
      /* Override Webflow's native CSS variables that power the green color */
      --secondary-color: ${light.accent} !important;
      --secondary-color-text: #ffffff !important;

      font: ${theme.typography.baseFontSizeDesktop}/${theme.typography.lineHeight} var(--sans);
      letter-spacing: ${theme.typography.letterSpacing};
      color-scheme: light dark;
      color: var(--text);
      background: var(--bg);
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media (max-width: 1024px) {
      :root, body {
        font-size: ${theme.typography.baseFontSizeMobile};
      }
    }

    @media (prefers-color-scheme: dark) {
      :root, body {
        --text: ${dark.text};
        --text-h: ${dark.textH};
        --bg: ${dark.bg};
        --border: ${dark.border};
        --code-bg: ${dark.codeBg};
        --accent: ${dark.accent};
        --accent-bg: ${dark.accentBg};
        --accent-border: ${dark.accentBorder};
        --social-bg: ${dark.socialBg};
        --shadow: ${dark.shadow};
        
        --secondary-color: ${dark.accent} !important;
        --secondary-color-text: #ffffff !important;
      }

      #social .button-icon {
        filter: invert(1) brightness(2);
      }
    }
  `
}

export function getThemeGlobalOverridesCss() {
  // Webflow exports often wrap the whole page in a `body.global-bg` element.
  // Only force the shared page background/font stack.
  // Do not override heading/body text colors globally because Webflow uses
  // section-specific light/dark text styles that must remain intact.
  return `
    html, body {
      background: var(--bg) !important;
      font-family: var(--sans) !important;
    }

    body.global-bg {
      background: var(--bg) !important;
    }

    /* Adjust text color to ensure contrast against orange */
    [data-wf--button--variant="secondary-bg"] .button-text,
    [data-wf--button--variant="secondary-bg"] .button-text-hover,
    [data-wf--button--variant="global-bg"] .button-text,
    [data-wf--button--variant="global-bg"] .button-text-hover {
      color: #fff !important;
    }

    /* Scale down the footer logo so it matches the header logo's aesthetic */
    .footer-logo {
      max-width: 140px !important;
      height: auto !important;
    }

    /* Remove background from logo containers */
    .logo-wrap, .logo-link, .logo, .footer-logo-wrap {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      padding: 0 !important;
    }

    /* 
       FIX: The service-one-icon is an <img> pointing to a green SVG on the CDN.
       Since we can't change the SVG's internal fill color via CSS variables,
       we use it as a mask and set the background to our theme's accent color.
    */
    .service-one-icon {
      background-color: var(--accent) !important;
      -webkit-mask: url("https://cdn.prod.website-files.com/6944f1597ac277b25076ccab/69a18049856b05e6278d8180_secondary-left-icon.svg") no-repeat center / contain !important;
      mask: url("https://cdn.prod.website-files.com/6944f1597ac277b25076ccab/69a18049856b05e6278d8180_secondary-left-icon.svg") no-repeat center / contain !important;
      /* Hide the original green image content while keeping the element size */
      content: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") !important;
    }
  `
}

export function getWebflowThemeCssForIframe() {
  return `
    :root, body {
      --text: ${theme.light.text};
      --text-h: ${theme.light.textH};
      --bg: ${theme.light.bg};
      --border: ${theme.light.border};
      --code-bg: ${theme.light.codeBg};
      --accent: ${theme.light.accent};
      --accent-bg: ${theme.light.accentBg};
      --accent-border: ${theme.light.accentBorder};
      --social-bg: ${theme.light.socialBg};
      --shadow: ${theme.light.shadow};

      --sans: ${theme.fonts.sans};
      --heading: ${theme.fonts.heading};
      --mono: ${theme.fonts.mono};

      font: ${theme.typography.baseFontSizeDesktop}/${theme.typography.lineHeight} var(--sans);
      letter-spacing: ${theme.typography.letterSpacing};
      color-scheme: light;
      color: var(--text);
      background: var(--bg);
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media (max-width: 1024px) {
      :root, body {
        font-size: ${theme.typography.baseFontSizeMobile};
      }
    }

    ${getThemeGlobalOverridesCss()}
  `
}

export function ensureThemeStyleInjected() {
  if (typeof document === 'undefined') return

  const existing = document.getElementById(STYLE_ID)
  const cssText = `${getThemeVarsCss()}\n${getThemeGlobalOverridesCss()}`

  if (!existing) {
    const styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    styleEl.textContent = cssText
    document.head.appendChild(styleEl)
    return
  }

  if (existing.textContent !== cssText) existing.textContent = cssText
}

// Inject immediately on import so variables are present before the first paint.
ensureThemeStyleInjected()
