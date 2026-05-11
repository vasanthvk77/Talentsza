import { useEffect, useMemo, useState } from 'react'
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
  const marqueeRegex = /<section[^>]*class="[^"]*marquee-section[^"]*"[^>]*>([\s\S]*?)<\/section>/gi
  if (marqueeRegex.test(html)) {
    return html.replace(marqueeRegex, newMarqueeHtml)
  }

  // Fallback: search for <div class="marquee"> if section wrapper is different
  const divMarqueeRegex = /<div[^>]*class="[^"]*marquee[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  return html.replace(divMarqueeRegex, newMarqueeHtml)
}

function fixSocialLinks(html) {
  // __SOCIAL_LINKS__ is defined in vite.config.js
  const links = typeof __SOCIAL_LINKS__ !== 'undefined' ? __SOCIAL_LINKS__ : {};
  let out = html;
  
  // Replace placeholders with values from Vite config
  if (links.facebookUrl) out = out.replace(/{{VITE_FACEBOOK_URL}}/g, links.facebookUrl);
  if (links.linkedinUrl) out = out.replace(/{{VITE_LINKEDIN_URL}}/g, links.linkedinUrl);
  if (links.instagramUrl) out = out.replace(/{{VITE_INSTAGRAM_URL}}/g, links.instagramUrl);
  if (links.blogUrl) out = out.replace(/{{VITE_BLOG_URL}}/g, links.blogUrl);
  
  return out;
}

function fixTalentSzaText(html) {
  let out = html

  // Replace "Ads Clicks" with "PLACEMENT SUCCESS"
  out = out.replace(/Ads Clicks/g, 'PLACEMENT SUCCESS')

  // Replace "+273%" with "+85%"
  out = out.replace(/\+273%/g, '+85%')

  // Replace the consultant description
  const oldDesc = /We specialize in creating, developing, and managing a brand’s identity to help businesses stand out in the marketplace and connect with their target audience\./g
  const newDesc = 'We specialize in training, mentoring, and placing individuals in roles that match their skills and career goals—helping them stand out and succeed in a competitive job market.'
  out = out.replace(oldDesc, newDesc)

  return out
}

function withNavBridge(html, activeHref) {
  const normalizedHref = activeHref === '/' ? '/' : activeHref.replace(/\/$/, '')

  const injectedCss = `
    <style>
      ${getWebflowThemeCssForIframe()}
      html, body { overflow-x: clip !important; }
      .w-webflow-badge, .webflow-badge, [data-wf-badge], .w-webflow-privacy-badge {
        display: none !important;
      }

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

  const bridgeScript = `
    <script>
      window.SOCIAL_LINKS = ${JSON.stringify(typeof __SOCIAL_LINKS__ !== 'undefined' ? __SOCIAL_LINKS__ : {})};
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

  const baseTag = '<base href="/">'
  
  let out = html
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${baseTag}${injectedCss}</head>`)
  } else {
    out = baseTag + injectedCss + out
  }

  if (/<\/body>/i.test(out)) return out.replace(/<\/body>/i, `${bridgeScript}</body>`)
  return out + bridgeScript
}

export default function WebflowPage({ html, pageKey, onReady }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)

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

  useEffect(() => {
    // Reset loading state when html or pageKey changes
    setIsIframeLoaded(false)
  }, [html, pageKey])

  const srcDoc = useMemo(() => {
    if (!html) return null
    let fixedHtml = fixMarquee(html)
    fixedHtml = fixTalentSzaText(fixedHtml)
    fixedHtml = fixSocialLinks(fixedHtml)
    return withNavBridge(fixedHtml, location.pathname)
  }, [html, location.pathname])

  if (!srcDoc) return null

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#ffffff', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <iframe
        key={pageKey}
        title="Webflow Page"
        onLoad={() => {
          // Small delay to ensure the content is actually painted
          setTimeout(() => {
            setIsIframeLoaded(true)
            if (onReady) onReady()
          }, 100)
        }}
        style={{ 
          width: '100vw', 
          height: '100vh', 
          border: 0, 
          margin: 0, 
          display: 'block',
          opacity: isIframeLoaded ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        srcDoc={srcDoc}
      />
    </div>
  )
}
