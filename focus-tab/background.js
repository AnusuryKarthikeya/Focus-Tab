/* ============================================================
   Focus Tab — Background Service Worker
   Handles Focus Mode blocking rule toggling
   ============================================================ */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_FOCUS_MODE') {
    setFocusMode(msg.enabled, msg.customDomains || [])
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error('Focus Mode error:', err);
        sendResponse({ ok: false, error: err.message });
      });
    return true; // Keep channel open for async response
  } else if (msg.type === 'CLOSE_TAB') {
    if (sender.tab && sender.tab.id !== undefined) {
      chrome.tabs.remove(sender.tab.id);
    }
  }
});

async function setFocusMode(enabled, customDomains) {
  if (enabled) {
    // Enable the static ruleset
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['block_rules'],
      disableRulesetIds: []
    });

    // Remove all existing dynamic rules first
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map(r => r.id)
      });
    }

    // Build and add dynamic rules for custom domains (IDs start at 1000)
    if (customDomains.length > 0) {
      const newRules = customDomains.map((domain, i) => ({
        id: 1000 + i,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { extensionPath: '/blocked.html' }
        },
        condition: {
          urlFilter: `*${domain}*`,
          resourceTypes: ['main_frame']
        }
      }));

      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules
      });
    }
  } else {
    // Disable static ruleset
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [],
      disableRulesetIds: ['block_rules']
    });

    // Remove all dynamic rules
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map(r => r.id)
      });
    }
  }
}

// ----- Block Stats Analytics -----
const DEFAULT_BLOCKED = [
  'instagram.com',
  'youtube.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'facebook.com',
  'tiktok.com',
  'netflix.com',
  'twitch.tv'
];

function getBlockedDomain(url, customBlocked) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const allBlocked = [...DEFAULT_BLOCKED, ...customBlocked];
    for (const domain of allBlocked) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return domain;
      }
    }
  } catch (e) {
    // Ignore invalid URLs (e.g. about:blank or extension URLs)
  }
  return null;
}

const recentBlocks = new Map(); // key: tabId-domain, value: timestamp

function isDuplicateBlock(tabId, domain) {
  const key = `${tabId}-${domain}`;
  const now = Date.now();
  const lastTime = recentBlocks.get(key) || 0;
  if (now - lastTime < 2000) {
    return true;
  }
  recentBlocks.set(key, now);
  // Occasional cache cleanup
  if (recentBlocks.size > 100) {
    for (const [k, v] of recentBlocks.entries()) {
      if (now - v > 10000) {
        recentBlocks.delete(k);
      }
    }
  }
  return false;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only top-level frames

  try {
    const data = await chrome.storage.local.get(['focusMode', 'customBlocked']);
    if (!data.focusMode) return;

    const domain = getBlockedDomain(details.url, data.customBlocked || []);
    if (domain) {
      if (isDuplicateBlock(details.tabId, domain)) return;

      const n = new Date();
      const yyyy = n.getFullYear();
      const mm = String(n.getMonth() + 1).padStart(2, '0');
      const dd = String(n.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;
      const stats = await chrome.storage.local.get(['blockHistory']);
      const history = stats.blockHistory || {};

      if (!history[today]) {
        history[today] = {};
      }
      if (!history[today][domain]) {
        history[today][domain] = 0;
      }
      history[today][domain]++;

      await chrome.storage.local.set({ blockHistory: history });
    }
  } catch (err) {
    console.error('Error recording block stats:', err);
  }
});
