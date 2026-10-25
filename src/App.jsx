import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import TestScreen from './TestScreen'
import './TestScreen.css'

function App() {
  const [dark, setDark] = useState(false)

  // Refs for the always-present hidden capture elements
  const captureVideoRef = useRef(null)
  const captureCanvasRef = useRef(null)
  const captureScreenVideoRef = useRef(null)
  const captureScreenCanvasRef = useRef(null)

  // Refs for the visible preview elements (permissions page only)
  const previewVideoRef = useRef(null)
  const previewScreenVideoRef = useRef(null)

  // Store streams in refs so they survive re-renders
  const cameraStreamRef = useRef(null)
  const screenStreamRef = useRef(null)

  const captureIntervalRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [screenReady, setScreenReady] = useState(false)
  const [captureCount, setCaptureCount] = useState({ camera: 0, screen: 0 })
  const [testStarted, setTestStarted] = useState(false)

  // ── Attach a stream to a video element ──
  function attachStream(videoEl, stream) {
    if (videoEl && stream) {
      videoEl.srcObject = stream
    }
  }

  // ── When hidden capture videos mount, attach any existing streams ──
  useEffect(() => {
    attachStream(captureVideoRef.current, cameraStreamRef.current)
  }, [testStarted])

  useEffect(() => {
    attachStream(captureScreenVideoRef.current, screenStreamRef.current)
  }, [testStarted])

  async function setUpCamera() {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      if (videoStream) {
        cameraStreamRef.current = videoStream
        // Attach to preview (visible) and capture (hidden) elements
        attachStream(previewVideoRef.current, videoStream)
        attachStream(captureVideoRef.current, videoStream)
        setCameraReady(true)
      }
    } catch (err) {
      console.log('Error setting up camera:', err);
    }
  }

  async function setUpScreenCapture() {
    try {
      const sources = await window.electronAPI.getScreenSources()
      if (!sources || sources.length === 0) {
        console.error('No screen sources available')
        return
      }

      const screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id,
            maxWidth: 1920,
            maxHeight: 1080
          }
        }
      })

      if (screenStream) {
        screenStreamRef.current = screenStream
        attachStream(previewScreenVideoRef.current, screenStream)
        attachStream(captureScreenVideoRef.current, screenStream)
        setScreenReady(true)
      }
    } catch (err) {
      console.error('Error setting up screen capture:', err)
    }
  }

  // ── Capture a single camera frame and save it ──
  const captureCameraFrame = useCallback(async () => {
    const video = captureVideoRef.current
    const canvas = captureCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)

    const result = await window.electronAPI.saveCameraFrame(dataURL)
    if (result.success) {
      setCaptureCount(prev => ({ ...prev, camera: prev.camera + 1 }))
    }
  }, [])

  // ── Capture a single screen frame and save it ──
  const captureScreenFrame = useCallback(async () => {
    const video = captureScreenVideoRef.current
    const canvas = captureScreenCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)

    const result = await window.electronAPI.saveScreenFrame(dataURL)
    if (result.success) {
      setCaptureCount(prev => ({ ...prev, screen: prev.screen + 1 }))
    }
  }, [])

  // ── Start simultaneous capture every 1 second ──
  function startCapture() {
    if (captureIntervalRef.current) return // already running

    setIsCapturing(true)
    captureIntervalRef.current = setInterval(() => {
      captureCameraFrame()
      captureScreenFrame()
    }, 1000)
  }

  // ── Stop capture and release all media tracks ──
  function stopCapture() {
    // Stop the interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    setIsCapturing(false)

    // Stop all camera tracks
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    // Stop all screen tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }

    // Clear srcObject on capture elements
    if (captureVideoRef.current) captureVideoRef.current.srcObject = null
    if (captureScreenVideoRef.current) captureScreenVideoRef.current.srcObject = null

    setCameraReady(false)
    setScreenReady(false)
  }

  // ── Start the test: begin capturing & go fullscreen ──
  function handleGoToTest() {
    if (!cameraReady || !screenReady) return
    startCapture()
    window.electronAPI.setFullScreen()
    setTestStarted(true)
  }

  // ── Called when the test finishes (timer up or manual submit) ──
  function handleTestFinish() {
    stopCapture()
    window.electronAPI.endTest()
  }

  async function setFullScreen() {
    window.electronAPI.setFullScreen()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <>
      {/* ── Test screen (shown when test is active) ── */}
      {testStarted && <TestScreen onFinish={handleTestFinish} />}

      {/* ── Permissions page (hidden when test is active) ── */}
      {!testStarted && (
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
            <div className="preview-toolbar">
              <div className="preview-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>LIVE PREVIEW</span>
              </div>
              <div className="status-badge">
                <span className={`status-dot${cameraReady ? ' active' : ''}`}></span>
                {cameraReady ? 'Active' : 'Ready'}
              </div>
            </div>

            <div className="video-area">
              <video className="live-preview" autoPlay muted playsInline ref={previewVideoRef}></video>
              <div className="scan-overlay">
                <div className="scan-corner tl"></div>
                <div className="scan-corner tr"></div>
                <div className="scan-corner bl"></div>
                <div className="scan-corner br"></div>
              </div>
            </div>

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

          {/* ── Section 2: Screen Capture ── */}
          <div className="section-header">
            <span className="section-icon section-icon--filled">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <div className="section-meta">
              <h2 className="section-title">Configure Screen Capture</h2>
              <p className="section-subtitle">Allow the app to capture your screen during the exam</p>
            </div>
          </div>

          <div className="card preview-card">
            <div className="preview-toolbar">
              <div className="preview-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>SCREEN PREVIEW</span>
              </div>
              <div className="status-badge">
                <span className={`status-dot${screenReady ? ' active' : ''}`}></span>
                {screenReady ? 'Active' : 'Ready'}
              </div>
            </div>

            <div className="video-area">
              <video className="live-preview" autoPlay muted playsInline ref={previewScreenVideoRef}></video>
              <div className="scan-overlay">
                <div className="scan-corner tl"></div>
                <div className="scan-corner tr"></div>
                <div className="scan-corner bl"></div>
                <div className="scan-corner br"></div>
              </div>
            </div>

            <div className="card-action-row">
              <p className="action-hint">Allow screen capture to monitor your screen during the exam.</p>
              <button className="btn btn--primary" type="button" onClick={setUpScreenCapture}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Get Screen Access
              </button>
            </div>
          </div>

          {/* ── Section 3: Switch to Fullscreen ── */}
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
            <button className="btn btn--cta" type="button" onClick={handleGoToTest} disabled={!cameraReady || !screenReady}>
              Go to Test
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Always-present hidden capture elements ──
           These stay in the DOM across both pages so streams
           are never interrupted when switching views. ── */}
      <video ref={captureVideoRef} style={{ display: 'none' }} autoPlay muted playsInline />
      <video ref={captureScreenVideoRef} style={{ display: 'none' }} autoPlay muted playsInline />
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
      <canvas ref={captureScreenCanvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default App
