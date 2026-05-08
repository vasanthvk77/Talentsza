import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import WebflowPage from './webflow/WebflowPage'
import { getWebflowHtmlUrl, loadWebflowHtml } from './webflow/webflowPages'

function StaticWebflowRoute({ pathName }) {
  const [html, setHtml] = useState(null)

  const url = useMemo(() => getWebflowHtmlUrl(pathName), [pathName])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        if (!url) throw new Error('No url')
        const loaded = await loadWebflowHtml(url)
        if (!cancelled) setHtml(loaded)
      } catch {
        const notFoundUrl = getWebflowHtmlUrl('/404')
        const loaded404 = await loadWebflowHtml(notFoundUrl)
        if (!cancelled) setHtml(loaded404)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url])

  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey={pathName} />
}

function NotFound() {
  const [html, setHtml] = useState(null)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const notFoundUrl = getWebflowHtmlUrl('/404')
      const loaded = await loadWebflowHtml(notFoundUrl)
      if (!cancelled) setHtml(loaded)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])
  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey="not-found" />
}

function TeamRoute() {
  const { slug } = useParams()
  const [html, setHtml] = useState(null)

  const url = useMemo(() => getWebflowHtmlUrl(null, { kind: 'team', slug }), [slug])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const loaded = await loadWebflowHtml(url)
        if (!cancelled) setHtml(loaded)
      } catch {
        const notFoundUrl = getWebflowHtmlUrl('/404')
        const loaded404 = await loadWebflowHtml(notFoundUrl)
        if (!cancelled) setHtml(loaded404)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url])

  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey={`team-${slug}`} />
}

function ServiceRoute() {
  const { slug } = useParams()
  const [html, setHtml] = useState(null)
  const url = useMemo(() => getWebflowHtmlUrl(null, { kind: 'service', slug }), [slug])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const loaded = await loadWebflowHtml(url)
        if (!cancelled) setHtml(loaded)
      } catch {
        const notFoundUrl = getWebflowHtmlUrl('/404')
        const loaded404 = await loadWebflowHtml(notFoundUrl)
        if (!cancelled) setHtml(loaded404)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url])

  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey={`service-${slug}`} />
}

function ProjectRoute() {
  const { slug } = useParams()
  const [html, setHtml] = useState(null)
  const url = useMemo(() => getWebflowHtmlUrl(null, { kind: 'project', slug }), [slug])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const loaded = await loadWebflowHtml(url)
        if (!cancelled) setHtml(loaded)
      } catch {
        const notFoundUrl = getWebflowHtmlUrl('/404')
        const loaded404 = await loadWebflowHtml(notFoundUrl)
        if (!cancelled) setHtml(loaded404)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url])

  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey={`project-${slug}`} />
}

function PostRoute() {
  const { slug } = useParams()
  const [html, setHtml] = useState(null)
  const url = useMemo(() => getWebflowHtmlUrl(null, { kind: 'post', slug }), [slug])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const loaded = await loadWebflowHtml(url)
        if (!cancelled) setHtml(loaded)
      } catch {
        const notFoundUrl = getWebflowHtmlUrl('/404')
        const loaded404 = await loadWebflowHtml(notFoundUrl)
        if (!cancelled) setHtml(loaded404)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url])

  if (!html) return <div>Loading...</div>
  return <WebflowPage html={html} pageKey={`post-${slug}`} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StaticWebflowRoute pathName="/" />} />
        <Route
          path="/about-us"
          element={<StaticWebflowRoute pathName="/about-us" />}
        />
        <Route
          path="/services"
          element={<StaticWebflowRoute pathName="/services" />}
        />
        <Route
          path="/projects"
          element={<StaticWebflowRoute pathName="/projects" />}
        />
        <Route path="/blog" element={<StaticWebflowRoute pathName="/blog" />} />
        <Route
          path="/post/the-future-of-jobs-skills-2026"
          element={<StaticWebflowRoute pathName="/post/the-future-of-jobs-skills-2026" />}
        />
        <Route
          path="/post/top-study-abroad-trends-career-opportunities-2026"
          element={<StaticWebflowRoute pathName="/post/top-study-abroad-trends-career-opportunities-2026" />}
        />
        <Route
          path="/contact"
          element={<StaticWebflowRoute pathName="/contact" />}
        />
        <Route
          path="/career"
          element={<StaticWebflowRoute pathName="/career" />}
        />
        <Route
          path="/faq-page"
          element={<StaticWebflowRoute pathName="/faq-page" />}
        />
        <Route
          path="/our-team"
          element={<StaticWebflowRoute pathName="/our-team" />}
        />
        <Route
          path="/utility-pages/style-guide"
          element={<StaticWebflowRoute pathName="/utility-pages/style-guide" />}
        />
        <Route
          path="/utility-pages/licenses"
          element={<StaticWebflowRoute pathName="/utility-pages/licenses" />}
        />
        <Route
          path="/utility-pages/changelog"
          element={<StaticWebflowRoute pathName="/utility-pages/changelog" />}
        />

        <Route path="/team/:slug" element={<TeamRoute />} />
        <Route path="/service/:slug" element={<ServiceRoute />} />
        <Route path="/project/:slug" element={<ProjectRoute />} />
        <Route path="/post/:slug" element={<PostRoute />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
