import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

export default function AudioPlayer() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const [isManuallyPaused, setIsManuallyPaused] = useState(false)

  useEffect(() => {
    // Clean up any stale preference from previous versions
    try {
      localStorage.removeItem('talentsza-bg-music-muted')
    } catch (e) {}

    if (audioRef.current) {
      // Set volume low as requested for background music
      audioRef.current.volume = 0.15
      
      // Try playing
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            console.log('Autoplay blocked or waiting for user interaction:', error)
            setIsPlaying(false)
            // Show toast prompting user to click or interact to enable music
            setShowToast(true)
            
            // Hide toast after 6 seconds automatically
            const timer = setTimeout(() => setShowToast(false), 6000)
            return () => clearTimeout(timer)
          })
      }
    }
  }, [])

  // Listen for user interaction to start playing if blocked by browser
  useEffect(() => {
    if (isPlaying || hasInteracted || isManuallyPaused) return

    const handleFirstInteraction = () => {
      if (isManuallyPaused) return
      
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true)
            setShowToast(false)
            setHasInteracted(true)
          })
          .catch((err) => {
            console.error('Interaction play failed:', err)
          })
      }
      cleanup()
    }

    const handleMessage = (e) => {
      if (e.data && e.data.type === 'talentsza-interaction') {
        handleFirstInteraction()
      }
    }

    const cleanup = () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('message', handleMessage)
    }

    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    window.addEventListener('message', handleMessage)

    return cleanup
  }, [isPlaying, hasInteracted, isManuallyPaused])

  const togglePlayback = (e) => {
    if (e) {
      e.stopPropagation() // Prevent click from bubbling up
    }
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsManuallyPaused(true)
      setShowToast(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          setIsManuallyPaused(false)
        })
        .catch((err) => {
          console.error('Manual play failed:', err)
        })
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/webflow-pages/assets/mp3/Talentszanthem.mp3"
        loop
        preload="auto"
      />
      
      <div 
        className={`audio-player-container ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlayback}
        title={isPlaying ? 'Pause background music' : 'Play background music'}
        aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
      >
        {isPlaying ? (
          <svg className="audio-icon" viewBox="0 0 24 24">
            {/* Pause icon */}
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="audio-icon" viewBox="0 0 24 24">
            {/* Play icon */}
            <path fill="currentColor" d="M8 5v14l11-7z" />
          </svg>
        )}

        <div className={`audio-onboarding-toast ${showToast ? 'show' : ''}`}>
          Tap to play background theme! 🎵
        </div>
      </div>
    </>
  )
}
