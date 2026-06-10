/* ============================================================
   Focus Tab — Blocked Page Logic
   Loads the user's focus message from storage
   ============================================================ */

const $focusMessage = document.getElementById('focus-message');

try {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['todayFocus', 'name'], (data) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        $focusMessage.textContent = 'Stay focused, friend.';
        return;
      }
      if (data && data.todayFocus) {
        $focusMessage.textContent = `"${data.todayFocus}"`;
      } else {
        $focusMessage.textContent = `Stay focused, ${data && data.name ? data.name : 'friend'}.`;
      }
    });
  } else {
    $focusMessage.textContent = 'Stay focused, friend.';
  }
} catch (e) {
  console.error('Error loading storage:', e);
  $focusMessage.textContent = 'Stay focused, friend.';
}

// Navigation buttons
document.getElementById('go-home').addEventListener('click', () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      window.location.href = chrome.runtime.getURL('newtab.html');
    } else {
      window.location.href = 'newtab.html';
    }
  } catch (e) {
    window.location.href = 'newtab.html';
  }
});

document.getElementById('close-tab').addEventListener('click', () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }, () => {
        // Fallback to window.close() if message sending fails or callback runs
        window.close();
      });
    } else {
      window.close();
    }
  } catch (e) {
    window.close();
  }
});
