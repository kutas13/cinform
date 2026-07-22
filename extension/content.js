/**
 * CINPANEL - CONTENT SCRIPT v3
 * Hizli doldurma + durdurma destegi
 */
class CinPanelFormFiller {
    constructor() {
        this.formData = null;
        this.isProcessing = false;
        this.shouldStop = false;
        // Input doldurma gecikmesi (0 = anlik)
        this.D = 0;
        // Secim/dropdown/radio gecikmelerini bu carpan ile olceklendir.
        // 1.0 = orijinal hiz, 1.5 = %50 daha sakin (onerilen), 2.0 = iki kat yavas.
        this.SCALE = 1.5;
        this.init();
    }
    init() {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg.action === 'fillFormWithToken') {
                this.shouldStop = false;
                if (msg.speed) this.SCALE = msg.speed;
                this.run(msg.token, msg.apiUrl, msg.pageNumber || 1, msg.mode || 'single')
                    .then(() => sendResponse({ success: true }))
                    .catch(e => sendResponse({ success: false, error: e.message }));
                return true;
            }
            if (msg.action === 'stopFilling') {
                this.shouldStop = true;
                this.isProcessing = false;
                this.notify('Durduruldu!', 'error');
                sendResponse({ success: true });
                return true;
            }
            if (msg.action === 'goToUploadPage') {
                this.goToUploadPage()
                    .then(() => sendResponse({ success: true }))
                    .catch(e => sendResponse({ success: false, error: e.message }));
                return true;
            }
            if (msg.action === 'uploadDocuments') {
                this.uploadDocuments(msg.files)
                    .then(r => sendResponse(r))
                    .catch(e => sendResponse({ success: false, error: e.message }));
                return true;
            }
            if (msg.action === 'autoFillFromPanel') {
                this.shouldStop = false;
                this.SCALE = msg.speed || 1.5;
                this.autoFillAll(msg.token, msg.apiUrl)
                    .then(() => sendResponse({ success: true }))
                    .catch(e => sendResponse({ success: false, error: e.message }));
                return true;
            }
        });
        this.addIndicator();
        this.checkAutoFillHash();
    }

    // URL hash'te foxvize token varsa otomatik baslat
    async checkAutoFillHash() {
        const hash = window.location.hash;
        if (!hash.includes('foxvize=')) return;

        const token = hash.split('foxvize=')[1]?.split('&')[0];
        if (!token) return;

        // Hash'i temizle (URL'de gorunmesin)
        history.replaceState(null, '', window.location.pathname + window.location.search);

        // Sayfa tam yuklenene kadar bekle
        await this.s(2000);

        this.notify('Otomatik doldurma basliyor: ' + token, 'info');
        console.log('[FoxVize] Auto-fill triggered for token:', token);

        try {
            await this.autoFillAll(token, 'https://foxvize.online/api/forms/');
        } catch (e) {
            this.notify('Otomatik doldurma hatasi: ' + e.message, 'error');
        }
    }

    // Tum sayfalari otomatik doldur (1-9) + belge yukleme sayfasina gec
    async autoFillAll(token, apiUrl) {
        if (this.isProcessing) throw new Error('Zaten isleniyor');
        this.isProcessing = true;
        this.shouldStop = false;
        this.notify('Veriler aliniyor...', 'info');

        try {
            const url = apiUrl.endsWith('/') ? apiUrl + token : apiUrl + '/' + token;
            const r = await fetch(url);
            if (!r.ok) throw new Error('Form bulunamadi: ' + token);
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            this.formData = d;

            // Sayfa 1'den 9'a kadar doldur
            for (let p = 1; p <= 9; p++) {
                if (this.shouldStop) { this.notify('Durduruldu!', 'error'); return; }
                this.notify(`Sayfa ${p}/9 dolduruluyor...`, 'info');
                await this.s(300);
                await this.fillPage(p);
                if (p < 9) await this.s(500);
            }

            this.notify('9 sayfa tamamlandi! Belge sayfasina geciliyor...', 'success');

            // Belge yukleme sayfasina gec
            await this.s(1000);
            await this.goToUploadPage();

            this.notify('Belge yukleme sayfasina gecildi!', 'success');

            // Background'a tamamlandi bildirimi gonder
            try {
                chrome.runtime.sendMessage({ action: 'autoFillComplete', token: token, success: true });
            } catch (e) {}
        } catch (e) {
            this.notify('Hata: ' + e.message, 'error');
            try {
                chrome.runtime.sendMessage({ action: 'autoFillComplete', token: token, success: false });
            } catch (ex) {}
            throw e;
        } finally {
            this.isProcessing = false;
        }
    }
    async run(token, apiUrl, startPage, mode) {
        if (this.isProcessing) throw new Error('Zaten isleniyor');
        this.isProcessing = true;
        this.shouldStop = false;
        this.notify('Veriler aliniyor...', 'info');
        try {
            const url = apiUrl.endsWith('/') ? apiUrl + token : apiUrl + '/' + token;
            const r = await fetch(url);
            if (!r.ok) throw new Error('Form bulunamadi');
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            this.formData = d;

            if (mode === 'fast') {
                // Hizli mod: secilen sayfadan baslayip tum sayfalari doldur
                for (let p = startPage; p <= 9; p++) {
                    if (this.shouldStop) { this.notify('Durduruldu!', 'error'); return; }
                    this.notify('Sayfa ' + p + ' dolduruluyor...', 'info');
                    await this.s(100);
                    await this.fillPage(p);
                    if (p < 9) await this.s(700);
                }
                this.notify('Tum sayfalar tamamlandi!', 'success');
            } else {
                this.notify('Sayfa ' + startPage + ' dolduruluyor...', 'info');
                await this.s(100);
                await this.fillPage(startPage);
                this.notify('Sayfa ' + startPage + ' tamamlandi!', 'success');
            }
        } catch (e) { this.notify('Hata: ' + e.message, 'error'); throw e; }
        finally { this.isProcessing = false; }
    }
    async fillPage(p) {
        if (this.shouldStop) return;
        switch(p) {
            case 1: await this.p1(); break;
            case 2: await this.p2(); break;
            case 3: await this.p3(); break;
            case 4: await this.p4(); break;
            case 5: await this.p5(); break;
            case 6: await this.p6(); break;
            case 7: await this.p7(); break;
            case 8: await this.p8(); break;
            case 9: await this.p9(); break;
        }
    }
    chk() { if (this.shouldStop) throw new Error('Durduruldu'); }

    // SAYFA 1
    async p1() {
        const c = this.formData.customer;
        await this.selectTurkey(); this.chk();
        await this.s(this.D);
        const i80 = document.querySelectorAll('input.el-input__inner[maxlength="80"][placeholder="Please enter."]');
        if (i80[0] && c?.birth_province) this.w(i80[0], c.birth_province);
        if (i80[1] && c?.birth_city) this.w(i80[1], c.birth_city);
        await this.s(this.D);
        if (c?.marital_status) this.rad(c.marital_status);
        await this.s(this.D);
        const tc = document.querySelector('input.el-input__inner[minlength="1"][maxlength="80"]');
        if (tc && c?.tc_number) this.w(tc, c.tc_number);
        await this.s(this.D);
        this.allNos();
        await this.s(this.D);
        this.rad('Ordinary');
        await this.s(this.D);
        const pi = document.querySelector('input.el-input__inner[maxlength="120"]');
        if (pi && c?.passport_issue_place) this.w(pi, c.passport_issue_place);
        await this.s(this.D);
        this.next();
    }

    // SAYFA 2
    async p2() {
        const f = this.formData.form;
        const si = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        if (si[0]) { si[0].click(); await this.s(200); for (let it of document.querySelectorAll('.el-select-dropdown__item')) { if (it.textContent.includes('(M)') && it.textContent.includes('Commercial')) { this.ce(it); break; } } }
        await this.s(100); this.chk();
        this.rad('Trade activities'); await this.s(this.D);
        this.rad('Normal'); await this.s(this.D);
        const ni = document.querySelectorAll('input.el-input__inner[maxlength="3"]');
        if (ni[0] && f?.visa_validity_months) this.w(ni[0], String(f.visa_validity_months));
        if (ni[1] && f?.max_duration_days) this.w(ni[1], String(f.max_duration_days));
        await this.s(this.D);
        if (f?.entries_type) this.rad(f.entries_type);
        await this.s(this.D);
        this.next();
    }

    // SAYFA 3
    async p3() {
        const c = this.formData.customer, co = this.formData.turkish_company;
        const ot = c?.occupation_type === 'owner' ? 'Businessperson' : 'Company employee';
        await this.selDrop(ot); await this.s(100); this.chk();
        const yi = document.querySelectorAll('input.el-input__inner[maxlength="4"]');
        if (yi[0] && c?.work_start_year) this.w(yi[0], String(c.work_start_year));
        await this.s(this.D);
        const md = document.querySelectorAll('input.el-input__inner[placeholder="Please select. (Month) "]');
        if (md[0] && c?.work_start_month) {
            const sw0 = md[0].closest('.el-select');
            if (sw0) sw0.click(); else md[0].click();
            await this.s(250);
            await this.cvi(String(c.work_start_month));
        }
        await this.s(150);
        if (yi[1] && c?.work_end_year) this.w(yi[1], String(c.work_end_year));
        await this.s(100);
        if (md[1] && c?.work_end_month) {
            const sw1 = md[1].closest('.el-select');
            if (sw1) sw1.click(); else md[1].click();
            await this.s(250);
            await this.cvi(String(c.work_end_month));
        }
        await this.s(150);
        const ai = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        const pd = c?.occupation_type === 'owner' ? 'Owner' : 'Manager';
        const m = [co?.company_name, co?.address, co?.phone, co?.manager_name, co?.phone, pd, pd];
        for (let i = 0; i < m.length && i < ai.length; i++) { if (m[i]) this.w(ai[i], m[i]); }
        await this.s(this.D);
        this.next();
    }

    // SAYFA 4
    async p4() {
        const ai = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        if (ai[0]) this.w(ai[0], 'ATATURK LISESI');
        await this.s(this.D);
        const si = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        if (si[0]) { si[0].click(); await this.s(200); for (let it of document.querySelectorAll('.el-select-dropdown__item')) { if (it.textContent.includes('Junior college')) { this.ce(it); break; } } }
        await this.s(100);
        if (ai[1]) this.w(ai[1], 'Regular School');
        await this.s(this.D);
        this.next();
    }

    // SAYFA 5
    async p5() {
        const c = this.formData.customer;
        const married = c?.marital_status === 'Married';
        const ti = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        if (ti[0] && c?.home_address) this.w(ti[0], c.home_address);
        if (ti[1] && c?.phone_number) this.w(ti[1], c.phone_number);
        if (ti[2] && c?.phone_number) this.w(ti[2], c.phone_number);
        const ei = document.querySelector('input.el-input__inner[type="email"]');
        if (ei && c?.email) this.w(ei, c.email);
        await this.s(100); this.chk();

        if (!married) {
            for (let l of document.querySelectorAll('label.el-checkbox')) { if (l.textContent.includes('Spouse') && l.textContent.includes('Not applicable')) { l.querySelector('.el-checkbox__inner')?.click(); break; } }
            await this.s(100);
        } else {
            const i150 = document.querySelectorAll('input.el-input__inner[maxlength="150"]');
            if (i150[0] && c?.spouse_last_name) this.w(i150[0], c.spouse_last_name);
            if (i150[1] && c?.spouse_first_name) this.w(i150[1], c.spouse_first_name);
            await this.s(this.D);
            let ss = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
            if (ss[0]) await this.selectTurkeyFromNat(ss[0]);
            await this.s(100);
            ss = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
            for (let s of ss) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('Occupation') && !s.value.includes('Unemployed')) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); await this.cvi('Unemployed'); break; } }
            await this.s(100);
            if (c?.spouse_birth_date) await this.fillDate(c.spouse_birth_date, 0);
            await this.s(100);
            ss = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
            for (let s of ss) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('Country of birth') && !s.value) { await this.selectTurkeyFromNat(s); break; } }
            await this.s(100);
            if (c?.spouse_birth_city) { for (let inp of document.querySelectorAll('input.el-input__inner[maxlength="80"]')) { if (!inp.value) { this.w(inp, c.spouse_birth_city); break; } } }
            await this.s(this.D);
            if (c?.home_address) { for (let ta of document.querySelectorAll('textarea.el-textarea__inner')) { if (!ta.value) { const ns = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; ta.focus(); ns.call(ta, c.home_address); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); break; } } }
            await this.s(this.D);
            this.rad('No'); await this.s(100);
        }
        this.chk();
        const fi = document.querySelectorAll('input.el-input__inner[maxlength="150"]');
        const fI = married ? 2 : 0;
        if (fi[fI] && c?.father_last_name) this.w(fi[fI], c.father_last_name);
        if (fi[fI+1] && c?.father_first_name) this.w(fi[fI+1], c.father_first_name);
        await this.s(this.D);
        let bs = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of bs) { if (!s.value) { await this.selectTurkeyFromNat(s); break; } }
        await this.s(100);
        if (c?.father_birth_date) await this.fillDate(c.father_birth_date, married ? 1 : 0);
        await this.s(this.D);
        this.rad('No'); await this.s(100);
        this.chk();
        const fi2 = document.querySelectorAll('input.el-input__inner[maxlength="150"]');
        const mI = married ? 4 : 2;
        if (fi2[mI] && c?.mother_last_name) this.w(fi2[mI], c.mother_last_name);
        if (fi2[mI+1] && c?.mother_first_name) this.w(fi2[mI+1], c.mother_first_name);
        await this.s(this.D);
        let ms = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of ms) { if (!s.value) { await this.selectTurkeyFromNat(s); break; } }
        await this.s(100);
        if (c?.mother_birth_date) await this.fillDate(c.mother_birth_date, married ? 2 : 1);
        await this.s(this.D);
        for (let l of document.querySelectorAll('label.el-radio')) { if (l.textContent.trim() === 'No' && !l.classList.contains('is-checked')) { l.querySelector('.el-radio__inner')?.click(); await this.s(30); } }
        await this.s(100);
        const cc = c?.children_count || 0;
        const children = c?.children_data || [];
        if (cc === 0 || children.length === 0) {
            for (let l of document.querySelectorAll('label.el-checkbox')) { if (l.textContent.includes('Children') && l.textContent.includes('Not applicable')) { l.querySelector('.el-checkbox__inner')?.click(); break; } }
        } else {
            for (let ci = 0; ci < children.length; ci++) {
                const child = children[ci];
                this.chk();
                if (ci > 0) {
                    const addIcons = document.querySelectorAll('.el-icon-circle-plus-outline');
                    let clicked = false;
                    for (let k = addIcons.length - 1; k >= 0; k--) {
                        const rect = addIcons[k].getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const btn = addIcons[k].closest('button') || addIcons[k].closest('a');
                            if (btn) btn.click(); else addIcons[k].click();
                            clicked = true; break;
                        }
                    }
                    if (!clicked) { const fb = document.querySelector('.el-icon-circle-plus-outline'); if (fb) { const btn = fb.closest('button'); if (btn) btn.click(); else fb.click(); } }
                    await this.s(600);
                }
                const all150 = document.querySelectorAll('input.el-input__inner[maxlength="150"]');
                const empty150 = []; for (let inp of all150) { if (!inp.value) empty150.push(inp); }
                if (empty150[0] && child.last_name) this.w(empty150[0], child.last_name);
                if (empty150[1] && child.first_name) this.w(empty150[1], child.first_name);
                await this.s(100);
                let cSels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
                for (let s of cSels) { if (!s.value) { await this.selectTurkeyFromNat(s); break; } }
                await this.s(200);
                cSels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
                for (let s of cSels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('Occupation') && (!s.value || !s.value.includes('Unemployed'))) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(250); await this.cvi('Unemployed'); break; } }
                await this.s(200);
                if (child.birth_date) { const dps = document.querySelectorAll('.select-date-picker-body'); if (dps.length > 0) await this.fillDate(child.birth_date, dps.length - 1); }
                await this.s(250);
            }
        }
        await this.s(this.D);
        this.next();
    }

    // SAYFA 6
    async p6() {
        const f = this.formData.form, ch = this.formData.chinese_company, ti = this.formData.travel_info, ec = this.formData.emergency_contact;
        if (f?.travel_start_date) await this.fillDate(f.travel_start_date, 0);
        await this.s(100); this.chk();
        const tI = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        if (tI[0]) this.w(tI[0], ti?.arrival_flight || 'TK072');
        await this.s(this.D);
        let sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        if (sels[0]) { const sw = sels[0].closest('.el-select'); if (sw) sw.click(); else sels[0].click(); await this.s(200); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim().includes('Guangzhou')) { this.ce(el); break; } } }
        await this.s(150);
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('District') && !s.value) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim().includes('Baiyun Qu')) { this.ce(el); break; } } break; } }
        await this.s(100); this.chk();
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('City to stay') && !s.value) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); const ss = (ch?.city||'')+','+(ch?.district||''); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim().includes(ss)) { this.ce(el); break; } } break; } }
        await this.s(100);
        const tI2 = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        if (tI2[1] && ch?.address) this.w(tI2[1], ch.address);
        await this.s(this.D);
        if (f?.travel_start_date) await this.fillDate(f.travel_start_date, 1);
        await this.s(100);
        if (f?.travel_end_date) await this.fillDate(f.travel_end_date, 2);
        await this.s(100);
        if (f?.travel_end_date) await this.fillDate(f.travel_end_date, 3);
        await this.s(100); this.chk();
        const tI3 = document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]');
        if (tI3[2]) this.w(tI3[2], ti?.departure_flight || 'TK073');
        await this.s(this.D);
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('City of departure') && !s.value) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim().includes('Guangzhou')) { this.ce(el); break; } } break; } }
        await this.s(150);
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { if (!s.value) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('District')) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim().includes('Baiyun Qu')) { this.ce(el); break; } } break; } } }
        await this.s(100);
        let allE = []; for (let inp of document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]')) { if (!inp.value) allE.push(inp); }
        if (allE[0] && ch?.company_name) this.w(allE[0], ch.company_name);
        if (allE[1]) this.w(allE[1], 'BUSINESS PARTNERSHIP');
        if (allE[2] && ch?.phone) this.w(allE[2], ch.phone);
        if (allE[3] && ch?.email) this.w(allE[3], ch.email);
        await this.s(this.D); this.chk();
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('Province') && !s.value) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim() === (ch?.city || 'GuangDong')) { this.ce(el); break; } } break; } }
        await this.s(150);
        sels = document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for (let s of sels) { const sec = s.closest('.el-form-item'); if (sec && sec.textContent.includes('City') && !sec.textContent.includes('Province') && !s.value) { const sw = s.closest('.el-select'); if (sw) sw.click(); else s.click(); await this.s(200); const ss2 = (ch?.city||'')+','+(ch?.district||''); for (let el of document.querySelectorAll('.el-select-dropdown__item')) { const r = el.getBoundingClientRect(); if (r.width > 0 && el.textContent.trim() === ss2) { this.ce(el); break; } } break; } }
        await this.s(100);
        allE = []; for (let inp of document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]')) { if (!inp.value) allE.push(inp); }
        const em150=[],em80=[];for(let inp of allE){const ml=inp.getAttribute('maxlength');if(ml==='150')em150.push(inp);else if(ml==='80')em80.push(inp);}
        if(em150[0])this.w(em150[0],ec?.family_name||'KUTAS');if(em150[1])this.w(em150[1],ec?.given_name||'YUSUF');
        if(em80[0])this.w(em80[0],ec?.relationship||'FRIEND');if(em80[1])this.w(em80[1],ec?.phone||'05456036547');
        await this.s(this.D);
        for(let inp of document.querySelectorAll('input.el-input__inner[type="email"]')){if(!inp.value){this.w(inp,ec?.email||'gmyusuf13@gmail.com');break;}}
        await this.s(this.D);
        this.rad('Self'); await this.s(this.D);
        this.rad('No'); await this.s(this.D);
        this.next();
    }

    // SAYFA 7
    async p7() {
        const f = this.formData.form;
        if (!f?.been_to_china) {
            for (let l of document.querySelectorAll('label.el-radio')) { if (l.textContent.trim()==='No'&&!l.classList.contains('is-checked')) { l.querySelector('.el-radio__inner')?.click(); await this.s(30); } }
            await this.s(this.D); this.next(); return;
        }
        this.rad('Yes'); await this.s(300);
        for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='Yes'&&!l.classList.contains('is-checked')){l.querySelector('.el-radio__inner')?.click();break;}}
        await this.s(300);
        let sels=document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        if(sels[0]){const sw=sels[0].closest('.el-select');if(sw)sw.click();else sels[0].click();await this.s(200);await this.cvi('M');}
        await this.s(100); this.chk();
        const emp=[];for(let inp of document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]')){if(!inp.value)emp.push(inp);}
        if(emp[0]&&f?.china_visa_number)this.w(emp[0],f.china_visa_number);
        if(emp[1])this.w(emp[1],'ISTANBUL');
        await this.s(this.D);
        const yis=document.querySelectorAll('input.el-input__inner[maxlength="4"]');
        for(let yi of yis){if(!yi.value&&f?.china_visa_year){this.w(yi,String(f.china_visa_year));break;}}
        await this.s(150);
        if(f?.china_visa_month){const mds=document.querySelectorAll('input.el-input__inner[placeholder="Please select. (Month) "]');for(let md of mds){if(!md.value){const sw=md.closest('.el-select');if(sw)sw.click();else md.click();await this.s(250);await this.cvi(String(f.china_visa_month));break;}}}
        await this.s(150);
        if(f?.fingerprint_given){
            for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='Yes'&&!l.classList.contains('is-checked')){l.querySelector('.el-radio__inner')?.click();break;}}
            await this.s(300);
            if(f?.fingerprint_date){const dps=document.querySelectorAll('.select-date-picker-body');if(dps.length>0)await this.fillDate(f.fingerprint_date,dps.length-1);await this.s(150);
            sels=document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');for(let s of sels){if(!s.value){await this.selectTurkeyFromNat(s);break;}}await this.s(100);
            const e2=[];for(let inp of document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]')){if(!inp.value)e2.push(inp);}if(e2[0])this.w(e2[0],'ISTANBUL');}
        } else {
            for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='No'&&!l.classList.contains('is-checked')){const grp=l.closest('.el-form-item')||l.parentElement;if(grp&&grp.querySelector('label.el-radio.is-checked'))continue;l.querySelector('.el-radio__inner')?.click();break;}}
            await this.s(150);
        }
        for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='No'&&!l.classList.contains('is-checked')){const grp=l.closest('.el-form-item')||l.parentElement;if(grp&&grp.querySelector('label.el-radio.is-checked'))continue;l.querySelector('.el-radio__inner')?.click();await this.s(30);}}
        await this.s(this.D); this.next();
    }

    // SAYFA 8
    async p8() {
        const c = this.formData.customer;
        for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='No'&&!l.classList.contains('is-checked')){l.querySelector('.el-radio__inner')?.click();await this.s(30);}}
        await this.s(100); this.chk();
        for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='Yes'){const sec=l.closest('.el-form-item');if(sec&&sec.textContent.includes('8.8')){l.querySelector('.el-radio__inner')?.click();break;}}}
        await this.s(150);
        let sels=document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');
        for(let s of sels){if(!s.value){await this.selectTurkeyFromNat(s);break;}}
        await this.s(100);
        const emp=[];for(let inp of document.querySelectorAll('input.el-input__inner[placeholder="Please enter."]')){if(!inp.value)emp.push(inp);}
        if(emp[0])this.w(emp[0],'MILITARY');if(emp[1])this.w(emp[1],'PAID MILITARY');if(emp[2])this.w(emp[2],'MILITARY');
        await this.s(this.D);
        const by=c?.birth_year||2000;const msy=by+21;
        const yis=document.querySelectorAll('input.el-input__inner[maxlength="4"]');const ey=[];for(let yi of yis){if(!yi.value)ey.push(yi);}
        if(ey[0])this.w(ey[0],String(msy));if(ey[1])this.w(ey[1],String(msy));
        await this.s(100);
        const mds=document.querySelectorAll('input.el-input__inner[placeholder="Please select. (Month) "]');const em=[];for(let md of mds){if(!md.value)em.push(md);}
        if(em[0]){const sw=em[0].closest('.el-select');if(sw)sw.click();else em[0].click();await this.s(200);await this.cvi('1');}
        await this.s(100);
        if(em[1]){const sw=em[1].closest('.el-select');if(sw)sw.click();else em[1].click();await this.s(200);await this.cvi('2');}
        await this.s(this.D);
        this.next();
    }

    // SAYFA 9 - SON SAYFA
    async p9() {
        await this.s(200);
        // Ilk radio (genelde onay) tikla
        const radios = document.querySelectorAll('.el-radio__inner');
        if (radios[0]) radios[0].click();
        await this.s(this.D);
        this.notify('Tum sayfalar tamamlandi!', 'success');
    }

    // === GO TO UPLOAD PAGE ===
    async goToUploadPage() {
        // Click the first radio button (confirmation)
        const radios = document.querySelectorAll('.el-radio__inner');
        if (radios.length > 0) {
            radios[0].click();
            await this.s(300);
        }
        // Click confirm/next button
        const nextBtn = document.querySelector('button.confirm-next') || document.querySelector('.el-button--primary');
        if (nextBtn) {
            nextBtn.click();
            await this.s(500);
            this.notify('Belge yukleme sayfasina gecildi!', 'success');
        } else {
            this.notify('Devam butonu bulunamadi', 'error');
            throw new Error('Devam butonu bulunamadi');
        }
    }

    // === DOCUMENT UPLOAD ===
    async uploadDocuments(files) {
        this.notify('Belgeler yukleniyor...', 'info');
        let uploaded = 0;

        // Find ALL upload areas in page order
        const allAreas = Array.from(document.querySelectorAll('.upload-demo-body'));
        if (allAreas.length === 0) {
            throw new Error('Yukleme alani bulunamadi - dogru sayfada misiniz?');
        }

        console.log('[FoxVize] Found', allAreas.length, 'upload areas');

        // HARDCODED mapping based on known page structure:
        // 0: Pasaport (Zorunlu)
        // 1-7: Vize ve giris/cikis kayit sayfalari (Opsiyonel)
        // 8: Yasal ikamet belgesi (Zorunlu) = KIMLIK
        // 9-10: Yasal ikamet (Opsiyonel)
        // 11-13: Onceki Cin vizesi = VIZE1, VIZE2, VIZE3
        // 14-15: Isim degisikligi
        // 16: Davet mektubu (Zorunlu) = DAVETIYE
        // 17: Isletme Lisansi = LISANS
        // 18: Yetkili Kimligi = YETKILIKIMLIK
        // 19-21: Davet mektubu (Opsiyonel)
        // 22: Sevk mektubu (Zorunlu) = DILEKCE
        // 23: Kayit belgesi (Zorunlu) = FAALIYET1
        // 24: Vergi (Zorunlu) = VERGI
        // 25: SGK (Zorunlu) = SGK1
        // 26-28: Sirket belgesi (Opsiyonel) = SGK2, SGK3, SGK4
        // 29: Sabika kaydi yok (Zorunlu) = ADLISICIL
        // 30: Aile belgeleri (Zorunlu) = NUFUS1
        // 31-33: Basvuru belgesi (Opsiyonel) = NUFUS2, NUFUS3

        const areaByDoc = {
            'PASAPORT': 0,
            'KIMLIK': 8,
            'VIZE1': 11,
            'VIZE2': 12,
            'VIZE3': 13,
            'VIZE4': 1,
            'DAVETIYE': 16,
            'LISANS': 17,
            'YETKILIKIMLIK': 18,
            'DILEKCE': 22,
            'FAALIYET1': 23,
            'FAALIYET2': 28,
            'VERGI': 24,
            'SGK1': 25,
            'SGK2': 26,
            'SGK3': 27,
            'ADLISICIL': 29,
            'NUFUS1': 30,
            'NUFUS2': 31,
            'NUFUS3': 32,
        };

        // Spillover areas for unmatched files (other visa pages + extra slots)
        const spillover = [2, 3, 4, 5, 6, 7, 9, 10, 14, 15, 19, 20, 21, 33];

        console.log('[FoxVize] Area mapping:', JSON.stringify(areaByDoc));
        console.log('[FoxVize] Spillover areas:', spillover);

        // Upload files
        console.log('[FoxVize] === UPLOAD MAP ===');
        for (const fileData of files) {
            const idx = areaByDoc[fileData.name];
            console.log(`[FoxVize] ${fileData.name} -> index ${idx !== undefined ? idx : 'SPILLOVER'}`);
        }
        console.log('[FoxVize] === UPLOADING ===');

        let spillIdx = 0;
        for (const fileData of files) {
            let areaIdx = areaByDoc[fileData.name];

            // If not found in map, use spillover
            if (areaIdx === undefined) {
                if (spillIdx < spillover.length) {
                    areaIdx = spillover[spillIdx];
                    spillIdx++;
                    console.log('[FoxVize] Spillover for:', fileData.name, '-> area', areaIdx);
                } else {
                    console.log('[FoxVize] No area for:', fileData.name);
                    continue;
                }
            }

            const targetArea = allAreas[areaIdx];
            if (!targetArea) { console.log('[FoxVize] Area index invalid:', areaIdx); continue; }

            try {
                const binary = atob(fileData.base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([bytes], { type: fileData.type || 'application/octet-stream' });
                const file = new File([blob], fileData.fileName, { type: fileData.type || 'application/octet-stream' });

                const input = targetArea.querySelector('input[type="file"]');
                if (!input) { console.log('[FoxVize] No input for:', fileData.name); continue; }

                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));

                uploaded++;
                this.notify(`${fileData.name} yuklendi (${uploaded}/${files.length})`, 'info');
                await this.s(1000);
            } catch (e) {
                console.error('[FoxVize] Upload error for', fileData.name, e);
            }
        }

        if (uploaded > 0) {
            this.notify(`${uploaded} belge basariyla yuklendi!`, 'success');
            return { success: true, uploaded };
        } else {
            throw new Error('Hicbir belge yuklenemedi - upload alanlari eslesemedi');
        }
    }

    // === HELPERS ===
    async selectTurkey(){const si=document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');if(!si[0])return;si[0].click();await this.s(200);const ns=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;ns.call(si[0],'Türkiye');si[0].dispatchEvent(new Event('input',{bubbles:true}));await this.s(200);for(let el of document.querySelectorAll('li, span, div')){if(el.children.length>3)continue;const r=el.getBoundingClientRect();if(r.width===0)continue;const t=el.textContent.trim();if((t==='Türkiye'||t==='Turkey')&&t.length<20){this.ce(el);break;}}await this.s(100);}
    async selectTurkeyFromNat(inp){inp.click();await this.s(150);const ns=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;ns.call(inp,'Türkiye');inp.dispatchEvent(new Event('input',{bubbles:true}));await this.s(150);for(let el of document.querySelectorAll('.el-select-dropdown__item, li, span, div')){if(el.children.length>3)continue;const r=el.getBoundingClientRect();if(r.width===0)continue;const t=el.textContent.trim();if((t==='Türkiye'||t==='Turkey')&&t.length<20){this.ce(el);return;}}}
    async fillDate(ds,idx){const d=new Date(ds);if(isNaN(d.getTime()))return;const y=d.getFullYear(),m=d.getMonth()+1,dy=d.getDate();const yi=document.querySelectorAll('input.el-input__inner[maxlength="4"]');if(yi[idx])this.w(yi[idx],String(y));await this.s(150);const dp=document.querySelectorAll('.select-date-picker-body');if(dp[idx]){const ms=dp[idx].querySelector('.select-date-picker-two .el-select');if(ms){ms.click();await this.s(200);await this.cvi(String(m));await this.s(150);}const ds2=dp[idx].querySelector('.select-date-picker-three .el-select');if(ds2){ds2.click();await this.s(200);await this.cvi(String(dy));await this.s(150);}}}
    async cvi(val){const ps=document.querySelectorAll('.el-select-dropdown.el-popper');for(let i=ps.length-1;i>=0;i--){const st=window.getComputedStyle(ps[i]);if(st.display==='none')continue;for(let it of ps[i].querySelectorAll('.el-select-dropdown__item')){if(it.textContent.trim()===val){this.ce(it);return;}}}for(let it of document.querySelectorAll('.el-select-dropdown__item')){const r=it.getBoundingClientRect();if(r.width>0&&it.textContent.trim()===val){this.ce(it);return;}}}
    async selDrop(txt){const dd=document.querySelectorAll('input.el-input__inner[placeholder="Please select."]');if(!dd[0])return;dd[0].click();await this.s(200);for(let it of document.querySelectorAll('.el-select-dropdown__item')){if(it.textContent.trim().includes(txt)){this.ce(it);return;}}}
    async selMonth(inp,val){const sw=inp.closest('.el-select')||inp.closest('div');if(sw)sw.click();inp.click();await this.s(200);for(let it of document.querySelectorAll('.el-select-dropdown__item')){const r=it.getBoundingClientRect();if(r.width>0&&it.textContent.trim()===val){this.ce(it);return;}}}
    ce(el){const r=el.getBoundingClientRect();for(let e of['mouseenter','mouseover','mousedown','mouseup','click']){el.dispatchEvent(new MouseEvent(e,{bubbles:true,cancelable:true,view:window,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));}}
    norm(v){if(v===null||v===undefined)return'';const s=String(v);if(s.includes('@'))return s.trim();return s.toUpperCase().replace(/İ/g,'I').replace(/İ/g,'I').replace(/Ü/g,'U').replace(/Ç/g,'C').replace(/Ğ/g,'G').replace(/Ş/g,'S').replace(/Ö/g,'O').replace(/\s+/g,' ').trim();}
    w(inp,val){if(!inp||!val)return;const ns=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;const nv=this.norm(val);inp.focus();ns.call(inp,'');inp.dispatchEvent(new Event('input',{bubbles:true}));ns.call(inp,nv);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));inp.dispatchEvent(new Event('blur',{bubbles:true}));}
    rad(txt){for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim().toLowerCase().includes(txt.toLowerCase())){const i=l.querySelector('.el-radio__inner');if(i){i.click();return true;}}}return false;}
    allNos(){for(let l of document.querySelectorAll('label.el-radio')){if(l.textContent.trim()==='No'){const s=l.closest('.el-form-item');if(s&&(s.textContent.includes('nationality')||s.textContent.includes('resident')||s.textContent.includes('1.6'))){const i=l.querySelector('.el-radio__inner');if(i&&!l.classList.contains('is-checked'))i.click();}}}}
    next(){const b=document.querySelector('button.confirm-next');if(b)b.click();}
    s(ms){const t=Math.round(ms*(this.SCALE||1));return new Promise(r=>setTimeout(r,t));}
    addIndicator(){if(!location.hostname.includes('consular.mfa.gov.cn'))return;const e=document.createElement('div');e.innerHTML='<div style="position:fixed;top:16px;left:16px;z-index:10000;background:#1e1b4b;color:#818cf8;padding:8px 16px;border-radius:10px;font:600 12px -apple-system,sans-serif;box-shadow:0 4px 20px rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.2)">CinPanel Hazir</div>';document.body.appendChild(e);setTimeout(()=>e.remove(),4000);}
    notify(msg,type){document.querySelectorAll('.cp-n').forEach(e=>e.remove());const c={success:'#34d399',error:'#f87171',info:'#818cf8'}[type]||'#818cf8';const e=document.createElement('div');e.className='cp-n';e.innerHTML=`<div style="position:fixed;top:16px;right:16px;z-index:10001;background:rgba(15,23,42,0.95);color:${c};padding:14px 20px;border-radius:12px;font:600 13px -apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5);border:1px solid ${c}30;max-width:320px">${msg}</div>`;document.body.appendChild(e);setTimeout(()=>e.remove(),4000);}
}
if(location.hostname.includes('consular.mfa.gov.cn'))new CinPanelFormFiller();