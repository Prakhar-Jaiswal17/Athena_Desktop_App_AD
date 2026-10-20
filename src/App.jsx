import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [dark, setDark] = useState(false)
  const videoRef = useRef(null)

  async function setUpCamera() {
    try{
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      if(videoStream) videoRef.current.srcObject = videoStream;
    }catch(err){
      console.log('Error', err);
    }
  }

  async function setFullScreen() {
    window.electronAPI.setFullScreen()
  }
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="permissions-container">

      {/* ── Top bar with heading + theme toggle ── */}
      <div className="top-bar">
        <h1 className="page-heading">Configure Permissions</h1>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setDark(d => !d)}
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Section 1: Configure Camera ── */}
      <div className="section-header">
        <span className="section-icon section-icon--filled">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <div className="section-meta">
          <h2 className="section-title">Configure Camera</h2>
          <p className="section-subtitle">Select your camera device and preview the feed</p>
        </div>
      </div>

      <div className="card preview-card">
        {/* toolbar */}
        <div className="preview-toolbar">
          <div className="preview-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>LIVE PREVIEW</span>
          </div>
          <div className="status-badge">
            <span className="status-dot"></span>
            Ready
          </div>
        </div>

        {/* video */}
        <div className="video-area">
          <video className="live-preview" autoPlay muted playsInline ref={videoRef}></video>
          <div className="scan-overlay">
            <div className="scan-corner tl"></div>
            <div className="scan-corner tr"></div>
            <div className="scan-corner bl"></div>
            <div className="scan-corner br"></div>
          </div>
        </div>

        {/* action row */}
        <div className="card-action-row">
          <p className="action-hint">Grant browser access to your camera to begin the live preview.</p>
          <button className="btn btn--primary" type="button" onClick={setUpCamera}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Get Camera Access
          </button>
        </div>
      </div>

      {/* ── Section 2: Switch to Fullscreen ── */}
      <div className="section-header">
        <span className="section-icon section-icon--outline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </span>
        <div className="section-meta">
          <h2 className="section-title">Switch to Fullscreen</h2>
          <p className="section-subtitle">Expand the application to fill your entire screen</p>
        </div>
      </div>

      <div className="card fullscreen-card">
        <p className="action-hint">Go to Fullscreen to make take test</p>
        <button className="btn btn--outline" type="button" onClick={setFullScreen}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          Enter Fullscreen
        </button>
      </div>

      {/* ── CTA ── */}
      <div className="cta-wrapper">
        <button className="btn btn--cta" type="button">
          Go to Test
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default App
