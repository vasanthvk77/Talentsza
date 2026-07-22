import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import WebflowPage from './webflow/WebflowPage'
import { getWebflowHtmlUrl, loadWebflowHtml } from './webflow/webflowPages'
import { LoadingProvider, useLoading } from './utils/LoadingContext'
import LoadingScreen from './components/LoadingScreen'

function WebflowRoute({ pathName, paramsKind }) {
  const { slug } = useParams()
  const location = useLocation()
  const { startLoading, stopLoading } = useLoading()
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(false)
  const isMounted = useRef(true)

  // Determine the effective path name or params
  const effectivePathName = pathName || location.pathname
  const url = useMemo(() => {
    if (paramsKind) {
      return getWebflowHtmlUrl(null, { kind: paramsKind, slug })
    }
    return getWebflowHtmlUrl(effectivePathName)
  }, [effectivePathName, paramsKind, slug])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleReady = () => {
    // Content is ready in the iframe, we can stop the global loading
    setTimeout(() => {
      if (isMounted.current) stopLoading()
    }, 100)
  }

  useEffect(() => {
    const run = async () => {
      setHtml(null) // Clear previous content immediately
      startLoading()
      setError(false)
      
      try {
        if (!url) throw new Error('No url')
        const loaded = await loadWebflowHtml(url)
        if (isMounted.current) {
          setHtml(loaded)
        }
      } catch (err) {
        console.error('Failed to load page:', err)
        try {
          const notFoundUrl = getWebflowHtmlUrl('/404')
          const loaded404 = await loadWebflowHtml(notFoundUrl)
          if (isMounted.current) {
            setHtml(loaded404)
            setError(true)
          }
        } catch {
          if (isMounted.current) setHtml('<h1>404 Not Found</h1>')
        }
        if (isMounted.current) stopLoading()
      }
    }

    run()
  }, [url, startLoading, stopLoading])

  if (!html) return null 
  
  return <WebflowPage html={html} pageKey={url || 'error'} onReady={handleReady} />
}

function AppContent() {
  const { isLoading, startLoading } = useLoading()
  const location = useLocation()

  // Immediately start loading when navigation begins
  useEffect(() => {
    startLoading()
  }, [location.pathname, startLoading])
  
  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <Routes>
        <Route path="/" element={<WebflowRoute pathName="/" />} />
        <Route path="/about-us" element={<WebflowRoute pathName="/about-us" />} />
        <Route path="/services" element={<WebflowRoute pathName="/services" />} />
        <Route path="/projects" element={<WebflowRoute pathName="/projects" />} />
        <Route path="/blog" element={<WebflowRoute pathName="/blog" />} />
        
        {/* Static Posts */}
        <Route path="/post/the-future-of-jobs-skills-2026" element={<WebflowRoute pathName="/post/the-future-of-jobs-skills-2026" />} />
        <Route path="/post/top-study-abroad-trends-career-opportunities-2026" element={<WebflowRoute pathName="/post/top-study-abroad-trends-career-opportunities-2026" />} />
        <Route path="/post/Industry-Ready-skills-2026" element={<WebflowRoute pathName="/post/Industry-Ready-skills-2026" />} />
        <Route path="/post/choosing-right-career-path-2026" element={<WebflowRoute pathName="/post/choosing-right-career-path-2026" />} />
        <Route path="/post/practical-training-internships-2026" element={<WebflowRoute pathName="/post/practical-training-internships-2026" />} />
        <Route path="/post/role-soft-skills-career-2026" element={<WebflowRoute pathName="/post/role-soft-skills-career-2026" />} />
        
        <Route path="/contact" element={<WebflowRoute pathName="/contact" />} />
        <Route path="/courses" element={<WebflowRoute pathName="/courses" />} />
        <Route path="/career" element={<WebflowRoute pathName="/career" />} />
        <Route path="/faq-page" element={<WebflowRoute pathName="/faq-page" />} />
        
        <Route path="/utility-pages/style-guide" element={<WebflowRoute pathName="/utility-pages/style-guide" />} />
        <Route path="/utility-pages/licenses" element={<WebflowRoute pathName="/utility-pages/licenses" />} />
        <Route path="/utility-pages/changelog" element={<WebflowRoute pathName="/utility-pages/changelog" />} />

        {/* Dynamic Routes */}
        <Route path="/team/:slug" element={<WebflowRoute paramsKind="team" />} />
        <Route path="/service/:slug" element={<WebflowRoute paramsKind="service" />} />
        <Route path="/project/:slug" element={<WebflowRoute paramsKind="project" />} />
        <Route path="/post/:slug" element={<WebflowRoute paramsKind="post" />} />

        <Route path="*" element={<WebflowRoute pathName="/404" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <LoadingProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LoadingProvider>
  )
}
