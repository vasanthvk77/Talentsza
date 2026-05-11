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
          <div class="icon"></div>
        </a>
        <a href="\${links.linkedinUrl || 'https://www.linkedin.com/'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon"></div>
        </a>
        <a href="\${links.instagramUrl || 'https://www.instagram.com/'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon"></div>
        </a>
        <a href="\${links.blogUrl || 'https://www.talentsza.com/blog'}" target="_blank" class="footer-social-link w-inline-block">
          <div class="icon"></div>
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

