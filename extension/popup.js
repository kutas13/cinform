class FoxVizePopup {
  constructor() {
    this.els = {
      token: document.getElementById('accessToken'),
      pageSel: document.getElementById('pageNumber'),
      fastBtn: document.getElementById('fastBtn'),
      singleBtn: document.getElementById('singleBtn'),
      pageRangeBtn: document.getElementById('pageRangeBtn'),
      stopBtn: document.getElementById('stopBtn'),
      statusWrap: document.getElementById('statusWrap'),
      statusDiv: document.getElementById('status'),
      progressWrap: document.getElementById('progressWrap'),
      progressFill: document.getElementById('progressFill'),
      progressLabel: document.getElementById('progressLabel'),
      progressPct: document.getElementById('progressPct'),
      pasteBtn: document.getElementById('pasteBtn'),
      validateBtn: document.getElementById('validateBtn'),
      validateCard: document.getElementById('validateCard'),
      validateGrid: document.getElementById('validateGrid'),
      validateTitle: document.getElementById('validateTitle'),
      historyRow: document.getElementById('historyRow'),
      connectionBadge: document.getElementById('connectionBadge'),
      speedSlider: document.getElementById('speedSlider'),
      speedLabel: document.getElementById('speedLabel'),
      logList: document.getElementById('logList'),
      resetBtn: document.getElementById('resetBtn'),
      statForms: document.getElementById('statForms'),
      statPages: document.getElementById('statPages'),
      statSuccess: document.getElementById('statSuccess'),
      statTime: document.getElementById('statTime'),
      avgTime: document.getElementById('avgTime'),
      successRate: document.getElementById('successRate'),
      lastUsed: document.getElementById('lastUsed'),
      streak: document.getElementById('streak'),
      folderPath: document.getElementById('folderPath'),
      selectFolderBtn: document.getElementById('selectFolderBtn'),
      folderInput: document.getElementById('folderInput'),
      docFilesSection: document.getElementById('docFilesSection'),
      docFilesList: document.getElementById('docFilesList'),
      uploadDocsBtn: document.getElementById('uploadDocsBtn'),
      docStatusWrap: document.getElementById('docStatusWrap'),
      docStatus: document.getElementById('docStatus'),
    };

    this.state = {
      fillCount: 0, pageCount: 0, successCount: 0, failCount: 0,
      totalTime: 0, tokenHistory: [], activityLog: [], speed: 1.5,
      lastUsed: null, streak: 0,
    };

    this.docFiles = {}; // { PASAPORT: File, KIMLIK: File, ... }
    this.DOC_NAMES = ['FOTO', 'PASAPORT', 'KIMLIK', 'DAVETIYE', 'LISANS', 'YETKILIKIMLIK', 'VIZE1', 'VIZE2', 'VIZE3', 'VIZE4', 'DILEKCE', 'FAALIYET1', 'FAALIYET2', 'VERGI', 'ADLISICIL', 'NUFUS1', 'NUFUS2', 'NUFUS3', 'SGK1', 'SGK2', 'SGK3', 'SGK4'];

    this.startTime = null;
    this.timerInterval = null;
    this._progressInterval = null;

    this.init();
  }

  async init() {
    await this.loadState();
    this.renderHistory();
    this.renderLog();
    this.updateStats();
    this.bindEvents();
    this.bindTabs();
    this.bindKeyboard();
    this.checkConnection();
    this.checkPage();
  }

  bindEvents() {
    this.els.fastBtn.addEventListener('click', () => this.fill('fast'));
    this.els.singleBtn.addEventListener('click', () => this.fill('single'));
    this.els.pageRangeBtn.addEventListener('click', () => this.fillRange());
    this.els.stopBtn.addEventListener('click', () => this.stop());
    this.els.pasteBtn.addEventListener('click', () => this.paste());
    this.els.validateBtn.addEventListener('click', () => this.validate());
    this.els.token.addEventListener('input', () => this.saveState());
    this.els.pageSel.addEventListener('change', () => this.saveState());
    this.els.speedSlider.addEventListener('input', () => this.updateSpeed());
    this.els.resetBtn.addEventListener('click', () => this.resetAll());
    this.els.selectFolderBtn.addEventListener('click', () => this.els.folderInput.click());
    this.els.folderPath.addEventListener('click', () => this.els.folderInput.click());
    this.els.folderInput.addEventListener('change', (e) => this.handleFolderSelect(e));
    this.els.uploadDocsBtn.addEventListener('click', () => this.uploadDocs());
    document.getElementById('goToUploadBtn').addEventListener('click', () => this.goToUploadPage());
  }

  bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      });
    });
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement === this.els.token) {
        this.fill('fast');
      }
      if (e.key === 'Escape') this.stop();
      if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && document.activeElement !== this.els.token) {
        this.els.pageSel.value = e.key;
        this.saveState();
      }
    });
  }

  updateSpeed() {
    const v = parseFloat(this.els.speedSlider.value);
    this.state.speed = v;
    const labels = { 0.5: 'Cok Hizli', 0.75: 'Hizli', 1: 'Hizli', 1.25: 'Orta', 1.5: 'Normal', 1.75: 'Sakin', 2: 'Yavas', 2.5: 'Cok Yavas', 3: 'En Yavas' };
    this.els.speedLabel.textContent = labels[v] || 'x' + v;
    this.saveState();
  }

  async loadState() {
    try {
      const r = await chrome.storage.local.get(['foxvize_state']);
      if (r.foxvize_state) {
        Object.assign(this.state, r.foxvize_state);
      }
      if (this.state.tokenHistory.length > 0) {
        this.els.token.value = this.state.tokenHistory[0] || '';
      }
      this.els.speedSlider.value = this.state.speed || 1.5;
      this.updateSpeed();
    } catch (e) {}
  }

  async saveState() {
    try {
      await chrome.storage.local.set({ foxvize_state: this.state });
    } catch (e) {}
  }

  async paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.els.token.value = text.trim();
        this.saveState();
        this.show('Token yapistirdi!', 'success');
        this.addToHistory(text.trim());
      }
    } catch (e) {
      this.show('Yapistirilmadi - izin verin', 'error');
    }
  }

  async validate() {
    const token = this.els.token.value.trim();
    if (!token) { this.show('Oncetoken girin', 'error'); return; }

    this.show('Dogrulaniyor...', 'info');
    try {
      const resp = await fetch('https://foxvize.online/api/forms/' + token);
      if (!resp.ok) throw new Error('Token bulunamadi');
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      this.els.validateCard.style.display = 'block';
      this.els.validateTitle.textContent = 'Token Gecerli — ' + token;
      this.els.validateGrid.innerHTML = `
        <div class="validate-item ok"><span>✓</span><span>Musteri: ${data.customer?.full_name || '—'}</span></div>
        <div class="validate-item ok"><span>✓</span><span>Vize: ${data.form?.visa_type || '—'}</span></div>
        <div class="validate-item ok"><span>✓</span><span>Cin: ${data.chinese_company?.company_name || '—'}</span></div>
        <div class="validate-item ok"><span>✓</span><span>Turk: ${data.turkish_company?.company_name || '—'}</span></div>
      `;
      this.show('Token gecerli!', 'success');
    } catch (e) {
      this.els.validateCard.style.display = 'block';
      this.els.validateTitle.textContent = 'Token Gecersiz';
      this.els.validateGrid.innerHTML = `<div class="validate-item fail"><span>✗</span><span>${e.message}</span></div>`;
      this.show('Token gecersiz: ' + e.message, 'error');
    }
  }

  async fill(mode) {
    const token = this.els.token.value.trim();
    if (!token) { this.show('Token girin!', 'error'); this.els.token.focus(); return; }

    const page = parseInt(this.els.pageSel.value);
    this.setLoading(true);
    this.showProgress(true);
    this.startTimer();
    this.addToHistory(token);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch (e) {}
      await new Promise(r => setTimeout(r, 150));

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillFormWithToken',
        token, apiUrl: 'https://foxvize.online/api/forms/', pageNumber: page, mode, speed: this.state.speed
      });

      if (response?.success) {
        const elapsed = this.getElapsed();
        this.state.fillCount++;
        this.state.pageCount += (mode === 'fast' ? 9 - page + 1 : 1);
        this.state.successCount++;
        this.state.totalTime += elapsed;
        this.state.lastUsed = new Date().toISOString();
        this.state.streak++;
        this.setProgress(100);
        const msg = mode === 'fast' ? `Tum sayfalar dolduruldu! (${elapsed}s)` : `Sayfa ${page} dolduruldu! (${elapsed}s)`;
        this.show(msg, 'success');
        this.addLog('success', msg, token);
      } else {
        throw new Error(response?.error || 'Bilinmeyen hata');
      }
    } catch (e) {
      if (!e.message.includes('Durduruldu')) {
        this.state.failCount++;
        this.state.streak = 0;
        this.show('Hata: ' + e.message, 'error');
        this.addLog('error', e.message, token);
      }
    } finally {
      this.setLoading(false);
      this.stopTimer();
      this.updateStats();
      this.saveState();
      setTimeout(() => this.showProgress(false), 2500);
    }
  }

  async fillRange() {
    const token = this.els.token.value.trim();
    if (!token) { this.show('Token girin!', 'error'); return; }
    const page = parseInt(this.els.pageSel.value);
    const endPage = Math.min(page + 2, 9);
    this.show(`Sayfa ${page}-${endPage} dolduruluyor...`, 'info');
    this.setLoading(true);
    this.showProgress(true);
    this.startTimer();
    this.addToHistory(token);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch (e) {}
      await new Promise(r => setTimeout(r, 150));

      for (let p = page; p <= endPage; p++) {
        this.setProgress(((p - page) / (endPage - page + 1)) * 100);
        this.els.progressLabel.textContent = `Sayfa ${p} dolduruluyor...`;
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'fillFormWithToken',
          token, apiUrl: 'https://foxvize.online/api/forms/', pageNumber: p, mode: 'single', speed: this.state.speed
        });
        if (!response?.success) throw new Error(response?.error || 'Sayfa ' + p + ' hatasi');
      }

      const elapsed = this.getElapsed();
      this.state.fillCount++;
      this.state.pageCount += (endPage - page + 1);
      this.state.successCount++;
      this.state.totalTime += elapsed;
      this.state.lastUsed = new Date().toISOString();
      this.state.streak++;
      this.setProgress(100);
      this.show(`Sayfa ${page}-${endPage} basariyla dolduruldu! (${elapsed}s)`, 'success');
      this.addLog('success', `Sayfa ${page}-${endPage} dolduruldu`, token);
    } catch (e) {
      this.state.failCount++;
      this.state.streak = 0;
      this.show('Hata: ' + e.message, 'error');
      this.addLog('error', e.message, token);
    } finally {
      this.setLoading(false);
      this.stopTimer();
      this.updateStats();
      this.saveState();
      setTimeout(() => this.showProgress(false), 2500);
    }
  }

  async stop() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'stopFilling' });
      this.show('Durduruldu!', 'error');
      this.addLog('error', 'Kullanici durdurdu', '');
      this.setLoading(false);
      this.stopTimer();
      this.showProgress(false);
    } catch (e) {}
  }

  addToHistory(token) {
    if (!token || this.state.tokenHistory.includes(token)) return;
    this.state.tokenHistory.unshift(token);
    if (this.state.tokenHistory.length > 8) this.state.tokenHistory.pop();
    this.renderHistory();
    this.saveState();
  }

  renderHistory() {
    this.els.historyRow.innerHTML = '';
    this.state.tokenHistory.slice(0, 5).forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'history-chip';
      chip.textContent = t;
      chip.addEventListener('click', () => { this.els.token.value = t; this.saveState(); });
      this.els.historyRow.appendChild(chip);
    });
  }

  addLog(type, msg, token) {
    const entry = { type, msg, token, time: new Date().toISOString() };
    this.state.activityLog.unshift(entry);
    if (this.state.activityLog.length > 50) this.state.activityLog.pop();
    this.renderLog();
    this.saveState();
  }

  renderLog() {
    if (this.state.activityLog.length === 0) {
      this.els.logList.innerHTML = '<div class="log-empty">Henuz islem yapilmadi</div>';
      return;
    }
    this.els.logList.innerHTML = this.state.activityLog.slice(0, 20).map(e => {
      const icon = e.type === 'success' ? '✅' : e.type === 'error' ? '❌' : 'ℹ️';
      const time = this.timeAgo(e.time);
      return `<div class="log-item"><span class="log-icon">${icon}</span><span class="log-msg">${e.msg}</span><span class="log-time">${time}</span></div>`;
    }).join('');
  }

  updateStats() {
    this.els.statForms.textContent = this.state.fillCount;
    this.els.statPages.textContent = this.state.pageCount;
    this.els.statSuccess.textContent = this.state.successCount;
    this.els.statTime.textContent = this.state.totalTime > 60 ? Math.round(this.state.totalTime / 60) + 'm' : this.state.totalTime + 's';

    const total = this.state.successCount + this.state.failCount;
    this.els.avgTime.textContent = 'Ort. sure: ' + (this.state.fillCount > 0 ? Math.round(this.state.totalTime / this.state.fillCount) + 's' : '—');
    this.els.successRate.textContent = 'Basari: ' + (total > 0 ? Math.round((this.state.successCount / total) * 100) + '%' : '—');
    this.els.lastUsed.textContent = 'Son: ' + (this.state.lastUsed ? this.timeAgo(this.state.lastUsed) : '—');
    this.els.streak.textContent = 'Seri: ' + this.state.streak;
  }

  async checkConnection() {
    try {
      const resp = await fetch('https://foxvize.online/api/forms/', { method: 'HEAD', mode: 'no-cors' });
      this.setConnected(true);
    } catch (e) {
      this.setConnected(false);
    }
  }

  setConnected(ok) {
    const badge = this.els.connectionBadge;
    if (ok) {
      badge.className = 'badge badge-green';
      badge.innerHTML = '<div class="badge-dot"></div><span>Bagli</span>';
    } else {
      badge.className = 'badge badge-violet';
      badge.innerHTML = '<div class="badge-dot"></div><span>Cevrimdisi</span>';
    }
  }

  async checkPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url || !tab.url.includes('consular.mfa.gov.cn')) {
        this.show('Cin vize sayfasini acin', 'info');
        this.els.fastBtn.disabled = true;
        this.els.singleBtn.disabled = true;
        this.els.pageRangeBtn.disabled = true;
      }
    } catch (e) {}
  }

  setLoading(v) {
    this.els.fastBtn.disabled = v;
    this.els.singleBtn.disabled = v;
    this.els.pageRangeBtn.disabled = v;
    this.els.token.disabled = v;
    this.els.pageSel.disabled = v;
    this.els.stopBtn.style.display = v ? 'flex' : 'none';
    if (v) {
      this.els.fastBtn.innerHTML = '<span class="spinner"></span> Calisiyor...';
    } else {
      this.els.fastBtn.innerHTML = '<span class="btn-emoji">⚡</span> Tum Sayfalari Doldur';
    }
  }

  showProgress(show) {
    this.els.progressWrap.style.display = show ? 'block' : 'none';
    if (show) { this.els.progressFill.style.width = '0%'; this.els.progressPct.textContent = '0%'; }
  }

  setProgress(pct) {
    const p = Math.min(100, Math.round(pct));
    this.els.progressFill.style.width = p + '%';
    this.els.progressPct.textContent = p + '%';
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.els.progressLabel.textContent = `Calisiyor... (${this.getElapsed()}s)`;
    }, 1000);
    let pct = 0;
    this._progressInterval = setInterval(() => {
      pct += Math.random() * 6;
      if (pct > 92) pct = 92;
      this.setProgress(pct);
    }, 800);
  }

  stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    if (this._progressInterval) { clearInterval(this._progressInterval); this._progressInterval = null; }
  }

  getElapsed() {
    return Math.round((Date.now() - (this.startTime || Date.now())) / 1000);
  }

  show(msg, type) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    this.els.statusDiv.innerHTML = `<span class="status-icon">${icons[type] || ''}</span> ${msg}`;
    this.els.statusDiv.className = 'status ' + type;
    this.els.statusWrap.style.display = 'block';
    clearTimeout(this._hideTimeout);
    this._hideTimeout = setTimeout(() => { this.els.statusWrap.style.display = 'none'; }, 6000);
  }

  async resetAll() {
    if (!confirm('Tum istatistikleri ve gecmisi sifirlamak istediginize emin misiniz?')) return;
    this.state = { fillCount: 0, pageCount: 0, successCount: 0, failCount: 0, totalTime: 0, tokenHistory: [], activityLog: [], speed: 1.5, lastUsed: null, streak: 0 };
    await this.saveState();
    this.renderHistory();
    this.renderLog();
    this.updateStats();
    this.els.validateCard.style.display = 'none';
    this.show('Sifirlandi!', 'success');
  }

  async goToUploadPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch (e) {}
      await new Promise(r => setTimeout(r, 150));
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'goToUploadPage' });
      if (response?.success) {
        this.showDoc('Onay yapildi, belge sayfasina gecildi!', 'success');
      } else {
        this.showDoc('Hata: ' + (response?.error || 'Bilinmeyen'), 'error');
      }
    } catch (e) {
      this.showDoc('Hata: ' + e.message, 'error');
    }
  }

  normalizeTR(str) {
    return str.normalize('NFC')
      .replace(/[üÜ\u00fc\u00dc]/g, 'U')
      .replace(/[şŞ\u015f\u015e]/g, 'S')
      .replace(/[çÇ\u00e7\u00c7]/g, 'C')
      .replace(/[öÖ\u00f6\u00d6]/g, 'O')
      .replace(/[ıİ\u0131\u0130]/g, 'I')
      .replace(/[ğĞ\u011f\u011e]/g, 'G');
  }

  handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const folderName = files[0].webkitRelativePath.split('/')[0];
    this.els.folderPath.value = folderName;
    this.docFiles = {};

    for (const file of files) {
      // Normalize: NFC first, remove extension, uppercase, remove spaces/dashes, normalize Turkish chars
      let raw = file.name.normalize('NFC').toUpperCase().replace(/\.[^.]+$/, '').replace(/[\s_-]+/g, '');
      raw = this.normalizeTR(raw);

      console.log('[FoxVize] File:', file.name, '-> normalized:', raw, '| in DOC_NAMES:', this.DOC_NAMES.includes(raw));

      // Direct match
      if (this.DOC_NAMES.includes(raw)) {
        this.docFiles[raw] = file;
        continue;
      }

      // FOTO
      if (raw === 'FOTO' || raw.includes('FOTOGRAF') || raw.includes('PHOTO') || raw.includes('VESIKALIK')) { this.docFiles['FOTO'] = file; continue; }
      // PASAPORT
      if (raw.includes('PASAPORT') || raw.includes('PASSPORT')) { this.docFiles['PASAPORT'] = file; continue; }
      // KIMLIK
      if (raw === 'KIMLIK' || raw.includes('NUFUSCUZDANI')) { this.docFiles['KIMLIK'] = file; continue; }
      // DAVETIYE
      if (raw.includes('DAVET') || raw.includes('INVITATION')) { this.docFiles['DAVETIYE'] = file; continue; }
      // DILEKCE
      if (raw.includes('DILEKCE')) { this.docFiles['DILEKCE'] = file; continue; }
      // FAALIYET (Faaliyet 1, Faaliyet 2, etc.)
      const faalMatch = raw.match(/FAALIYET(\d*)/);
      if (faalMatch) {
        const num = faalMatch[1] || '1';
        this.docFiles['FAALIYET' + num] = file;
        continue;
      }
      // VERGI
      if (raw.includes('VERGI')) { this.docFiles['VERGI'] = file; continue; }
      // ADLI SICIL
      if (raw.includes('ADLISICIL') || raw.includes('ADLI') || raw.includes('SABIKA')) { this.docFiles['ADLISICIL'] = file; continue; }
      // LISANS
      if (raw.includes('LISANS') || raw.includes('ISLETME')) { this.docFiles['LISANS'] = file; continue; }
      // YETKILI KIMLIK
      if (raw.includes('YETKILIKIMLIK') || raw.includes('TEMSILCI')) { this.docFiles['YETKILIKIMLIK'] = file; continue; }
      // SGK (sgk, sgk1, sgk2, etc.)
      const sgkMatch = raw.match(/SGK(\d*)/);
      if (sgkMatch) {
        const num = sgkMatch[1] || '1';
        this.docFiles['SGK' + num] = file;
        continue;
      }
      // NUFUS (nufus, nufus1, nufus2, nufuskayit1 etc.)
      const nufusMatch = raw.match(/NUFUS(\d*)/);
      if (nufusMatch) {
        const num = nufusMatch[1] || '1';
        this.docFiles['NUFUS' + num] = file;
        continue;
      }
      // VIZE / ESKI VIZE (vize1, vize2, eskivize1 etc.)
      const vizeMatch = raw.match(/VIZE(\d*)/);
      if (vizeMatch && !raw.includes('VERGI')) {
        const num = vizeMatch[1] || '1';
        this.docFiles['VIZE' + num] = file;
        continue;
      }

      // Unmatched - still add as spillover
      console.log('[FoxVize] Unmatched file:', file.name, '(', raw, ')');
      this.docFiles['EXTRA_' + Object.keys(this.docFiles).length] = file;
    }

    this.renderDocFiles();
    this.els.uploadDocsBtn.disabled = Object.keys(this.docFiles).length === 0;

    // Dosyalari storage'a kaydet (arka plan auto-fill icin)
    this.saveFilesToStorage();
  }

  renderDocFiles() {
    this.els.docFilesSection.style.display = 'block';
    const labels = {
      FOTO: 'Fotograf', PASAPORT: 'Pasaport', KIMLIK: 'Kimlik', DAVETIYE: 'Davetiye',
      LISANS: 'Isletme Lisansi', YETKILIKIMLIK: 'Yetkili Kimligi',
      VIZE1: 'Eski Vize 1', VIZE2: 'Eski Vize 2', VIZE3: 'Eski Vize 3', VIZE4: 'Eski Vize 4',
      DILEKCE: 'Dilekce (Sevk Mektubu)', FAALIYET1: 'Faaliyet Belgesi 1', FAALIYET2: 'Faaliyet Belgesi 2', VERGI: 'Vergi Levhasi',
      ADLISICIL: 'Adli Sicil', NUFUS1: 'Nufus Kayit 1', NUFUS2: 'Nufus Kayit 2', NUFUS3: 'Nufus Kayit 3',
      SGK1: 'SGK 1', SGK2: 'SGK 2', SGK3: 'SGK 3', SGK4: 'SGK 4',
    };
    // Show found files first, then missing required ones
    const found = Object.keys(this.docFiles);
    const required = ['PASAPORT', 'KIMLIK'];
    const allKeys = [...new Set([...found, ...required])];

    this.els.docFilesList.innerHTML = allKeys.map(name => {
      const hasFile = !!this.docFiles[name];
      const file = this.docFiles[name];
      const icon = hasFile ? '✅' : '⬜';
      const ext = file ? file.name.split('.').pop().toUpperCase() : '';
      const label = labels[name] || name;
      return `<div class="doc-file ${hasFile ? 'found' : 'missing'}">
        <span class="doc-file-icon">${icon}</span>
        <span class="doc-file-name">${label} ${hasFile ? '(' + ext + ')' : ''}</span>
        <span class="doc-file-status ${hasFile ? 'ok' : 'no'}">${hasFile ? 'Hazir' : 'Yok'}</span>
      </div>`;
    }).join('');
  }

  async saveFilesToStorage() {
    const fileDataArray = [];
    for (const [name, file] of Object.entries(this.docFiles)) {
      const buffer = await file.arrayBuffer();
      const base64 = this.arrayBufferToBase64(buffer);
      fileDataArray.push({ name, fileName: file.name, type: file.type, base64 });
    }
    await chrome.storage.local.set({ foxvize_files: fileDataArray });
    console.log('[FoxVize] Saved', fileDataArray.length, 'files to storage');
    return fileDataArray;
  }

  async uploadDocs() {
    const fileCount = Object.keys(this.docFiles).length;
    if (fileCount === 0) { this.showDoc('Dosya bulunamadi', 'error'); return; }

    this.els.uploadDocsBtn.disabled = true;
    this.els.uploadDocsBtn.innerHTML = '<span class="spinner"></span> Yukleniyor...';
    this.showDoc('Belgeler yukleniyor...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch (e) {}
      await new Promise(r => setTimeout(r, 200));

      const fileDataArray = [];
      for (const [name, file] of Object.entries(this.docFiles)) {
        const buffer = await file.arrayBuffer();
        const base64 = this.arrayBufferToBase64(buffer);
        fileDataArray.push({ name, fileName: file.name, type: file.type, base64 });
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'uploadDocuments',
        files: fileDataArray
      });

      if (response?.success) {
        this.showDoc(`${response.uploaded || fileCount} belge basariyla yuklendi!`, 'success');
        this.addLog('success', `${response.uploaded || fileCount} belge yuklendi`, '');
      } else {
        throw new Error(response?.error || 'Yukleme basarisiz');
      }
    } catch (e) {
      this.showDoc('Hata: ' + e.message, 'error');
      this.addLog('error', 'Belge yukleme: ' + e.message, '');
    } finally {
      this.els.uploadDocsBtn.disabled = false;
      this.els.uploadDocsBtn.innerHTML = '<span class="btn-emoji">📤</span> Belgeleri Yukle';
    }
  }

  showDoc(msg, type) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    this.els.docStatus.innerHTML = `<span class="status-icon">${icons[type] || ''}</span> ${msg}`;
    this.els.docStatus.className = 'status ' + type;
    this.els.docStatusWrap.style.display = 'block';
    clearTimeout(this._docHideTimeout);
    this._docHideTimeout = setTimeout(() => { this.els.docStatusWrap.style.display = 'none'; }, 8000);
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Simdi';
    if (mins < 60) return mins + 'dk';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'sa';
    const days = Math.floor(hours / 24);
    return days + 'g';
  }
}

document.addEventListener('DOMContentLoaded', () => new FoxVizePopup());
