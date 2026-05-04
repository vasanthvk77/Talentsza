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
    purple: '#3e3640ff',
    footerBg: '#23212f',
    footerTextColor: '#ffffff',
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
    sans: "'DM Sans', system-ui, -apple-system, sans-serif",
    heading: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
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

    /* Adjust text and arrow color to ensure contrast against orange */
    [data-wf--button--variant="secondary-bg"] .button-text,
    [data-wf--button--variant="secondary-bg"] .button-text-hover,
    [data-wf--button--variant="global-bg"] .button-text,
    [data-wf--button--variant="global-bg"] .button-text-hover {
      color: #fff !important;
    }

    .button-arrow {
      filter: brightness(0) invert(1) !important; /* Default white */
    }

    /* If the button has a white background, make the arrow orange */
    [data-wf--button--variant="white-bg"] .button-arrow,
    .button-wrap[data-wf--button--variant="white-bg"] .button-arrow {
      /* Filter to convert black to #ED6D00 */
      filter: brightness(0) saturate(100%) invert(47%) sepia(93%) saturate(1918%) hue-rotate(360deg) brightness(98%) contrast(98%) !important;
    }

    /* Professional Fixed Header with Glassmorphism */
    .header {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      z-index: 1000 !important;
      background: rgba(164, 164, 164, 0.8) !important; /* Semi-transparent dark */
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      transition: all 0.3s ease !important;
    }

    /* Mobile hamburger dropdown nav — same glass background as header */
    .nav-one-menu.w-nav-menu[data-nav-menu-open],
    .w-nav-menu[data-nav-menu-open] {
      background: rgba(164, 164, 164, 0.92) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    /* Remove background from logo containers and nav menu - Targeted specifically to avoid breaking buttons */
    .logo-wrap, .logo-link, .logo, .footer-logo-wrap,
    .nav-one-menu, .nav-menu {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* Ensure nav links are transparent but don't force padding which breaks button alignment */
    .nav-link:not(.button-link) {
      background: transparent !important;
    }

    /* Targeted removal of the giant "M" watermark and legacy background artifacts */
    /* Excluded .breadcrumb-section and .hero-one-section to keep actual content backgrounds */
    .project-one-bg-image,
    .counter-three-bg-pattern,
    .service-overlay,
    .title-overlay,
    .text-title-overlay {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }

    /* Strip decorative background images from specific containers known to have watermarks */
    .home-one-service-wrapper,
    .home-one-service-wrap,
    .service-one-list-wrap,
    .service-section,
    .section-gap,
    .footer-bg,
    .global-bg {
      background-image: none !important;
    }

    /* Footer background — outer shell white, inner wrap uses footerBg token */
    footer.footer,
    .footer {
      background-color: #eceee6 !important;
      background-image: none !important;
    }

    .footer-wrap,
    .footer-inner {
      background: ${theme.light.footerBg} !important;
    }

    .footer-bottom {
      background: transparent !important;
    }

    .footer-link-text,
    .footer-contact-text,
    .footer-bottom-link-text,
    .footer-bottom-link {
      color: ${theme.light.footerTextColor} !important;
    }

    /* Compensate for fixed header on sub-pages (Home page usually handles this in hero) */
    body:not(.home) .header + .section, 
    body:not(.home) .header + section,
    body:not(.home) .breadcrumb-section {
      padding-top: 100px !important;
    }

    /* Specific pseudo-element cleanup — exclude Webflow nav/slider icons which rely on ::before/::after */
    section::before, section::after,
    div:not(.w-icon-nav-menu):not(.w-icon-slider-left):not(.w-icon-slider-right):not(.w-icon-dropdown-toggle):not(.down-icon)::before,
    div:not(.w-icon-nav-menu):not(.w-icon-slider-left):not(.w-icon-slider-right):not(.w-icon-dropdown-toggle):not(.down-icon)::after {
      content: none !important;
      display: none !important;
      background: none !important;
    }

    /* Target specific image-based watermarks found in the HTML */
    .project-one-bg-image,
    .counter-three-bg-pattern,
    img[class*="pattern"],
    img[class*="shape"],
    img[class*="bg-image"],
    img[class*="Footer-bg"] {
      display: none !important;
      opacity: 0 !important;
    }

    /* Increased logo height globally and shifted upwards */
    .logo {
      height: 70px !important;
      width: 90px !important;
      max-width: none !important;
      margin-top: -10px !important;
    }

    /* Scale the footer logo accordingly */
    .footer-logo {
      height: 130px !important;
      width: auto !important;
      max-width: none !important;
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

    /* Convert the team-down-arrow image into a purple icon using CSS mask */
    .team-down-arrow {
      background-color: ${theme.light.purple} !important;
      -webkit-mask: url("https://cdn.prod.website-files.com/6944f1597ac277b25076ccab/696f6384f6adb097c3984ee0_arrow-global.svg") no-repeat center / contain !important;
      mask: url("https://cdn.prod.website-files.com/6944f1597ac277b25076ccab/696f6384f6adb097c3984ee0_arrow-global.svg") no-repeat center / contain !important;
      content: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") !important;
    }

    /* Fix testimonial slider arrows visibility on mobile */
    .testimonial-slider-arrow {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      z-index: 100 !important;
    }

    .slider-arrow {
      display: block !important;
      opacity: 1 !important;
    }

    @media (max-width: 767px) {
      .testimonial-slider-arrow {
        width: 40px !important;
        height: 40px !important;
        bottom: 20px !important;
        top: auto !important;
      }
      .testimonial-slider-arrow.w-slider-arrow-left {
        right: 70px !important;
        left: auto !important;
      }
      .testimonial-slider-arrow.w-slider-arrow-right {
        right: 20px !important;
        left: auto !important;
      }
    }

    /* Marquee Fixes - Professional Scroll without Overlapping */
    .marquee-section {
      overflow: hidden !important;
      background: var(--bg) !important;
      padding: 60px 0 !important;
      width: 100vw !important;
      position: relative !important;
      left: 50% !important;
      right: 50% !important;
      margin-left: -50vw !important;
      margin-right: -50vw !important;
    }

    .marquee {
      display: flex !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      user-select: none !important;
      width: 100% !important;
    }

    .marquee-wrap {
      display: flex !important;
      flex-shrink: 0 !important;
      min-width: 100% !important;
      justify-content: space-around !important;
      align-items: center !important;
      animation: scroll-marquee 40s linear infinite !important;
    }

    @keyframes scroll-marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }

    /* Ensure no gaps or overlapping during animation */
    .marquee:hover .marquee-wrap {
      animation-play-state: paused !important;
    }

    .marquee-text {
      font-family: var(--heading) !important;
      font-size: clamp(60px, 10vw, 150px) !important;
      line-height: 1 !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      color: rgba(0, 0, 0, 0.04) !important;
      margin: 0 50px !important;
      white-space: nowrap !important;
    }

    @media (prefers-color-scheme: dark) {
      .marquee-text {
        color: rgba(255, 255, 255, 0.04) !important;
      }
    }

    .marquee-img {
      width: 60px !important;
      height: 60px !important;
      opacity: 0.1 !important;
      flex-shrink: 0 !important;
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
