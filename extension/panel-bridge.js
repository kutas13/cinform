/**
 * PANEL BRIDGE - foxvize.online ile extension arasinda kopru
 * Panel sayfasindaki butondan mesaj alir, background.js'e iletir
 */

window.addEventListener('foxvize-auto-fill', (event) => {
  const { token } = event.detail;
  if (!token) return;

  console.log('[FoxVize Bridge] Auto-fill request received for token:', token);

  chrome.runtime.sendMessage({
    action: 'openAndFill',
    token: token,
    apiUrl: 'https://foxvize.online/api/forms/'
  }, (response) => {
    if (response?.success) {
      console.log('[FoxVize Bridge] Background started auto-fill');
      window.dispatchEvent(new CustomEvent('foxvize-auto-fill-started', { detail: { success: true } }));
    } else {
      console.error('[FoxVize Bridge] Error:', response?.error);
      window.dispatchEvent(new CustomEvent('foxvize-auto-fill-started', { detail: { success: false, error: response?.error } }));
    }
  });
});

// Panel'e extension'in yuklu oldugunu bildir
window.dispatchEvent(new CustomEvent('foxvize-extension-ready'));
console.log('[FoxVize Bridge] Panel bridge active on', window.location.hostname);
