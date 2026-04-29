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

  return out
}

