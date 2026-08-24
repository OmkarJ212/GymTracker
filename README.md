Iron Log 🏋️
Iron Log is a lightning-fast, offline-first Progressive Web App (PWA) designed for seamless gym tracking. Built entirely with vanilla web technologies, it offers a zero-latency logging experience without requiring an internet connection or a backend database.

Key Features
Dynamic Weekly Planner: Assign exercises to specific days of the week. Templates roll over automatically while presenting a clean logging slate every week.

Live Session Tracking: Log weight, reps, cardio time, and speeds with inline staging and instant personal record (PR) recognition.

Advanced Analytics: Automatically calculates your 7-day tonnage, estimates your 1RM, and graphs your 4-week volume trend.

Relative Strength Tracking: Input your bodyweight in the profile section to automatically calculate your strength-to-weight ratios (e.g., 1.5x BW).

Custom Exercise Library: A clean, searchable directory to manage standard lifts or append your own custom movements.

Setup & Installation
Because Iron Log is a PWA, it can be hosted on any static file server (like GitHub Pages or Netlify).

Place index.html, manifest.json, sw.js, and icon.png in a single directory.

Serve the directory via HTTPS.

Open the URL on your mobile browser and tap "Add to Home Screen" to install it as a standalone app.

The service worker will immediately cache all assets, allowing the app to run completely offline.

Data Architecture
Privacy and data ownership are core to Iron Log. No data is ever sent to a remote server.

Local Engine: All profiles, routines, and logged sets are stored securely in your device's browser cache.

Capacity: The browser storage limit safely holds over a decade of continuous daily workout logs before requiring cleanup.

Portability: The built-in JSON backup system allows you to export your raw data on demand. This format is perfectly structured for feeding into custom Python scripts to parse, analyze, or plot long-term visualizations of your progress.