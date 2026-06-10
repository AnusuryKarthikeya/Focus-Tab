# Focus Tab — Minimalist Productivity Dashboard

Focus Tab is a premium, local-first Chrome extension that replaces your browser's default New Tab page with a beautiful, minimalist productivity dashboard. Designed with an elegant gold-and-obsidian glassmorphic aesthetic, Focus Tab helps you set intentions, manage tasks, block distractions, and visualize your daily focus habits.

---

## Tech Stack Used

- **Extension Framework:** Chrome Extension Manifest V3 (MV3)
- **Network Interception:** `chrome.declarativeNetRequest` API (high-performance, privacy-preserving blocking)
- **Event Tracking:** `chrome.webNavigation` API (for background block events analytics)
- **Data Storage:** `chrome.storage.local` API (persisting preferences, tasks, and historical statistics)
- **Frontend Presentation:** HTML5 & Vanilla CSS3 (CSS Custom Properties, Glassmorphic filters, responsive Grid/Flexbox layouts)
- **Scripting & Dynamics:** Vanilla ES6+ JavaScript (including DOM manipulation, SVG drawing, and data file resizing)
- **Vector Graphics:** Inline SVGs (used for circular progress gauges and distraction bar charts)

---

## Features

### 🕒 Shell & Clock
- **Live Clock & Calendar:** High-fidelity clock and dynamic local calendar update in real time.
- **Dynamic Greetings:** Custom time-of-day greetings (Morning, Afternoon, Evening) styled with premium typography (*Playfair Display* + *JetBrains Mono*).

### 🎯 Daily Focus Prompt
- **Intention Setting:** Prompts you for your main focus today at the start of your day.
- **Mindful Display:** Places your intention front and center to remind you of your goal every time you open a new tab.

### 📝 Task List
- **Glassmorphic Task Board:** Add, complete, and delete tasks in an elegant, glassmorphic container with micro-animations.
- **Dynamic Counter:** Displays completion progress indicators (*"X remaining"*, *"All done ✓"*).

### 🛡️ Focus Mode (Site Blocking)
- **Active Focus Defense:** Toggles network-level site blocking utilizing Manifest V3 `declarativeNetRequest`.
- **Default Distractors:** Intercepts default social media links (YouTube, Instagram, Reddit, TikTok, X/Twitter, etc.) and redirects them to a peaceful focus reflection page.
- **Custom Block List:** Add or remove your own custom domains directly from the settings drawer.

### 📊 Data Analytics (Stats Dashboard)
- **Task Completion Circle:** Renders a circular SVG progress gauge calculating your active task completion rate.
- **Weekly Streak Board:** Tracks your daily focus achievement streak across the current calendar week.
- **Focus Defense Bar Chart:** An SVG horizontal bar chart visualizing block counts per domain in real time.

### ⚙️ Theme & Settings Customization
- **Personalized Name & Greeting:** Update your display name at any time.
- **Wallpaper Upload:** Upload custom background images. Focus Tab automatically resizes them to standard fits (max 1920px width) using canvas resampling to stay within local storage boundaries.
- **Default Wallpaper:** Loads a beautiful obsidian-gold abstract wallpaper if no custom image is selected.

---

## Folder Structure

```
Focus-Tab/
├── README.md              # Project documentation
├── task.md                # Task list checklist
├── focus-tab-prd.md       # Product Requirement Document
└── focus-tab/             # Extension source code
    ├── manifest.json      # Extension manifest (MV3)
    ├── background.js      # Background worker (blocking rules & analytics tracker)
    ├── newtab.html        # Dashboard markup shell
    ├── newtab.js          # Dashboard controller
    ├── newtab.css         # Dashboard styles
    ├── blocked.html       # Intercept page shown for blocked domains
    ├── blocked.js         # Intercept page controller
    ├── block_rules.json   # Declarative Net Request static ruleset
    ├── default_wallpaper.png # Fallback homepage wallpaper
    └── icons/             # Custom minimalist logo icons
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## Installation & Setup

To load this extension in Google Chrome locally:

1. Open your Google Chrome browser and navigate to `chrome://extensions/`.
2. Toggle the **Developer mode** switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `focus-tab/` folder from this repository directory.
5. Open a new tab to see your Focus Tab dashboard!

---

## Privacy & Security

- **Local-First:** Focus Tab operates entirely inside your browser. No external API requests, tracking, or network telemetry are present.
- **Secure Sandbox:** All user inputs use standard DOM properties (`textContent`) to prevent scripting attacks.
- **MV3 Compliant:** Completely built on Google Chrome's Manifest V3 specifications.
