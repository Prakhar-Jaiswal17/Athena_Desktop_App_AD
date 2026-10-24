import { useState, useEffect, useRef, useCallback } from 'react'
import questionsData from '../db/dsa_questions.json'

function TestScreen({ onFinish }) {
  const { questions, testTitle, totalTime } = questionsData

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [isFinished, setIsFinished] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const timerRef = useRef(null)

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  const current = questions[currentIndex]

  // ── Timer ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [])

  // ── Format time ──
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ── Select an option ──
  function selectOption(optionIndex) {
    if (isFinished) return
    setSelectedAnswers(prev => ({
      ...prev,
      [current.id]: optionIndex
    }))
  }

  // ── Navigation ──
  function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  // ── Finish test ──
  const handleFinish = useCallback(() => {
    if (isFinished) return
    setIsFinished(true)
    clearInterval(timerRef.current)

    // Calculate score
    let totalScore = 0
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.answer) {
        totalScore += q.marks
      }
    })
    setScore(totalScore)
    setShowResult(true)

    // Stop screen and camera capture, exit kiosk
    if (onFinish) onFinish()
  }, [isFinished, questions, selectedAnswers, onFinish])

  // ── Timer urgency class ──
  function getTimerClass() {
    if (timeLeft <= 300) return 'timer--critical'   // last 5 min
    if (timeLeft <= 600) return 'timer--warning'     // last 10 min
    return ''
  }

  // ── Question status for palette ──
  function getQuestionStatus(index) {
    const q = questions[index]
    if (index === currentIndex) return 'palette-btn--current'
    if (selectedAnswers[q.id] !== undefined) return 'palette-btn--answered'
    return 'palette-btn--unanswered'
  }

  // ── Result screen ──
  if (showResult) {
    const attempted = Object.keys(selectedAnswers).length
    const correct = questions.filter(q => selectedAnswers[q.id] === q.answer).length
    const wrong = attempted - correct
    const unattempted = questions.length - attempted

    return (
      <div className="result-container">
        <div className="result-card">
          <div className="result-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="result-title">Test Completed!</h2>
          <p className="result-subtitle">{testTitle}</p>

          <div className="result-score-ring">
            <span className="result-score-value">{score}</span>
            <span className="result-score-total">/ {totalMarks}</span>
          </div>

          <div className="result-stats">
            <div className="stat-item stat--correct">
              <span className="stat-num">{correct}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item stat--wrong">
              <span className="stat-num">{wrong}</span>
              <span className="stat-label">Wrong</span>
            </div>
            <div className="stat-item stat--skipped">
              <span className="stat-num">{unattempted}</span>
              <span className="stat-label">Skipped</span>
            </div>
            <div className="stat-item stat--total">
              <span className="stat-num">{attempted}</span>
              <span className="stat-label">Attempted</span>
            </div>
          </div>

          <div className="result-percentage">
            {((score / totalMarks) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="test-container">

      {/* ── Header bar ── */}
      <header className="test-header">
        <div className="test-header-left">
          <div className="test-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            {testTitle}
          </div>
          <span className="test-progress">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className={`test-timer ${getTimerClass()}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="timer-text">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="test-body">

        {/* ── Question panel ── */}
        <main className="question-panel">
          <div className="question-card">
            {/* question header */}
            <div className="question-header">
              <span className="question-number">Q{current.id}</span>
              <span className="question-marks">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {current.marks} {current.marks === 1 ? 'Mark' : 'Marks'}
              </span>
            </div>

            {/* question text */}
            <p className="question-text">{current.question}</p>

            {/* options */}
            <div className="options-list">
              {current.options.map((option, idx) => {
                const isSelected = selectedAnswers[current.id] === idx
                return (
                  <button
                    key={idx}
                    className={`option-btn ${isSelected ? 'option-btn--selected' : ''}`}
                    onClick={() => selectOption(idx)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="option-text">{option}</span>
                    {isSelected && (
                      <svg className="option-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* navigation buttons */}
          <div className="question-nav">
            <button
              className="btn btn--outline nav-btn"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn btn--primary nav-btn"
                onClick={() => goToQuestion(currentIndex + 1)}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <button
                className="btn btn--finish nav-btn"
                onClick={handleFinish}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Finish Test
              </button>
            )}
          </div>
        </main>

        {/* ── Sidebar: question palette ── */}
        <aside className="question-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Question Palette</h3>

            <div className="palette-legend">
              <span className="legend-item">
                <span className="legend-dot legend-dot--current"></span> Current
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--answered"></span> Answered
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--unanswered"></span> Unanswered
              </span>
            </div>

            <div className="palette-grid">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  className={`palette-btn ${getQuestionStatus(idx)}`}
                  onClick={() => goToQuestion(idx)}
                >
                  {q.id}
                </button>
              ))}
            </div>

            <div className="sidebar-summary">
              <div className="summary-row">
                <span>Answered</span>
                <span className="summary-value">{Object.keys(selectedAnswers).length}</span>
              </div>
              <div className="summary-row">
                <span>Remaining</span>
                <span className="summary-value">{questions.length - Object.keys(selectedAnswers).length}</span>
              </div>
              <div className="summary-row">
                <span>Total Marks</span>
                <span className="summary-value">{totalMarks}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TestScreen
