# Athena

An anti-cheat exam proctoring desktop app built with **Electron + React + Vite**.

Athena locks candidates into a secure kiosk-mode environment, simultaneously captures webcam and screen snapshots every second, blocks copy/paste, and runs a timed MCQ examination — all from a single desktop application.

---

## Features

- **Kiosk Mode Lockdown** — Enters OS-level kiosk mode on test start. Candidates cannot minimize, resize, switch apps, or exit fullscreen during the exam.
- **Clipboard Blocking** — Intercepts `Ctrl+C` / `Ctrl+V` / `Cmd+C` / `Cmd+V` at the Electron input event level and shows a warning dialog.
- **Camera + Screen Surveillance** — Captures a webcam photo and a desktop screenshot every 1 second simultaneously, saved as timestamped JPEGs to `cameraFeed/` and `screenFeed/`.
- **Permission Gating** — The test cannot be started until the candidate has granted both camera and screen capture access.
- **Timed MCQ Exam** — 2-hour countdown timer with auto-submit. Warning indicators at 10 min and 5 min remaining.
- **Question Navigation** — Sidebar palette showing answered/unanswered/current status with direct question jumping.
- **Score & Analytics** — Instant results on submission with score, percentage, correct/wrong/skipped breakdown.
- **Dark / Light Theme** — Toggle between themes from the permissions screen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Runtime | Electron v44 |
| Frontend | React 19, Vite 8 |
| IPC Bridge | `contextBridge` + `ipcRenderer.invoke` |
| Styling | Vanilla CSS with CSS custom properties |
| Question Bank | JSON (`db/dsa_questions.json`) |

---

## Project Structure

```
Athena/
├── main.cjs                 # Electron main process — kiosk, IPC handlers, clipboard blocking
├── preload.cjs              # Context bridge exposing electronAPI to renderer
├── index.html               # Entry HTML
├── build/
│   ├── icon.png             # App icon source (1024×1024)
│   └── icon.icns            # macOS app icon (generated via iconutil)
├── db/
│   └── dsa_questions.json   # MCQ question bank (20 DSA questions)
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Permissions screen, camera/screen setup, capture logic
│   ├── App.css              # Permissions page styles
│   ├── TestScreen.jsx       # Exam UI — timer, questions, palette, results
│   ├── TestScreen.css       # Exam & result screen styles
│   └── index.css            # Global styles, theme variables
├── cameraFeed/              # Webcam snapshots saved here during test
├── screenFeed/              # Screen captures saved here during test
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (comes with Node.js)

### Install & Run

```bash
git clone https://github.com/Prakhar-Jaiswal17/Athena_Desktop_App_AD.git
cd Athena
npm install
npm run chalo
```

`npm run chalo` starts both the Vite dev server and the Electron app in one command.

Alternatively, run them separately:
```bash
# Terminal 1
npm run dev

# Terminal 2 (after Vite is ready)
npm start
```

---

## How It Works

### 1. Configure Permissions
The candidate is presented with a setup screen to grant camera and screen capture access. Both must be active before the test can begin.

### 2. Start Test
Clicking "Go to Test" triggers:
- Kiosk mode (`win.setKiosk(true)`)
- Simultaneous camera + screen capture interval (1 frame/sec)
- Test screen with countdown timer

### 3. During the Exam
- Questions displayed one at a time with option selection
- Question palette for navigation and status tracking
- Copy/paste blocked with warning dialogs
- Timer counts down from 2 hours

### 4. Test Ends
When the timer expires or the candidate manually submits:
- Capture interval is cleared
- Camera and screen media tracks are stopped
- Kiosk mode is exited
- Score and analytics are displayed

---

## IPC API

Exposed via `window.electronAPI` in the renderer:

| Method | Description |
|---|---|
| `getScreenSources()` | Returns available screen sources from `desktopCapturer` |
| `saveCameraFrame(dataURL)` | Saves a base64 JPEG to `cameraFeed/` |
| `saveScreenFrame(dataURL)` | Saves a base64 JPEG to `screenFeed/` |
| `setFullScreen()` | Enters kiosk mode |
| `endTest()` | Exits kiosk mode |

---

## Production Build (.dmg)

To package Athena as a distributable macOS installer:

```bash
npm run dist
```

This runs `vite build` followed by `electron-builder --mac dmg`. The output `.dmg` file is generated in the `dist/` directory (e.g. `Athena-1.0.0-arm64.dmg`).

Other users can open the `.dmg` and drag Athena into their Applications folder to install.

> **Note:** In production, captured frames are saved to `~/Library/Application Support/athena/` since the `.app` bundle is read-only.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server only |
| `npm start` | Electron only |
| `npm run chalo` | Vite + Electron |
| `npm run build` | Vite production build |
| `npm run dist` | Build + package macOS `.dmg` installer |
| `npm run lint` | ESLint |
