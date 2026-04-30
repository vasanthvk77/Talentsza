import { transformWebflowHtml } from './transformWebflowHtml'

// Webflow exports are copied into `Talentsza/public/webflow-pages/`.
const WEBFLOW_PAGES_BASE = '/webflow-pages'

function normalizePathname(p) {
  if (!p) return '/'
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

export function getWebflowHtmlUrl(pathname, params = {}) {
  const normalized = normalizePathname(pathname)

  // Static pages
  switch (normalized) {
    case '/':
      return `${WEBFLOW_PAGES_BASE}/index.html`
    case '/about-us':
      return `${WEBFLOW_PAGES_BASE}/about-us.html`
    case '/services':
      return `${WEBFLOW_PAGES_BASE}/services.html`
    case '/projects':
      return `${WEBFLOW_PAGES_BASE}/projects.html`
    case '/blog':
      return `${WEBFLOW_PAGES_BASE}/blog.html`
    case '/contact':
      return `${WEBFLOW_PAGES_BASE}/contact.html`
    case '/career':
      return `${WEBFLOW_PAGES_BASE}/career.html`
    case '/faq-page':
      return `${WEBFLOW_PAGES_BASE}/faq-page.html`
    case '/our-team':
      return `${WEBFLOW_PAGES_BASE}/our-team.html`

    case '/utility-pages/style-guide':
      return `${WEBFLOW_PAGES_BASE}/utility-pages/style-guide.html`
    case '/utility-pages/licenses':
      return `${WEBFLOW_PAGES_BASE}/utility-pages/licenses.html`
    case '/utility-pages/changelog':
      return `${WEBFLOW_PAGES_BASE}/utility-pages/changelog.html`

    case '/404':
      return `${WEBFLOW_PAGES_BASE}/404.html`
  }

  // Dynamic pages
  const { kind, slug } = params
  if (!kind || !slug) return null

  if (kind === 'team') return `${WEBFLOW_PAGES_BASE}/team/${slug}.html`
  if (kind === 'service') return `${WEBFLOW_PAGES_BASE}/service/${slug}.html`
  if (kind === 'project') return `${WEBFLOW_PAGES_BASE}/project/${slug}.html`
  if (kind === 'post') return `${WEBFLOW_PAGES_BASE}/post/${slug}.html`

  return null
}

export async function loadWebflowHtml(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load Webflow HTML: ${url} (${res.status})`)
  }
  const rawHtml = await res.text()
  return transformWebflowHtml(rawHtml)
}

