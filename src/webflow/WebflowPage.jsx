import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getWebflowThemeCssForIframe } from '../theme.js'

const MARQUEE_ITEMS = [
  'We Are Hiring',
  'Start Your Career',
  'Join Our Programs',
  'Build Your Future',
  'Global Opportunities',
  'Learn • Grow',
  'Get Placed'
]

const PLUS_ICON = 'https://cdn.prod.website-files.com/6944f1597ac277b25076ccab/694bccf221ad7630e6d4f770_plus.svg'

function fixMarquee(html) {
  // Construct the new marquee content
  const content = MARQUEE_ITEMS.map(item => `
    <div class="marquee-text">${item}</div>
    <img src="${PLUS_ICON}" alt="plus" width="100" height="100" class="marquee-img" />
  `).join('')

  const newMarqueeHtml = `
    <section class="marquee-section">
      <div class="marquee">
        <div class="marquee-wrap">${content}</div>
        <div class="marquee-wrap">${content}</div>
      </div>
    </section>
  `

  // Replace any existing marquee section
  // Note: Webflow often uses <section class="marquee-section"> or <div class="marquee">
  // We'll try to find the container and replace its inner content or the whole section.
  const marqueeRegex = /<section[^>]*class="[^"]*marquee-section[^"]*"[^>]*>([\s\S]*?)<\/section>/gi
  if (marqueeRegex.test(html)) {
    return html.replace(marqueeRegex, newMarqueeHtml)
  }

  // Fallback: search for <div class="marquee"> if section wrapper is different
  const divMarqueeRegex = /<div[^>]*class="[^"]*marquee[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  return html.replace(divMarqueeRegex, newMarqueeHtml)
}

function fixTalentSzaText(html) {
  let out = html

  // Replace "Ads Clicks" with "PLACEMENT SUCCESS"
  out = out.replace(/Ads Clicks/g, 'PLACEMENT SUCCESS')

  // Replace "+273%" with "+85%" (specifically in the counter context if possible, but global is safer here)
  out = out.replace(/\+273%/g, '+85%')

  // Replace the consultant description with the training/placement description
  const oldDesc = /We specialize in creating, developing, and managing a brand’s identity to help businesses stand out in the marketplace and connect with their target audience\./g
  const newDesc = 'We specialize in training, mentoring, and placing individuals in roles that match their skills and career goals—helping them stand out and succeed in a competitive job market.'
  out = out.replace(oldDesc, newDesc)

  return out
}

function withNavBridge(html, activeHref) {
  // Normalize activeHref for matching (ensure it matches what's in the navbar)
  const normalizedHref = activeHref === '/' ? '/' : activeHref.replace(/\/$/, '')

  const injectedCss = `
    <style>
      ${getWebflowThemeCssForIframe()}
      html, body { overflow-x: clip !important; }
      /* Remove Webflow "Made in Webflow" badge */
      .w-webflow-badge, .webflow-badge, [data-wf-badge], .w-webflow-privacy-badge {
        display: none !important;
      }

      /* Active Nav Link Highlight - Pill Shaped */
      .nav-link[href="${normalizedHref}"],
      .nav-link[href="${normalizedHref}/"],
      .nav-link.w--current {
        background-color: var(--accent) !important;
        color: #ffffff !important;
        border-radius: 100px !important;
        padding-left: 20px !important;
        padding-right: 20px !important;
        margin-top: auto !important;
        margin-bottom: auto !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 45px !important;
        transition: all 0.3s ease !important;
      }
    </style>
  `

  // Intercept clicks inside the iframe and tell the parent router to navigate.
  // We only handle internal links (href starts with `/`).
  const bridgeScript = `
    <script>
      window.addEventListener('click', function(e) {
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!a) return;
        var href = a.getAttribute && a.getAttribute('href');
        if (!href) return;
        if (href.charAt(0) !== '/') return;
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
        e.preventDefault();
        parent.postMessage({ type: 'talentsza-nav', href: href }, '*');
      }, true);
    </script>
  `

  let out = html
  // Ensure CSS is inside <head> so it applies early.
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${injectedCss}</head>`)
  } else {
    out = injectedCss + out
  }

  // Place the bridge at the end of body so it runs after Webflow markup is present.
  if (/<\/body>/i.test(out)) return out.replace(/<\/body>/i, `${bridgeScript}</body>`)
  return out + bridgeScript
}

export default function WebflowPage({ html, pageKey }) {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)

  useEffect(() => {
    function onMessage(ev) {
      const data = ev.data
      if (!data || data.type !== 'talentsza-nav') return
      if (!data.href || typeof data.href !== 'string') return
      navigate(data.href)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  const srcDoc = useMemo(() => {
    if (!html) return null
    let fixedHtml = fixMarquee(html)
    fixedHtml = fixTalentSzaText(fixedHtml)
    return withNavBridge(fixedHtml, location.pathname)
  }, [html, location.pathname])

  if (!srcDoc) return <div ref={containerRef}>Loading...</div>

  return (
    <iframe
      key={pageKey}
      title="Webflow Page"
      style={{ width: '100vw', height: '100vh', border: 0, margin: 0, display: 'block' }}
      srcDoc={srcDoc}
    />
  )
}

