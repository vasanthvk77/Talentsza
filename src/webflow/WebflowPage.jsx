import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function withNavBridge(html) {
  const injectedCss = `
    <style>
      html, body { overflow-x: clip !important; }
      
      /* Make Skilled Team center column sticky */
      @media (min-width: 768px) {
        .team-one-grid {
          align-items: start !important;
          overflow: visible !important;
        }
        .team-wrap, .section-gap, .w-container {
          overflow: visible !important;
        }
        .team-one-center-column {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 35vh !important;
          height: auto !important;
          align-self: start !important;
          z-index: 10;
        }
      }

      /* Remove Webflow "Made in Webflow" badge */
      .w-webflow-badge, .webflow-badge, [data-wf-badge], .w-webflow-privacy-badge {
        display: none !important;
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

  const srcDoc = useMemo(() => (html ? withNavBridge(html) : null), [html])

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

