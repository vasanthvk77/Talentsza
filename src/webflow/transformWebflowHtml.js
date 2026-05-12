import testimonials from '../testimonialsData.js'

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Webflow exports sometimes use relative asset paths like:
 *   src="assets/cdn.prod.website-files.com/..."
 * In a Vite SPA those can break, so we rewrite them back to absolute CDN URLs.
 */
export function transformWebflowHtml(html) {
  let out = html

  // Replace old Webflow logos with the new Talentsza logo
  out = out.replace(
    /https:\/\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?logo\.svg/g,
    '/TalentszaLog.svg'
  )
  out = out.replace(
    /https:\/\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?white-logo\.svg/g,
    '/TalentszaLog.svg'
  )
  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?logo\.svg\2/g,
    '$1=$2/TalentszaLog.svg$2'
  )
  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?white-logo\.svg\2/g,
    '$1=$2/TalentszaLog.svg$2'
  )
  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?footer-logo\.svg\2/g,
    '$1=$2/TalentszaLog.svg$2'
  )
  out = out.replace(
    /https:\/\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?footer-logo\.svg/g,
    '/TalentszaLog.svg'
  )

  // Replace favicon links
  out = out.replace(
    /https:\/\/cdn\.prod\.website-files\.com\/[^"']+\/([^"']+-)?favicon[^"']+\.(png|ico|svg)/g,
    '/TalentszaLog.svg?v=2'
  )

  // Globally replace the lime green color in any inline styles or SVGs across ALL files
  out = out.replace(/#def25c/gi, '#ED6D00')

  // Global Branding Text Replacement
  out = out.replace(/Mercket/g, 'Talentsza')
  out = out.replace(/mercket\.webflow\.io/g, 'talentsza.com')
  out = out.replace(/Mercket - Webflow HTML website template/g, 'Talentsza - Unlock Global Opportunities')

  // Replace placeholder contact info
  out = out.replace(/example@pbmit\.com/g, 'info@talentsza.com')
  out = out.replace(/2972 Westheimer Rd\. Santa Ana, Illinoi/g, 'Coimbatore, Tamil Nadu, India')
  out = out.replace(/\+1-234-567-89/g, '+91-96266 26866')
  out = out.replace(/Copyright © 2025/g, 'Copyright © 2026')

  // Remove Webflow credits
  out = out.replace(/, Powered by\s*<a[^>]*><\/a>/gi, '')
  out = out.replace(/<a[^>]*class="[^"]*w-webflow-badge[^"]*"[^>]*>.*?<\/a>/gi, '')

  // Aggressive Logo Suppression: Replace ANY asset that contains 'logo' and 'mercket' or the legacy CDN ID
  // with our new Talentsza logo.
  out = out.replace(
    /https:\/\/cdn\.prod\.website-files\.com\/6944f1597ac277b25076ccab\/[^"']+_logo\.svg/gi,
    '/TalentszaLog.svg'
  )

  // Inject our CSS overrides directly into the <head> of every HTML file
  // This guarantees the Webflow stylesheet's --secondary-color gets overridden instantly
  out = out.replace(
    '</head>',
    `
    <style>
      :root, body {
        --secondary-color: #ED6D00 !important;
        --secondary-color-text: #ffffff !important;
      }
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      /* Prevent double-text rendering on buttons before Webflow IX2 initializes */
      .button-text-hover {
        display: none !important;
      }
      .w-mod-ix .button-text-hover {
        display: block !important;
      }
      /* Standardize button text weight to prevent "over-bolding" */
      .button-text, .button-text-hover {
        font-weight: 500 !important;
        -webkit-font-smoothing: antialiased;
        letter-spacing: 0px !important;
      }
    </style>
    </head>`
  )

  // Fix asset references that point to the repo-root `assets/...` folder.
  // Some exported nested pages reference it as `../assets/...`.
  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/cdn\.prod\.website-files\.com\//g,
    (_match, attr, quote) => `${attr}=${quote}https://cdn.prod.website-files.com/`,
  )

  // Home page export uses relative URLs for third-party JS:
  //   src="assets/d3e54v...cloudfront.net/js/jquery-...js"
  //   src="assets/ajax.googleapis.com/ajax/libs/webfont/..."
  // When rendered in an iframe srcDoc, those relative URLs will 404,
  // so rewrite them to absolute origins.
  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/d3e54v103j8qbb\.cloudfront\.net\//g,
    (_match, attr, quote) => `${attr}=${quote}https://d3e54v103j8qbb.cloudfront.net/`,
  )

  out = out.replace(
    /(src|href)=(['"])(?:\.\.\/|\.\/)?assets\/ajax\.googleapis\.com\//g,
    (_match, attr, quote) => `${attr}=${quote}https://ajax.googleapis.com/`,
  )

  // Static pages (handle both `about-us.html` and `../about-us.html`)
  const replacements = [
    ['index.html', '/'],
    ['utility-pages/style-guide.html', '/utility-pages/style-guide'],
    ['utility-pages/licenses.html', '/utility-pages/licenses'],
    ['utility-pages/changelog.html', '/utility-pages/changelog'],
    ['about-us.html', '/about-us'],
    ['services.html', '/services'],
    ['projects.html', '/projects'],
    ['blog.html', '/blog'],
    ['contact.html', '/contact'],
    ['career.html', '/career'],
    ['faq-page.html', '/faq-page'],
    ['our-team.html', '/our-team'],
    ['404.html', '/404'],
  ]

  for (const [from, to] of replacements) {
    // href="about-us.html"
    out = out.replace(
      new RegExp(`href=(['"])${escapeRegExp(from)}\\1`, 'g'),
      `href=$1${to}$1`,
    )
    // href="../about-us.html"
    out = out.replace(
      new RegExp(`href=([''])\\.\\.\\/${escapeRegExp(from)}\\1`, 'g'),
      `href=$1${to}$1`,
    )
  }

  // Dynamic-ish pages
  const dynamicReplacements = [
    ['team/', '/team/'],
    ['service/', '/service/'],
    ['project/', '/project/'],
    ['post/', '/post/'],
  ]

  for (const [fromDir, toDir] of dynamicReplacements) {
    // href="team/ronald-benson.html" -> href="/team/ronald-benson"
    out = out.replace(
      new RegExp(`href=(['"])${escapeRegExp(fromDir)}([^'"]+)\\.html\\1`, 'g'),
      `href=$1${toDir}$2$1`,
    )
    // href="../team/ronald-benson.html"
    out = out.replace(
      new RegExp(
        `href=([''])\\.\\.\\/${escapeRegExp(fromDir)}([^'"]+)\\.html\\1`,
        'g',
      ),
      `href=$1${toDir}$2$1`,
    )
  }

  // Inject a script to rotate the team-down-arrow based on scroll direction
  const scrollScript = `
<script>
  (function() {
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    window.addEventListener('scroll', function() {
      let st = window.pageYOffset || document.documentElement.scrollTop;
      const arrows = document.querySelectorAll('.team-down-arrow');
      arrows.forEach(arrow => {
        if (!arrow.style.transition) {
           arrow.style.transition = 'transform 0.3s ease';
        }
        const textEl = arrow.nextElementSibling;
        if (st > lastScrollTop) {
          // downscroll
          arrow.style.transform = 'translateY(0) rotate(0deg)';
          if (textEl) textEl.innerText = 'Scroll Down';
        } else {
          // upscroll
          arrow.style.transform = 'translateY(-10px) rotate(180deg)';
          if (textEl) textEl.innerText = 'Scroll Up';
        }
      });
      lastScrollTop = st <= 0 ? 0 : st;
    }, false);

    // Replace footer social icons with configurable links from Vite
    const footerSocials = document.querySelector('.footer .footer-social-icons');
    if (footerSocials) {
      // __SOCIAL_LINKS__ is defined in vite.config.js
      const links = typeof __SOCIAL_LINKS__ !== 'undefined' ? __SOCIAL_LINKS__ : {};
      footerSocials.innerHTML = \`
        <a href="\${links.facebookUrl || 'https://www.facebook.com/'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon">
            <svg class="social-icon-svg" viewBox="0 0 24 24" fill="#1877F2"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
          </div>
        </a>
        <a href="\${links.linkedinUrl || 'https://www.linkedin.com/'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon">
            <svg class="social-icon-svg" viewBox="0 0 24 24" fill="#0A66C2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </div>
        </a>
        <a href="\${links.instagramUrl || 'https://www.instagram.com/'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon">
            <svg class="social-icon-svg" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="trans-insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#f09433" /><stop offset="25%" style="stop-color:#e6683c" />
                  <stop offset="50%" style="stop-color:#dc2743" /><stop offset="75%" style="stop-color:#cc2366" />
                  <stop offset="100%" style="stop-color:#bc1888" />
                </linearGradient>
              </defs>
              <path fill="url(#trans-insta-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.668.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.947.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.669-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4.162 4.162 0 110-8.324A4.162 4.162 0 0112 16zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
        </a>
        <a href="\${links.blogUrl || 'https://www.talentsza.com/blog'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon">
            <svg class="social-icon-svg" viewBox="0 0 24 24" fill="#FF5722"><path d="M11.905 15c.677 0 1.258-.24 1.742-.724.484-.484.726-1.065.726-1.742V10.15c0-.677-.242-1.258-.726-1.742a2.38 2.38 0 0 0-1.742-.726c.677 0 1.258-.24 1.742-.724a2.38 2.38 0 0 0 .726-1.742V2.466c0-.677-.242-1.258-.726-1.742A2.38 2.38 0 0 0 11.905 0H4.095c-.677 0-1.258.24-1.742.724a2.38 2.38 0 0 0-.726 1.742V12.53c0 .677.242 1.258.726 1.742a2.38 2.38 0 0 0 1.742.724h7.81h.001Zm-7.81-12.534h7.81v2.466h-7.81V2.466Zm0 5.216h7.81V12.53h-7.81V7.682Z"/></svg>
          </div>
        </a>
      \`;
    }
  })();
</script>
</body>
  `;
  out = out.replace('</body>', scrollScript);

  // Dynamic Testimonials Injection
  // We generate 50 slides from our external src/testimonialsData.js file
  const testimonialSlidesHtml = testimonials.map(t => `
    <div class="testimonial-slide w-slide">
      <div class="testimonial-one">
        <div class="testimonial-one-desc">“${t.topic}”</div>
        <div class="testimonial-one-detail-wrap">
          <div class="testimonial-one-image-wrap">
            <img loading="lazy" src="${t.img}" alt="${t.name}" class="testimonial-one-image">
          </div>
          <div class="testimonial-one-title-wrap">
            <div class="text-style-h4">${t.name}</div>
            <div class="category">${t.role}</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Replace the placeholder slides in the testimonial slider mask
  // We match the mask container, all its inner slides, and the closing tag, 
  // ensuring we stop exactly before the testimonial arrows.
  out = out.replace(
    /(<div[^>]*class="[^"]*testimonial-list w-slider-mask[^"]*"[^>]*>)([\s\S]+?)(<\/div>)(?=[\s\n]*<div[^>]*class="[^"]*testimonial-slider-arrow)/i,
    `$1${testimonialSlidesHtml}$3`
  )

  return out
}

