/* ============================================================
   Focus Tab — Dashboard Logic
   ============================================================ */

// ----- Global State -----
const state = {
  name: 'Friend',
  wallpaper: null,
  tasks: [],
  focusMode: false,
  customBlocked: [],
  todayFocus: '',
  focusDate: ''
};

// ----- DOM References -----
const $clock       = document.getElementById('clock');
const $dateLine    = document.getElementById('date-line');
const $greeting    = document.getElementById('greeting');
const $wallpaper   = document.getElementById('wallpaper');

// Phase 2 — Focus prompt refs
const $focusDisplay      = document.getElementById('focus-display');
const $focusOverlay      = document.getElementById('focus-prompt-overlay');
const $focusBox          = document.getElementById('focus-prompt-box');
const $focusInput        = document.getElementById('focus-prompt-input');
const $focusSubmit       = document.getElementById('focus-prompt-submit');

// Phase 2 — Task list refs
const $taskList     = document.getElementById('task-list');
const $taskCount    = document.getElementById('task-count');
const $taskInput    = document.getElementById('task-input');
const $taskAddBtn   = document.getElementById('task-add-btn');

// Phase 3 — Focus mode refs
const $focusToggle     = document.getElementById('focus-toggle');
const $focusDot        = document.getElementById('focus-dot');
const $focusStatusText = document.getElementById('focus-status-text');

// Phase 4 — Settings refs
const $settingsBtn       = document.getElementById('settings-btn');
const $settingsOverlay   = document.getElementById('settings-overlay');
const $settingsClose     = document.getElementById('settings-close');
const $settingsName      = document.getElementById('settings-name');
const $wallpaperInput    = document.getElementById('wallpaper-input');
const $wallpaperUploadBtn = document.getElementById('wallpaper-upload-btn');
const $wallpaperPreview  = document.getElementById('wallpaper-preview');
const $wallpaperClear    = document.getElementById('wallpaper-clear');
const $blockListItems    = document.getElementById('block-list-items');
const $blockInput        = document.getElementById('block-input');
const $blockAddBtn       = document.getElementById('block-add-btn');
const $settingsSave      = document.getElementById('settings-save');
const $settingsError     = document.getElementById('settings-error');

// Phase 6 — Analytics refs
const $tabTasks          = document.getElementById('tab-tasks');
const $tabStats          = document.getElementById('tab-stats');
const $tasksContent      = document.getElementById('tasks-content');
const $statsContent      = document.getElementById('stats-content');
const $statsProgressRing = document.getElementById('stats-progress-ring');
const $statsProgressText = document.getElementById('stats-progress-text');
const $statsFocusText    = document.getElementById('stats-focus-text');
const $statsAchieveBtn   = document.getElementById('stats-achieve-btn');
const $statsDefenseChart = document.getElementById('stats-defense-chart');

// ----- Clock -----
const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

function tick() {
  const now = new Date();

  // Format time as HH:MM (24-hour)
  const hours   = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  $clock.textContent = `${hours}:${minutes}`;

  // Format date as "DayName, DD MonthName YYYY"
  const dayName   = DAYS[now.getDay()];
  const date      = String(now.getDate()).padStart(2, '0');
  const monthName = MONTHS[now.getMonth()];
  const year      = now.getFullYear();
  $dateLine.textContent = `${dayName}, ${date} ${monthName} ${year}`;
}

// ----- Greeting -----
function renderGreeting(name) {
  const hour = new Date().getHours();
  let salutation;
  if (hour < 12)      salutation = 'Good morning';
  else if (hour < 17) salutation = 'Good afternoon';
  else                salutation = 'Good evening';
  $greeting.textContent = `${salutation}, ${name}.`;
}

// ----- Wallpaper -----
function applyWallpaper(dataUrl) {
  if (dataUrl) {
    $wallpaper.style.backgroundImage = `url("${dataUrl}")`;
  } else {
    $wallpaper.style.backgroundImage = 'url("default_wallpaper.png")';
  }
  $wallpaper.style.backgroundColor = '#0e0d0b';
}

// ============================================================
// Phase 2 — Daily Focus Prompt
// ============================================================

// ----- Day Detection -----
function todayKey() {
  const n = new Date();
  const yyyy = n.getFullYear();
  const mm = String(n.getMonth() + 1).padStart(2, '0');
  const dd = String(n.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ----- Show / Hide Focus Prompt -----
function showFocusPrompt() {
  // Pre-fill with existing focus if editing mid-day
  if (state.todayFocus) {
    $focusInput.value = state.todayFocus;
  } else {
    $focusInput.value = '';
  }
  $focusOverlay.classList.add('open');
  // Slight delay so the animation starts before focus
  setTimeout(() => $focusInput.focus(), 100);
}

function hideFocusPrompt() {
  $focusOverlay.classList.remove('open');
  $focusInput.blur();
}

// ----- Save Focus -----
async function saveFocus(text) {
  const trimmed = text.trim();
  if (!trimmed) return; // Do not save or close if empty

  state.todayFocus = trimmed;
  state.focusDate = todayKey();

  try {
    await chrome.storage.local.set({
      todayFocus: state.todayFocus,
      focusDate: state.focusDate
    });

    // Phase 6: Log focus to history
    const today = todayKey();
    const focusStats = await chrome.storage.local.get(['focusHistory']);
    const history = focusStats.focusHistory || {};
    const existing = history[today] || {};
    history[today] = {
      text: trimmed,
      achieved: existing.achieved || false
    };
    await chrome.storage.local.set({ focusHistory: history });
    renderStats();
  } catch (err) {
    console.error('Failed to save focus:', err);
  }

  updateFocusDisplay();
  hideFocusPrompt();
}

// ----- Update Focus Display -----
function updateFocusDisplay() {
  if (state.todayFocus) {
    $focusDisplay.textContent = `"${state.todayFocus}"`;
    $focusDisplay.classList.remove('empty');
    $statsFocusText.textContent = `"${state.todayFocus}"`;
  } else {
    $focusDisplay.textContent = 'What will you focus on today?';
    $focusDisplay.classList.add('empty');
    $statsFocusText.textContent = 'No focus set';
  }
}

// ----- Focus Prompt Event Handlers -----

// Submit button
$focusSubmit.addEventListener('click', () => {
  saveFocus($focusInput.value);
});

// Enter key submits, Escape dismisses (only if focus already set)
$focusInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveFocus($focusInput.value);
  } else if (e.key === 'Escape') {
    if (state.todayFocus) {
      hideFocusPrompt();
    } else {
      // No focus set — refocus the input
      $focusInput.focus();
    }
  }
});

// Clicking overlay backdrop dismisses (only if focus already set)
$focusOverlay.addEventListener('click', (e) => {
  if (e.target === $focusOverlay && state.todayFocus) {
    hideFocusPrompt();
  }
});

// Clicking focus display re-opens the prompt for editing
$focusDisplay.addEventListener('click', () => {
  showFocusPrompt();
});

// ============================================================
// Phase 2 — Task List
// ============================================================

// ----- Render Tasks -----
function renderTasks() {
  $taskList.innerHTML = '';

  state.tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');

    // Check circle
    const check = document.createElement('div');
    check.className = 'task-check';
    check.addEventListener('click', () => toggleTask(index));

    // Task text
    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    // Delete button
    const del = document.createElement('button');
    del.className = 'task-del';
    del.textContent = '×';
    del.title = 'Delete task';
    del.addEventListener('click', () => deleteTask(index));

    li.appendChild(check);
    li.appendChild(text);
    li.appendChild(del);
    $taskList.appendChild(li);
  });

  updateTaskCount();
}

// ----- Task Count -----
function updateTaskCount() {
  const remaining = state.tasks.filter(t => !t.done).length;

  if (remaining === 0 && state.tasks.length > 0) {
    $taskCount.textContent = 'All done ✓';
  } else if (remaining === 0) {
    $taskCount.textContent = 'No tasks';
  } else {
    $taskCount.textContent = `${remaining} remaining`;
  }
}

// ----- Add Task -----
async function addTask() {
  const text = $taskInput.value.trim();
  if (!text) return;

  state.tasks.push({
    id: Date.now(),
    text: text,
    done: false
  });

  try {
    await chrome.storage.local.set({ tasks: state.tasks });
  } catch (err) {
    console.error('Failed to save task:', err);
  }

  renderTasks();
  $taskInput.value = '';
  $taskInput.focus();
}

// ----- Toggle Task Done -----
async function toggleTask(index) {
  const isNowDone = !state.tasks[index].done;
  state.tasks[index].done = isNowDone;

  try {
    await chrome.storage.local.set({ tasks: state.tasks });

    // Phase 6: Track completed tasks in storage
    const today = todayKey();
    const stats = await chrome.storage.local.get(['taskHistory']);
    const history = stats.taskHistory || {};
    if (!history[today]) {
      history[today] = 0;
    }
    if (isNowDone) {
      history[today]++;
    } else {
      history[today] = Math.max(0, history[today] - 1);
    }
    await chrome.storage.local.set({ taskHistory: history });
    renderStats();
  } catch (err) {
    console.error('Failed to toggle task:', err);
  }

  renderTasks();
}

// ----- Delete Task -----
async function deleteTask(index) {
  state.tasks.splice(index, 1);

  try {
    await chrome.storage.local.set({ tasks: state.tasks });
  } catch (err) {
    console.error('Failed to delete task:', err);
  }

  renderTasks();
}

// ----- Task Event Handlers -----

// Add button click
$taskAddBtn.addEventListener('click', () => {
  addTask();
});

// Enter key in task input
$taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTask();
  }
});

// ============================================================
// Phase 3 — Focus Mode UI
// ============================================================

// ----- Apply Focus Mode -----
let _focusLock = false; // Phase 5: debounce guard against rapid toggling

async function applyFocusMode(enabled, save) {
  if (_focusLock) return; // Prevent re-entry while async work is in-flight
  _focusLock = true;

  state.focusMode = enabled;

  // Update toggle checkbox
  $focusToggle.checked = enabled;

  // Update status dot
  if (enabled) {
    $focusDot.classList.add('active');
  } else {
    $focusDot.classList.remove('active');
  }

  // Update status text
  $focusStatusText.textContent = enabled
    ? 'Active — distractions blocked'
    : 'Inactive';
  if (enabled) {
    $focusStatusText.classList.add('active');
  } else {
    $focusStatusText.classList.remove('active');
  }

  // Persist to storage
  if (save) {
    try {
      await chrome.storage.local.set({ focusMode: enabled });
    } catch (err) {
      console.error('Failed to save focus mode:', err);
    }
  }

  // Send message to background service worker
  try {
    await chrome.runtime.sendMessage({
      type: 'SET_FOCUS_MODE',
      enabled: enabled,
      customDomains: state.customBlocked
    });
  } catch (err) {
    // Background worker may not be ready yet — log silently
    console.warn('Could not reach background worker:', err.message);
  }

  _focusLock = false; // Release lock
}

// ----- Focus Mode Toggle Handler -----
$focusToggle.addEventListener('change', () => {
  applyFocusMode($focusToggle.checked, true);
});

// ============================================================
// Phase 4 — Settings
// ============================================================

// ----- Open / Close Settings -----
function openSettings() {
  $settingsName.value = state.name;
  renderWallpaperPreview();
  renderBlockList();
  hideSettingsError();
  $settingsOverlay.classList.add('open');
}

function closeSettings() {
  $settingsOverlay.classList.remove('open');
}

$settingsBtn.addEventListener('click', () => openSettings());
$settingsClose.addEventListener('click', () => closeSettings());

// Backdrop click closes settings
$settingsOverlay.addEventListener('click', (e) => {
  if (e.target === $settingsOverlay) {
    closeSettings();
  }
});

// ----- Wallpaper Preview -----
function renderWallpaperPreview() {
  if (state.wallpaper) {
    $wallpaperPreview.style.backgroundImage = `url("${state.wallpaper}")`;
    $wallpaperPreview.classList.add('visible');
  } else {
    $wallpaperPreview.style.backgroundImage = '';
    $wallpaperPreview.classList.remove('visible');
  }
}

// ----- Wallpaper Upload -----
function resizeImage(dataUrl, maxWidth, callback) {
  const img = new Image();
  img.onload = () => {
    if (img.width <= maxWidth) {
      callback(dataUrl); // No resize needed
      return;
    }
    const canvas = document.createElement('canvas');
    const scale = maxWidth / img.width;
    canvas.width = maxWidth;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.src = dataUrl;
}

$wallpaperUploadBtn.addEventListener('click', () => {
  $wallpaperInput.click();
});

$wallpaperInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Security: validate file type
  if (!file.type.startsWith('image/')) {
    showSettingsError('Please select an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    // Resize to max 1920px width to stay within storage limits
    resizeImage(ev.target.result, 1920, (resized) => {
      state.wallpaper = resized;
      renderWallpaperPreview();
    });
  };
  reader.readAsDataURL(file);
});

// ----- Wallpaper Clear -----
$wallpaperClear.addEventListener('click', () => {
  state.wallpaper = null;
  $wallpaperInput.value = '';
  renderWallpaperPreview();
});

// ----- Block List Rendering -----
function renderBlockList() {
  $blockListItems.innerHTML = '';

  state.customBlocked.forEach((domain, index) => {
    const row = document.createElement('div');
    row.className = 'block-list-row';

    const text = document.createElement('span');
    text.className = 'block-domain';
    text.textContent = domain;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'block-remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove domain';
    removeBtn.addEventListener('click', () => {
      state.customBlocked.splice(index, 1);
      renderBlockList();
    });

    row.appendChild(text);
    row.appendChild(removeBtn);
    $blockListItems.appendChild(row);
  });
}

// ----- Add Domain -----
function addBlockDomain() {
  let raw = $blockInput.value.trim().toLowerCase();
  if (!raw) return;

  // Normalise: strip protocol and www prefix
  raw = raw.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Remove trailing slash
  raw = raw.replace(/\/$/, '');

  // Guard: no duplicates
  if (state.customBlocked.includes(raw)) {
    $blockInput.value = '';
    return;
  }

  state.customBlocked.push(raw);
  renderBlockList();
  $blockInput.value = '';
}

$blockAddBtn.addEventListener('click', () => addBlockDomain());

$blockInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addBlockDomain();
  }
});

// ----- Settings Error -----
function showSettingsError(msg) {
  $settingsError.textContent = msg;
  $settingsError.classList.add('visible');
}

function hideSettingsError() {
  $settingsError.textContent = '';
  $settingsError.classList.remove('visible');
}

// ----- Save Settings -----
$settingsSave.addEventListener('click', async () => {
  // Read name
  const name = $settingsName.value.trim() || 'Friend';
  state.name = name;

  // wallpaper and customBlocked are already updated in-place during editing

  try {
    await chrome.storage.local.set({
      name: state.name,
      wallpaper: state.wallpaper,
      customBlocked: state.customBlocked
    });
  } catch (err) {
    console.error('Failed to save settings:', err);
    showSettingsError('Storage is full. Try using a smaller wallpaper image.');
    return;
  }

  // Apply changes immediately
  applyWallpaper(state.wallpaper);
  renderGreeting(state.name);

  // If focus mode is active, re-send with updated custom domains
  if (state.focusMode) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_FOCUS_MODE',
        enabled: true,
        customDomains: state.customBlocked
      });
    } catch (err) {
      console.warn('Could not reach background worker:', err.message);
    }
  }

  closeSettings();
});

// ============================================================
// Initialisation
// ============================================================

async function init() {
  try {
    const data = await chrome.storage.local.get([
      'name', 'wallpaper', 'tasks', 'focusMode',
      'customBlocked', 'todayFocus', 'focusDate'
    ]);

    // Populate state
    state.name          = data.name          || 'Friend';
    state.wallpaper     = data.wallpaper     || null;
    state.tasks         = data.tasks         || [];
    state.focusMode     = data.focusMode     || false;
    state.customBlocked = data.customBlocked || [];
    state.todayFocus    = data.todayFocus    || '';
    state.focusDate     = data.focusDate     || '';

    // Apply wallpaper
    applyWallpaper(state.wallpaper);

    // Render greeting
    renderGreeting(state.name);

    // Start clock
    tick();
    setInterval(tick, 1000);

    // Phase 2 — Focus prompt trigger
    if (!state.todayFocus || state.focusDate !== todayKey()) {
      // New day or no focus set — show prompt after dashboard paints
      state.todayFocus = ''; // Clear stale focus from previous day
      updateFocusDisplay();
      setTimeout(showFocusPrompt, 600);
    } else {
      // Same day, focus already set — just display it
      updateFocusDisplay();
    }

    // Phase 2 — Render task list
    renderTasks();

    // Phase 3 — Restore focus mode visual state (don't re-send message)
    applyFocusMode(state.focusMode, false);

    // Phase 6 — Initial stats render
    renderStats();

  } catch (err) {
    console.error('Focus Tab init error:', err);
    // Fallback: render with defaults
    applyWallpaper(null);
    renderGreeting('Friend');
    tick();
    setInterval(tick, 1000);
    updateFocusDisplay();
    renderTasks();
    renderStats();
  }
}

// ----- Tab Toggling (Phase 6) -----
$tabTasks.addEventListener('click', () => {
  $tabTasks.classList.add('active');
  $tabStats.classList.remove('active');
  $tasksContent.style.display = 'block';
  $statsContent.style.display = 'none';
  $taskCount.style.display = 'inline';
});

$tabStats.addEventListener('click', () => {
  $tabStats.classList.add('active');
  $tabTasks.classList.remove('active');
  $tasksContent.style.display = 'none';
  $statsContent.style.display = 'block';
  $taskCount.style.display = 'none';
  renderStats();
});

// Daily Reflection Toggle (Phase 6)
$statsAchieveBtn.addEventListener('click', toggleFocusAchievement);

async function toggleFocusAchievement() {
  const today = todayKey();
  try {
    const focusStats = await chrome.storage.local.get(['focusHistory']);
    const history = focusStats.focusHistory || {};
    
    if (!history[today]) {
      history[today] = { text: state.todayFocus || '', achieved: false };
    }
    
    history[today].achieved = !history[today].achieved;
    
    await chrome.storage.local.set({ focusHistory: history });
    renderStats();
  } catch (err) {
    console.error('Failed to toggle focus achievement:', err);
  }
}

// ----- Render Stats (Phase 6) -----
async function renderStats() {
  const today = todayKey();
  
  // 1. Task Completion Rate
  const completed = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  $statsProgressText.textContent = `${percent}%`;
  
  const circ = 213.628;
  const offset = circ - (percent / 100) * circ;
  $statsProgressRing.style.strokeDashoffset = offset;

  try {
    const data = await chrome.storage.local.get(['focusHistory', 'blockHistory']);
    const focusHistory = data.focusHistory || {};
    const blockHistory = data.blockHistory || {};

    // 2. Reflection Success Button
    const todayFocusItem = focusHistory[today] || {};
    if (state.todayFocus) {
      $statsFocusText.textContent = `"${state.todayFocus}"`;
      $statsAchieveBtn.disabled = false;
      if (todayFocusItem.achieved) {
        $statsAchieveBtn.classList.add('active');
        $statsAchieveBtn.innerHTML = '<span class="btn-check-icon">✓</span> Succeeded!';
      } else {
        $statsAchieveBtn.classList.remove('active');
        $statsAchieveBtn.innerHTML = '<span class="btn-check-icon">✓</span> Mark Achieved';
      }
    } else {
      $statsFocusText.textContent = 'No focus set for today.';
      $statsAchieveBtn.disabled = true;
      $statsAchieveBtn.classList.remove('active');
      $statsAchieveBtn.innerHTML = '<span class="btn-check-icon">✓</span> Mark Achieved';
    }

    // 3. Weekly Streak Nodes
    const weekKeys = getWeekDates();
    const daysIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const now = new Date();
    const currentDay = now.getDay();
    const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1; // 0=Mon, 6=Sun

    daysIds.forEach((day, index) => {
      const $dayEl = document.getElementById(`streak-${day}`);
      if ($dayEl) {
        const $dot = $dayEl.querySelector('.streak-dot');
        if ($dot) {
          const dateKey = weekKeys[index];
          const focusItem = focusHistory[dateKey];
          
          $dot.classList.remove('active', 'future');
          $dayEl.classList.remove('today');
          
          if (index === currentDayIndex) {
            $dayEl.classList.add('today');
          }
          
          if (focusItem && focusItem.achieved) {
            $dot.classList.add('active');
          } else if (index > currentDayIndex) {
            $dot.classList.add('future');
          }
        }
      }
    });

    // 4. Distraction Defense Chart
    const $noBlocksMsg = document.getElementById('no-blocks-msg');
    const existingRows = $statsDefenseChart.querySelectorAll('.defense-chart-bar-row');
    existingRows.forEach(row => row.remove());

    const todayBlocks = blockHistory[today] || {};
    const domains = Object.keys(todayBlocks);

    if (domains.length === 0) {
      $noBlocksMsg.style.display = 'block';
    } else {
      $noBlocksMsg.style.display = 'none';
      
      domains.sort((a, b) => todayBlocks[b] - todayBlocks[a]);
      const maxCount = Math.max(...Object.values(todayBlocks), 1);

      domains.forEach(domain => {
        const count = todayBlocks[domain];
        const percent = (count / maxCount) * 100;

        const row = document.createElement('div');
        row.className = 'defense-chart-bar-row';

        const label = document.createElement('span');
        label.className = 'defense-chart-label';
        label.textContent = domain;
        label.title = domain;

        const barBg = document.createElement('div');
        barBg.className = 'defense-chart-bar-bg';

        const barFill = document.createElement('div');
        barFill.className = 'defense-chart-bar-fill';

        const value = document.createElement('span');
        value.className = 'defense-chart-value';
        value.textContent = count;

        barBg.appendChild(barFill);
        row.appendChild(label);
        row.appendChild(barBg);
        row.appendChild(value);
        $statsDefenseChart.appendChild(row);

        // Transition width
        setTimeout(() => {
          barFill.style.width = `${percent}%`;
        }, 50);
      });
    }
  } catch (err) {
    console.error('Error rendering stats:', err);
  }
}

function getWeekDates() {
  const now = new Date();
  const currentDay = now.getDay();
  const dayIndex = currentDay === 0 ? 6 : currentDay - 1;
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - dayIndex + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    week.push(key);
  }
  return week;
}

document.addEventListener('DOMContentLoaded', init);

