/**
 * ================================================
 * CINPANEL - BACKGROUND SERVICE WORKER
 * ================================================
 */

// Extension kurulumu
chrome.runtime.onInstalled.addListener((details) => {
    console.log('CinPanel Çin Vize Otomasyonu kuruldu');
    
    if (details.reason === 'install') {
        // İlk kurulum
        chrome.storage.local.set({
            version: '1.0.0',
            installDate: Date.now(),
            usageCount: 0
        });

        // Welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'CinPanel Kuruldu!',
            message: 'Çin vize formlarını otomatik doldurmaya hazır.'
        });
    }
});

// Tab güncellemelerini izle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Çin vize sayfası yüklendiğinde
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('consular.mfa.gov.cn')) {
        
        console.log('Çin vize sayfası tespit edildi:', tab.url);
        
        // Badge'i güncelle
        chrome.action.setBadgeText({
            tabId: tabId,
            text: '✓'
        });
        
        chrome.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: '#4F46E5'
        });
    } else {
        // Badge'i temizle
        chrome.action.setBadgeText({
            tabId: tabId,
            text: ''
        });
    }
});

// Mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'logUsage':
            updateUsageStats();
            break;
            
        case 'logError':
            console.error('Extension Error:', message.error);
            break;

        case 'openAndFill':
            handleOpenAndFill(message.token, message.apiUrl)
                .then(() => sendResponse({ success: true }))
                .catch(e => sendResponse({ success: false, error: e.message }));
            return true;

        case 'autoFillComplete':
            handleAutoFillComplete(message.token, message.success, sender.tab?.windowId);
            break;
    }
});

/**
 * Minimized pencerede vize sitesini ac ve otomatik doldur
 */
async function handleOpenAndFill(token, apiUrl) {
    console.log('[FoxVize BG] Opening minimized window for token:', token);

    const url = `https://consular.mfa.gov.cn/VISA/visa/visaform#foxvize=${token}`;

    // Minimized pencere ac
    const win = await chrome.windows.create({
        url: url,
        state: 'minimized',
        type: 'normal'
    });

    console.log('[FoxVize BG] Minimized window created:', win.id);

    // Token ve window ID'yi kaydet (tamamlaninca kapatmak icin)
    await chrome.storage.local.set({
        'autoFill_active': {
            token: token,
            windowId: win.id,
            startedAt: Date.now()
        }
    });
}

/**
 * Otomatik doldurma tamamlaninca bildirim gonder
 */
async function handleAutoFillComplete(token, success, windowId) {
    console.log('[FoxVize BG] Auto-fill complete:', token, success);

    if (success) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Basvuru Tamamlandi!',
            message: `${token} formu basariyla dolduruldu. Belge yukleme sayfasina gecildi.`
        });
    } else {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Basvuru Hatasi',
            message: `${token} formu doldurulurken hata olustu.`
        });
    }

    // Active state'i temizle
    await chrome.storage.local.remove('autoFill_active');
}

/**
 * Kullanım istatistiklerini güncelle
 */
async function updateUsageStats() {
    try {
        const result = await chrome.storage.local.get(['usageCount']);
        const newCount = (result.usageCount || 0) + 1;
        
        await chrome.storage.local.set({
            usageCount: newCount,
            lastUsed: Date.now()
        });

        console.log(`CinPanel kullanım sayısı: ${newCount}`);
    } catch (error) {
        console.error('Stats update error:', error);
    }
}

// Context menu oluştur
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'cinpanel-fill-form',
        title: 'CinPanel ile Doldur',
        contexts: ['page'],
        documentUrlPatterns: ['https://consular.mfa.gov.cn/*']
    });
});

// Context menu tıklaması
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'cinpanel-fill-form') {
        // Popup'ı aç
        chrome.action.openPopup();
    }
});

// Alarm'ları ayarla (opsiyonel)
chrome.alarms.create('dailyCleanup', { periodInMinutes: 1440 }); // 24 saat

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyCleanup') {
        cleanupOldData();
    }
});

/**
 * Eski cache verilerini temizle
 */
async function cleanupOldData() {
    try {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const allData = await chrome.storage.local.get();
        const keysToRemove = [];
        
        for (let key in allData) {
            if (key.startsWith('temp_') && allData[key] < oneWeekAgo) {
                keysToRemove.push(key);
            }
        }
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log(`CinPanel: ${keysToRemove.length} eski veri temizlendi`);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}