"use strict";
/* ============================================================
   KÖPRÜ — Uygulama (arayüz + iş mantığı)
   Veriler: js/storage.js (kullanıcıya özel)
   Kamera:  js/camera.js  (köprü/realtime_uyari.py portu)
   Ayarlar: js/config.js
   ============================================================ */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const C = window.KOPRU_CONFIG, S = window.Storage, Cam = window.KopruCam;
const CATALOG = window.FISH_CATALOG || [];

/* ---------- yardımcılar ---------- */
let toastT;
function toast(msg){ $("#toastText").textContent = msg; $("#toast").classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => $("#toast").classList.remove("show"), 2600); }
function openModal(html){ $("#modalBox").innerHTML = html; $("#modalOverlay").classList.remove("hidden"); }
function closeModal(){ $("#modalOverlay").classList.add("hidden"); }
window.closeModal = closeModal;
$("#modalOverlay").addEventListener("click", e => { if (e.target.id === "modalOverlay") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape"){ closeModal(); closeCtx(); $("#notifMenu").classList.add("hidden"); } });

function iso(d){ const x = d || new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); }
function fmt(s){ return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }
function fmtH(s){ return String(Math.floor(s/3600)).padStart(2,"0") + ":" + String(Math.floor(s%3600/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }
function fmtMin(m){ m = Math.round(m); return m >= 60 ? Math.floor(m/60) + "sa " + (m%60 ? m%60 + "dk" : "") : m + "dk"; }
function trDate(isoStr){ try { return new Date(isoStr + "T12:00").toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" }); } catch { return isoStr; } }
function weekDays(offset){ // Pzt..Paz ISO listesi (offset: 0 bu hafta, -1 geçen hafta)
  const now = new Date(); const day = (now.getDay() + 6) % 7; // Pzt=0
  const mon = new Date(now); mon.setDate(now.getDate() - day + offset * 7);
  return Array.from({length:7}, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return iso(d); });
}
function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

/* bağlam menüsü */
let ctxEl = null;
function openCtx(anchor, items){
  closeCtx();
  ctxEl = document.createElement("div"); ctxEl.className = "ctx-menu";
  items.forEach(it => { const b = document.createElement("button"); b.innerHTML = it.html; if (it.danger) b.classList.add("danger"); b.onclick = () => { closeCtx(); it.fn(); }; ctxEl.appendChild(b); });
  document.body.appendChild(ctxEl);
  const r = anchor.getBoundingClientRect();
  ctxEl.style.top = Math.min(r.bottom + 6, innerHeight - ctxEl.offsetHeight - 10) + "px";
  ctxEl.style.left = Math.min(r.left, innerWidth - ctxEl.offsetWidth - 10) + "px";
}
function closeCtx(){ if (ctxEl){ ctxEl.remove(); ctxEl = null; } }
document.addEventListener("click", e => { if (ctxEl && !ctxEl.contains(e.target) && !e.target.closest(".dots-btn")) closeCtx(); });

/* ---------- profil / XP ---------- */
function profile(){ return S.get("profile", { name: "Kaptan", level: 1, xp: 0, xpMax: 1000, joined: iso() }); }
function saveProfile(p){ S.set("profile", p); renderProfileEverywhere(); }
function addXp(n){
  const p = profile(); p.xp += n;
  while (p.xp >= p.xpMax){ p.xp -= p.xpMax; p.level++; p.xpMax += 200; toast("Tebrikler Kaptan! Seviye " + p.level + " oldun ⚓"); addNotif("flame", "Seviye atladın!", "Artık Seviye " + p.level + " kaptanısın."); }
  saveProfile(p);
}
function renderProfileEverywhere(){
  const p = profile(), pct = Math.round(p.xp / p.xpMax * 100) + "%";
  $("#sideName").textContent = p.name; $("#profName").textContent = p.name;
  $("#sideXp").style.width = pct; $("#profXpBar").style.width = pct;
  $("#sideLevel").textContent = "Seviye " + p.level; $("#profLevel").textContent = "Seviye " + p.level;
  $("#sideXpText").textContent = p.xp + " / " + p.xpMax + " XP"; $("#profXp").textContent = p.xp + " / " + p.xpMax + " XP";
  $("#pfJoined").textContent = trDate(p.joined);
  if (!$("#page-home").classList.contains("hidden")) $("#pageTitle").textContent = greeting();
  const saat = totalMinutes() / 60;
  $("#profTitle").textContent = saat >= 20 ? "Usta Kaptan" : saat >= 10 ? "Derin Odakçı" : saat >= 5 ? "Denizci" : saat >= 1 ? "Tayfa" : "Çaylak Denizci";
}

/* ---------- bildirimler ---------- */
function addNotif(icon, t, d){
  S.update("notifs", a => { a.unshift({ icon, t, d, ts: Date.now() }); return a.slice(0, 12); }, []);
  $("#notifDot").classList.remove("hidden");
  renderNotifs();
}
function renderNotifs(){
  const a = S.get("notifs", []);
  const icons = { alert: ["var(--red-soft)", "var(--red)", "i-alert"], fish: ["var(--green-soft)", "var(--green)", "i-fish"], flame: ["var(--orange-soft)", "var(--orange)", "i-flame"] };
  $("#notifList").innerHTML = a.length ? a.map(n => {
    const [bg, fg, ic] = icons[n.icon] || icons.flame;
    const dk = Math.round((Date.now() - n.ts) / 60000);
    const when = dk < 1 ? "Şimdi" : dk < 60 ? dk + " dk önce" : Math.round(dk/60) + " sa önce";
    return `<div class="notif-item"><div class="ic" style="background:${bg};color:${fg}"><svg width="17" height="17"><use href="#${ic}"/></svg></div><div><div class="t">${esc(n.t)}</div><div class="d">${esc(n.d)} · ${when}</div></div></div>`;
  }).join("") : '<div class="notif-empty">Henüz bildirim yok.</div>';
}
$("#notifBtn").onclick = e => { e.stopPropagation(); renderNotifs(); $("#notifMenu").classList.toggle("hidden"); $("#notifDot").classList.add("hidden"); };
document.addEventListener("click", e => { if (!e.target.closest("#notifMenu") && !e.target.closest("#notifBtn")) $("#notifMenu").classList.add("hidden"); });

/* ---------- giriş ---------- */
let isRegister = false;
function setLoginMode(reg){
  isRegister = reg;
  $("#tabLogin").classList.toggle("active", !reg); $("#tabRegister").classList.toggle("active", reg);
  $("#nameField").classList.toggle("hidden", !reg); $("#nameMsg").classList.toggle("hidden", !reg);
  $("#loginSubmit").firstChild.textContent = reg ? "Kayıt Ol " : "Giriş Yap ";
  $("#loginFoot").innerHTML = reg ? 'Zaten hesabın var mı? <a id="switchLink">Giriş yap</a>' : 'Hesabın yok mu? <a id="switchLink">Kayıt ol</a>';
  $("#switchLink").onclick = () => setLoginMode(!isRegister);
}
$("#tabLogin").onclick = () => setLoginMode(false);
$("#tabRegister").onclick = () => setLoginMode(true);
$("#switchLink").onclick = () => setLoginMode(true);
$("#togglePass").onclick = () => {
  const p = $("#password"), show = p.type === "password";
  p.type = show ? "text" : "password";
  $("#togglePass").innerHTML = '<svg width="19" height="19"><use href="#i-' + (show ? "eye" : "eye-off") + '"/></svg>';
};
$("#forgotLink").onclick = e => { e.preventDefault();
  openModal(`<h3>Şifremi Unuttum <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <p style="color:var(--muted);font-size:13.5px;margin-bottom:6px">E-posta adresini gir, sıfırlama bağlantısı gönderelim.</p>
  <label class="f-label">E-posta</label><input class="f-input" id="resetMail" type="email" placeholder="ornek@mail.com">
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Vazgeç</button><button class="btn-navy" id="resetSend">Gönder</button></div>`);
  $("#resetSend").onclick = () => { const v = $("#resetMail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ $("#resetMail").style.borderColor = "var(--red)"; return; }
    closeModal(); toast("Sıfırlama bağlantısı " + v + " adresine gönderildi"); };
};
$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  let ok = true;
  const email = $("#email").value.trim(), pass = $("#password").value, nm = $("#fullName").value.trim();
  ["emailField","passField","nameField"].forEach(id => $("#"+id).classList.remove("err"));
  ["emailMsg","passMsg","nameMsg"].forEach(id => $("#"+id).textContent = "");
  if (isRegister && !nm){ $("#nameField").classList.add("err"); $("#nameMsg").textContent = "Lütfen adını gir."; ok = false; }
  if (!email){ $("#emailField").classList.add("err"); $("#emailMsg").textContent = "E-posta adresi gerekli."; ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ $("#emailField").classList.add("err"); $("#emailMsg").textContent = "Geçerli bir e-posta adresi gir."; ok = false; }
  if (!pass){ $("#passField").classList.add("err"); $("#passMsg").textContent = "Şifre gerekli."; ok = false; }
  else if (pass.length < 6){ $("#passField").classList.add("err"); $("#passMsg").textContent = "Şifre en az 6 karakter olmalı."; ok = false; }
  if (!ok) return;
  enterApp(email, $("#rememberMe").checked, isRegister ? nm : null);
});
$("#googleBtn").onclick = () => enterApp("google-kullanicisi@kopru.app", $("#rememberMe").checked, null);

function enterApp(email, remember, registerName){
  S.login(email, remember);
  const p = profile();
  if (registerName) p.name = registerName.split(" ")[0];
  else if (!S.get("profile", null)) p.name = email.split("@")[0];
  if (!S.get("profile", null)) p.joined = iso();
  S.set("profile", p);
  $("#loginScreen").classList.add("hidden"); $("#app").classList.remove("hidden");
  applySettingsToUI();
  renderAll();
  startSession();
  startQuoteRotation();
  populateCameras();
  toast("Hoş geldin, " + p.name + "! ⚓");
}

/* ---------- sayfa yönlendirme ---------- */
const PAGES = {
  home:     { t: () => greeting(),      s: "Bugün odaklan, ilerlemeni denize bırak." },
  focus:    { t: () => "Odak Modu",     s: "Dikkatini rotana ver, ilerlemen seni bekliyor." },
  tasks:    { t: () => "Görevler",      s: "Görevlerini planla, odaklan ve tamamla." },
  stats:    { t: () => "İstatistikler", s: "Odaklanma yolculuğunu verilerle keşfet." },
  catches:  { t: () => "Yakalamalarım", s: "Odaklandıkça denizin sana sundukları çoğalır." },
  settings: { t: () => "Ayarlar",       s: "Deneyimini kişiselleştir, odak yolculuğunu özelleştir." },
  profile:  { t: () => "Profilim",      s: "Yolculuğunu görüntüle ve kişisel ayarlarını yönet." }
};
function greeting(){
  const h = new Date().getHours();
  return (h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar") + ", " + profile().name;
}
function goto(page){
  $$(".page").forEach(p => p.classList.add("hidden"));
  $("#page-" + page).classList.remove("hidden");
  $$(".nav button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  $("#pageTitle").textContent = PAGES[page].t();
  $("#pageSub").textContent = PAGES[page].s;
  $("#topBoat").style.display = page === "home" ? "none" : "block";
  $("#notifMenu").classList.add("hidden");
  if (page === "stats") renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$(".nav button").forEach(b => b.onclick = () => goto(b.dataset.page));
document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g) goto(g.dataset.goto); });
$("#sideProfile").onclick = () => goto("profile");

/* ---------- tema ---------- */
function applyTheme(t){
  S.update("settings", s => { s.theme = t; return s; }, {});
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.classList.toggle("dark", dark);
  $("#darkIcon").innerHTML = '<use href="#i-' + (dark ? "sun" : "moon") + '"/>';
  $$(".theme-opt").forEach(b => b.classList.toggle("sel", b.dataset.theme === t));
}
$("#darkBtn").onclick = () => applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
$$(".theme-opt").forEach(b => b.onclick = () => { applyTheme(b.dataset.theme); toast("Tema: " + b.textContent.trim()); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (S.get("settings", {}).theme === "system") applyTheme("system"); });

/* ---------- oturum sayacı ---------- */
let sessionSec = 0, sessionPaused = false, sessionInt = null;
function startSession(){
  if (sessionInt) return;
  sessionInt = setInterval(() => { if (!sessionPaused){ sessionSec++; renderChip(); } }, 1000);
  renderChip();
}
function renderChip(){
  if (T.running || T.sec < T.total){
    $("#chipLabel").textContent = T.isBreak ? "ARA SÜRESİ" : "ODAK SÜRESİ";
    $("#chipTime").textContent = fmt(T.sec);
  } else {
    $("#chipLabel").textContent = "OTURUM SÜRESİ";
    $("#chipTime").textContent = fmtH(sessionSec);
  }
}
$("#chipPause").onclick = () => {
  if (T.running || T.sec < T.total) toggleFocus();
  else { sessionPaused = !sessionPaused; toast(sessionPaused ? "Oturum sayacı duraklatıldı" : "Oturum sayacı devam ediyor");
    $("#chipPauseIcon").innerHTML = '<use href="#i-' + (sessionPaused ? "play" : "pause") + '"/>'; }
};

/* ---------- odak zamanlayıcı ---------- */
const T = { sec: 25*60, total: 25*60, running: false, isBreak: false, mode: "derin", startedAt: null };
let focusInt = null;
function renderTimers(){
  $("#homeClock").textContent = fmt(T.sec); $("#focusClock").textContent = fmt(T.sec);
  const pct = T.total ? Math.round((T.total - T.sec) / T.total * 100) : 0;
  $("#focusBar").style.width = pct + "%"; $("#focusPct").textContent = pct + "%";
  $("#focusRing").style.strokeDashoffset = String(408.4 * (1 - pct/100));
  $("#focusGoal").textContent = "Hedefin: 1 " + (T.isBreak ? "ara" : "odak seansı") + " (" + Math.round(T.total/60) + " dk)";
  renderChip();
}
function setFocusButtons(){
  const txt = T.running ? "Duraklat" : (T.sec < T.total ? "Devam Et" : "Odak Modunu Başlat");
  const ic = T.running ? "pause" : "play";
  $("#homeStartText").textContent = txt; $("#focusStartText").textContent = txt;
  $("#homeStartIcon").innerHTML = '<use href="#i-' + ic + '"/>'; $("#focusStartIcon").innerHTML = '<use href="#i-' + ic + '"/>';
  $("#chipPauseIcon").innerHTML = '<use href="#i-' + (T.running ? "pause" : "play") + '"/>';
}
function toggleFocus(){
  T.running = !T.running;
  if (T.running){
    if (!T.startedAt){
      T.startedAt = Date.now();
      if (!T.isBreak) S.update("starts", m => { m[iso()] = (m[iso()] || 0) + 1; return m; }, {});
    }
    focusInt = setInterval(() => { T.sec--; if (T.sec <= 0){ finishFocus(); return; } renderTimers(); }, 1000);
    toast(T.isBreak ? "Ara başladı, iyi dinlenmeler ☕" : "Odak modu başladı. Rüzgar arkanda, Kaptan! ⚓");
    if (!T.isBreak && !Cam.running) toast("İpucu: Odak Modu sekmesinden kamerayı başlatırsan seni ben uyarırım 👁");
  } else { clearInterval(focusInt); toast("Zamanlayıcı duraklatıldı"); }
  setFocusButtons(); renderTimers();
}
function finishFocus(){
  clearInterval(focusInt); T.running = false;
  const wasBreak = T.isBreak, minutes = Math.round(T.total / 60), started = T.startedAt;
  T.sec = T.total; T.startedAt = null;
  setFocusButtons(); renderTimers();
  if (wasBreak){ toast("Ara bitti. Rotaya dönme zamanı! 🧭"); return; }
  // seansı kaydet (kullanıcıya özel istatistik)
  S.push("sessions", { date: iso(), minutes, mode: T.mode, hour: new Date(started || Date.now()).getHours(), completed: true, ts: Date.now() });
  addXp(C.XP_SEANS);
  catchFish(minutes);
  renderAll();
}
function setDuration(min, isBreak){
  if (T.running && !T.isBreak) toast("Seans sıfırlandı");
  clearInterval(focusInt); T.running = false; T.startedAt = null;
  T.total = min * 60; T.sec = min * 60; T.isBreak = !!isBreak;
  setFocusButtons(); renderTimers();
}
$("#homeStart").onclick = toggleFocus;
$("#focusStart").onclick = toggleFocus;
$("#focusBreak").onclick = () => { setDuration(5, true); toggleFocus(); };
$$(".preset[data-min]").forEach(p => p.onclick = () => {
  $$(".preset").forEach(x => x.classList.remove("sel")); p.classList.add("sel");
  setDuration(+p.dataset.min, p.dataset.type.includes("Ara"));
  toast(p.dataset.min + " dk " + p.dataset.type.toLowerCase() + " ayarlandı");
});
$("#customPreset").onclick = () => {
  openModal(`<h3>Süreyi Özelleştir <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <label class="f-label">Süre (dakika)</label><input class="f-input" id="custMin" type="number" min="1" max="180" value="30">
  <label class="f-label">Tür</label>
  <div class="select" style="width:100%"><select class="f-input" id="custType" style="appearance:none"><option value="focus">Odak</option><option value="break">Ara</option></select></div>
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Vazgeç</button><button class="btn-navy" id="custOk">Uygula</button></div>`);
  $("#custOk").onclick = () => {
    const m = Math.max(1, Math.min(180, parseInt($("#custMin").value) || 25));
    $$(".preset").forEach(x => x.classList.remove("sel")); $("#customPreset").classList.add("sel");
    setDuration(m, $("#custType").value === "break"); closeModal(); toast(m + " dk ayarlandı");
  };
};
$("#homeMode").onchange = e => { T.mode = e.target.value; $("#focusMode").value = T.mode; };
$("#focusMode").onchange = e => { T.mode = e.target.value; $("#homeMode").value = T.mode; };
$("#soundFab").onclick = () => {
  const s = S.update("settings", x => { x.ambient = x.ambient === false; return x; }, {});
  $("#soundIcon").innerHTML = '<use href="#i-volume' + (s.ambient === false ? "-x" : "") + '"/>';
  $("#setAmbient").checked = s.ambient !== false;
  toast(s.ambient === false ? "Ortam sesi kapatıldı" : "Ortam sesi açıldı 🌊");
};

/* ---------- KAMERA (odak takip sistemi bağlantısı) ---------- */
function camUIRunning(on){
  $("#camOff").classList.toggle("hidden", on);
  $("#camVideo").classList.toggle("hidden", !on);
  $("#camCanvas").classList.toggle("hidden", !on);
  $("#camStatus").classList.toggle("hidden", !on);
  if (!on) $("#camAlert").classList.add("hidden");
  $("#camStateDot").style.background = on ? "var(--green)" : "var(--muted2)";
  $("#camStateText").textContent = on ? "Kamera: Aktif" : "Kamera: Kapalı";
  $("#camState").style.color = on ? "var(--green)" : "var(--muted)";
  $("#camToggleText").textContent = on ? "Kamerayı Kapat" : "Kamerayı Aç";
  $("#camToggleIcon").innerHTML = '<use href="#i-camera' + (on ? "-off" : "") + '"/>';
  applyPreview();
}
function applyPreview(){
  const show = S.get("settings", {}).preview !== false;
  $("#camVideo").style.visibility = show ? "visible" : "hidden";
  $("#camCanvas").style.visibility = show ? "visible" : "hidden";
}
async function startCam(){
  try {
    $("#camStateText").textContent = "Başlatılıyor…";
    await Cam.start($("#camVideo"), $("#camCanvas"));
    camUIRunning(true);
    toast("Odak takip sistemi aktif 👁 Model yüklendi.");
  } catch (err) {
    camUIRunning(false);
    const msg = (err && err.name === "NotAllowedError") ? "Kamera izni reddedildi. Tarayıcı ayarlarından izin vermelisin."
              : (err && err.name === "NotFoundError") ? "Kamera bulunamadı." : "Kamera başlatılamadı: " + (err.message || err);
    toast(msg);
  }
}
function stopCam(){ Cam.stop(); camUIRunning(false); toast("Kamera izleme kapatıldı"); }
$("#camStartBtn").onclick = startCam;
$("#camToggle").onclick = () => Cam.running ? stopCam() : startCam();

Cam.onStatus = st => {
  const box = $("#camStatus");
  box.textContent = st.text;
  box.className = "cam-status " + (st.color || "muted");
  const yuz = { alarm: "Gözler Kapalı", "kapali-goz": "Gözler Kapalı", odak: "Gözler Açık", "yuz-yok": "Yüz Yok", bekleniyor: "Aranıyor…", yukleniyor: "—", kapali: "—" }[st.state] || "—";
  const fv = $("#faceStateV"); fv.textContent = yuz;
  fv.className = "v " + (st.state === "odak" ? "green" : (st.state === "alarm" ? "red" : (st.color === "orange" ? "orange" : "")));
  const warns = Cam.uyariSayisi;
  const attn = $("#attnLevelV");
  attn.textContent = st.state === "alarm" ? "Düşük" : warns === 0 ? "Yüksek" : warns < 3 ? "Orta" : "Düşük";
  attn.className = "v " + (st.state === "alarm" || warns >= 3 ? "red" : warns === 0 ? "green" : "orange");
  $("#camAlert").classList.toggle("hidden", st.state !== "alarm");
  if (st.state === "alarm") $("#camAlertT1").textContent = "Uyanık kal! " + st.text.replace("UYARI! ", "");
  if (Cam.sonUyari) $("#lastWarnV").textContent = Math.round((Date.now() - Cam.sonUyari) / 1000) + " sn önce";
};
Cam.onAlarm = reason => {
  S.push("warnings", { time: Date.now(), reason });
  addNotif("alert", reason, "Odak takip sistemi uyarı verdi");
  renderWarnings();
};
function renderWarnings(){
  const today = S.get("warnings", []).filter(w => iso(new Date(w.time)) === iso());
  $("#warnCount").textContent = today.length;
  const last = today.slice(-4).reverse();
  $("#warnList").innerHTML = last.length ? last.map(w => {
    const dk = Math.round((Date.now() - w.time) / 60000);
    const when = dk < 1 ? "Şimdi" : dk + " dk önce";
    return `<div class="warn-row"><svg width="18" height="18"><use href="#i-alert"/></svg><div><div class="t">${esc(w.reason)}.</div><div class="d">Lütfen uyanık kal ve odaklanmaya devam et.</div></div><span class="when">${when}</span></div>`;
  }).join("") : '<div class="warn-empty">Bu oturumda uyarı yok. Böyle devam, Kaptan! ⚓</div>';
}
async function populateCameras(){
  const devs = await Cam.listDevices();
  const sel = $("#setCam");
  const cur = S.get("settings", {}).camId || "";
  sel.innerHTML = '<option value="">Varsayılan Kamera</option>' + devs.map((d, i) => `<option value="${esc(d.deviceId)}" ${d.deviceId === cur ? "selected" : ""}>${esc(d.label || "Kamera " + (i+1))}</option>`).join("");
}

/* ---------- GÖREVLER ---------- */
const CAT_META = { Akademik: ["#e8f2f6", "#1d5068", "i-book"], Kişisel: ["#e4f5ee", "#1fa97a", "i-user"], Sağlık: ["#fdecea", "#d63b2f", "i-heart"], Diğer: ["#eef3f5", "#71909f", "i-dots"] };
let taskFilter = "all", showDone = false;
function tasks(){ return S.get("tasks", []); }
function saveTasks(a){ S.set("tasks", a); }
function taskRowHTML(t){
  const meta = CAT_META[t.cat] || CAT_META["Diğer"];
  return `<div class="task-row" data-id="${t.id}">
    <input type="checkbox" class="circle-chk t-chk" ${t.done ? "checked" : ""} aria-label="Tamamla">
    <div class="task-ic" style="background:${meta[0]};color:${meta[1]}"><svg width="20" height="20"><use href="#${meta[2]}"/></svg></div>
    <div class="task-body">
      <div class="nm ${t.done ? "done" : ""}">${esc(t.name)} <span class="cat-chip">${esc(t.cat)}</span></div>
      <div class="task-meta"><span><svg width="13" height="13"><use href="#i-cal"/></svg> ${t.group === "today" ? "Bugün" : "Yaklaşan"}</span><span><svg width="13" height="13"><use href="#i-clock"/></svg> ${t.dur} dk</span></div>
    </div>
    <span class="prio ${t.prio}">${t.prio === "yuksek" ? "Yüksek" : t.prio === "dusuk" ? "Düşük" : "Orta"}</span>
    <button class="dots-btn t-dots"><svg width="17" height="17"><use href="#i-dots"/></svg></button>
  </div>`;
}
function renderTasks(){
  const all = tasks();
  let list = all.filter(t => taskFilter === "today" ? t.group === "today" : taskFilter === "upcoming" ? t.group === "upcoming" : taskFilter === "done" ? t.done : true);
  const hideDone = !showDone && taskFilter !== "done";
  let html = "";
  if (taskFilter === "done"){
    html = `<div class="tgroup-h">Tamamlanan Görevler <span class="cnt">${list.length}</span></div>` + (list.length ? list.map(taskRowHTML).join("") : '<div style="padding:20px 24px;color:var(--muted)">Henüz tamamlanan görev yok.</div>');
  } else {
    const today = list.filter(t => t.group === "today" && (!hideDone || !t.done));
    const upc = list.filter(t => t.group === "upcoming" && (!hideDone || !t.done));
    if (taskFilter !== "upcoming") html += `<div class="tgroup-h">Bugünkü Görevler <span class="cnt">${all.filter(t => t.group === "today").length}</span></div>` + (today.length ? today.map(taskRowHTML).join("") : '<div style="padding:4px 24px 14px;color:var(--muted)">Bugün için görev yok — bir tane ekle!</div>');
    if (taskFilter !== "today" && upc.length) html += `<div class="tgroup-h">Yaklaşan Görevler <span class="cnt">${all.filter(t => t.group === "upcoming").length}</span></div>` + upc.map(taskRowHTML).join("");
  }
  $("#taskGroups").innerHTML = html;
  $$("#taskGroups .t-chk").forEach(c => c.onchange = e => {
    const id = +e.target.closest(".task-row").dataset.id;
    const a = tasks(); const t = a.find(x => x.id === id);
    t.done = e.target.checked;
    if (t.done){ t.doneAt = iso(); addXp(C.XP_GOREV); toast('"' + t.name + '" tamamlandı! +' + C.XP_GOREV + ' XP 🎉'); }
    saveTasks(a); renderTasks(); renderHome();
  });
  $$("#taskGroups .t-dots").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = +e.target.closest(".task-row").dataset.id;
    openCtx(b, [
      { html: '<svg width="15" height="15"><use href="#i-pencil"/></svg> Düzenle', fn: () => taskModal(tasks().find(x => x.id === id)) },
      { html: '<svg width="15" height="15"><use href="#i-trash"/></svg> Sil', danger: true, fn: () => { saveTasks(tasks().filter(x => x.id !== id)); renderTasks(); renderHome(); toast("Görev silindi"); } }
    ]);
  });
  renderTaskSummary();
}
function renderTaskSummary(){
  const today = tasks().filter(t => t.group === "today");
  const done = today.filter(t => t.done).length, total = today.length;
  $("#sumTotal").textContent = total; $("#sumDone").textContent = done; $("#sumLeft").textContent = total - done; $("#sumLate").textContent = 0;
  $("#sumRing").style.strokeDashoffset = String(370.7 * (1 - (total ? done/total : 0)));
  const cats = { Akademik: 0, Kişisel: 0, Sağlık: 0, Diğer: 0 };
  tasks().forEach(t => { if (!t.done) cats[t.cat] = (cats[t.cat] || 0) + 1; });
  $("#catRows").innerHTML = Object.entries(cats).map(([c, n]) => {
    const [bg, fg, ic] = CAT_META[c];
    return `<div class="cat-row"><div class="cat-ic" style="background:${bg};color:${fg}"><svg width="15" height="15"><use href="#${ic}"/></svg></div>${c}<span class="n">${n}</span></div>`;
  }).join("");
}
function taskModal(t){
  openModal(`<h3>${t ? "Görevi Düzenle" : "Yeni Görev Ekle"} <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <label class="f-label">Görev adı</label><input class="f-input" id="tName" value="${t ? esc(t.name) : ""}" placeholder="Ör: Rapor taslağını yaz">
  <label class="f-label">Kategori</label><div class="select" style="width:100%"><select class="f-input" id="tCat" style="appearance:none">${Object.keys(CAT_META).map(c => `<option ${t && t.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
  <label class="f-label">Öncelik</label><div class="select" style="width:100%"><select class="f-input" id="tPrio" style="appearance:none">
    <option value="dusuk" ${t && t.prio === "dusuk" ? "selected" : ""}>Düşük</option>
    <option value="orta" ${!t || t.prio === "orta" ? "selected" : ""}>Orta</option>
    <option value="yuksek" ${t && t.prio === "yuksek" ? "selected" : ""}>Yüksek</option></select></div>
  <label class="f-label">Süre (dk)</label><input class="f-input" id="tDur" type="number" min="5" max="240" value="${t ? t.dur : 25}">
  <label class="f-label">Zaman</label><div class="select" style="width:100%"><select class="f-input" id="tWhen" style="appearance:none">
    <option value="today" ${!t || t.group === "today" ? "selected" : ""}>Bugün</option>
    <option value="upcoming" ${t && t.group === "upcoming" ? "selected" : ""}>Yaklaşan</option></select></div>
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Vazgeç</button><button class="btn-navy" id="tSave">${t ? "Kaydet" : "Ekle"}</button></div>`);
  $("#tSave").onclick = () => {
    const name = $("#tName").value.trim();
    if (!name){ $("#tName").style.borderColor = "var(--red)"; $("#tName").focus(); return; }
    const data = { name, cat: $("#tCat").value, prio: $("#tPrio").value, dur: parseInt($("#tDur").value) || 25, group: $("#tWhen").value };
    const a = tasks();
    if (t){ Object.assign(a.find(x => x.id === t.id), data); }
    else { a.push(Object.assign({ id: Date.now(), done: false, createdAt: iso() }, data)); }
    saveTasks(a); closeModal(); renderTasks(); renderHome(); toast(t ? "Görev güncellendi" : "Görev eklendi ⚓");
  };
  setTimeout(() => $("#tName").focus(), 50);
}
$("#openAddTask").onclick = () => taskModal(null);
$("#homeAddTask").onclick = () => taskModal(null);
$$("[data-tfilter]").forEach(b => b.onclick = () => {
  $$("[data-tfilter]").forEach(x => x.classList.remove("active")); b.classList.add("active");
  taskFilter = b.dataset.tfilter; renderTasks();
});
$("#toggleDone").onclick = () => {
  showDone = !showDone;
  $("#toggleDone").innerHTML = (showDone ? "Tamamlananları Gizle" : "Tamamlananları Görüntüle") + ' <svg width="15" height="15" style="transform:rotate(' + (showDone ? 180 : 0) + 'deg)"><use href="#i-chev-d"/></svg>';
  renderTasks();
};
$$("[data-ttab]").forEach(b => b.onclick = () => {
  $$("[data-ttab]").forEach(x => x.classList.remove("active")); b.classList.add("active");
  const tab = b.dataset.ttab, alt = tab !== "list";
  $("#taskListCard").classList.toggle("hidden", alt);
  $("#taskAltCard").classList.toggle("hidden", !alt);
  const ses = S.get("sessions", []).filter(s => s.date === iso());
  if (tab === "sessions"){ $("#altTitle").textContent = "Odak Seansları"; $("#altDesc").textContent = "Bugün " + ses.length + " seans tamamladın (" + fmtMin(ses.reduce((a, s) => a + s.minutes, 0)) + "). Günlük hedefin 5 seans."; }
  if (tab === "habits"){ $("#altTitle").textContent = "Alışkanlıklar"; $("#altDesc").textContent = "En uzun odak serin " + streak() + " gün. Her gün en az 1 seans yaparak seriyi koru!"; }
});
$("#sumRange").onchange = e => toast("Görev özeti: " + e.target.value);

/* ---------- BALIKLAR ---------- */
let fishFilter = "all", fishRar = "all", fishSearch = "", fishSort = "date", fishTab = "all";
function fishes(){ return S.get("fish", []); }
function saveFish(a){ S.set("fish", a); }
const RAR_LBL = { nadir: "Nadir", yaygin: "Yaygın", orta: "Orta", efsanevi: "Efsanevi" };

// Pomodoro bittiğinde süreye göre katalogdan otomatik balık seç
function catchFish(minutes){
  if (!CATALOG.length){ toast("Balık kataloğu bulunamadı (assets/fish/manifest.js)"); return; }
  const tier = C.NADIRLIK_ESIKLERI.find(e => minutes >= e.min).tier;
  let pool = CATALOG.filter(f => f.tier === tier);
  if (!pool.length) pool = CATALOG;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const f = { id: Date.now(), name: "", file: pick.file, tier, minutes, date: iso(), isNew: true };
  const a = fishes(); a.unshift(f); saveFish(a);
  addNotif("fish", "Yeni balık yakaladın!", RAR_LBL[tier] + " tür · " + minutes + " dk seans");
  renderFish(); renderHome();
  nameFishModal(f.id, true);
}
function nameFishModal(id, isNewCatch){
  const f = fishes().find(x => x.id === id);
  if (!f) return;
  openModal(`<h3>${isNewCatch ? "Seans tamamlandı — yeni balık! 🎣" : "Balığa İsim Ver"} <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  ${isNewCatch ? '<p style="color:var(--muted);font-size:13.5px;margin-bottom:12px">' + f.minutes + ' dakikalık odak seansın denizden <b>' + RAR_LBL[f.tier] + '</b> bir balık getirdi. Ona bir isim ver:</p>' : ""}
  <div class="fish-name-preview"><img src="assets/fish/${f.file}" alt="Yeni balık"></div>
  <label class="f-label">Balık adı</label><input class="f-input" id="fName" value="${esc(f.name)}" placeholder="Ör: Gümüş Pul">
  <div class="actions"><button class="btn-outline" onclick="closeModal()">${isNewCatch ? "Sonra" : "Vazgeç"}</button><button class="btn-navy" id="fSave">Kaydet</button></div>`);
  $("#fSave").onclick = () => {
    const v = $("#fName").value.trim();
    const a = fishes(); a.find(x => x.id === id).name = v; saveFish(a);
    closeModal(); renderFish(); toast(v ? '"' + v + '" koleksiyona katıldı 🐟' : "Balık koleksiyona eklendi");
  };
  setTimeout(() => $("#fName").focus(), 60);
}
function renderFish(){
  const all = fishes();
  const wk = weekDays(0), month = iso().slice(0, 7);
  if (fishTab === "col"){ renderCollection(); }
  else {
    let list = [...all];
    if (fishTab === "rare") list = list.filter(f => f.tier === "nadir" || f.tier === "efsanevi");
    if (fishFilter === "today") list = list.filter(f => f.date === iso());
    if (fishFilter === "week") list = list.filter(f => wk.includes(f.date));
    if (fishFilter === "month") list = list.filter(f => f.date.slice(0, 7) === month);
    if (fishRar !== "all") list = list.filter(f => f.tier === fishRar);
    if (fishSearch) list = list.filter(f => (f.name || "isimsiz").toLowerCase().includes(fishSearch));
    if (fishSort === "name") list.sort((a, b) => (a.name || "zzz").localeCompare(b.name || "zzz", "tr"));
    else if (fishSort === "dur") list.sort((a, b) => b.minutes - a.minutes);
    else list.sort((a, b) => b.id - a.id);
    $("#fishGrid").innerHTML = list.length ? list.map(f => `<div class="card fish-card" data-id="${f.id}">
      ${f.isNew ? '<span class="new-badge">Yeni</span>' : ""}
      <button class="dots-btn f-dots"><svg width="17" height="17"><use href="#i-dots-v"/></svg></button>
      <div class="img"><img src="assets/fish/${f.file}" alt="${esc(f.name || "Balık")}" loading="lazy"></div>
      <div class="nm">${f.name ? esc(f.name) : '<span class="noname">İsimsiz</span>'} <button class="f-edit" aria-label="İsim ver"><svg width="14" height="14"><use href="#i-pencil"/></svg></button></div>
      <div class="rar ${f.tier}"><i></i> ${RAR_LBL[f.tier]}</div>
      <div class="meta"><span><svg width="13" height="13"><use href="#i-clock"/></svg> ${fmtMin(f.minutes)}</span><span><svg width="13" height="13"><use href="#i-cal"/></svg> ${trDate(f.date)}</span></div>
    </div>`).join("") : '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">Burada balık yok. Bir odak seansı tamamla, denizden ilk balığın gelsin! 🎣</div>';
    $$(".f-edit").forEach(b => b.onclick = e => { e.stopPropagation(); nameFishModal(+e.target.closest(".fish-card").dataset.id, false); });
    $$(".f-dots").forEach(b => b.onclick = e => {
      e.stopPropagation();
      const id = +e.target.closest(".fish-card").dataset.id;
      openCtx(b, [
        { html: '<svg width="15" height="15"><use href="#i-pencil"/></svg> İsim ver / değiştir', fn: () => nameFishModal(id, false) },
        { html: '<svg width="15" height="15"><use href="#i-trash"/></svg> Serbest bırak', danger: true, fn: () => { saveFish(fishes().filter(x => x.id !== id)); renderFish(); renderHome(); toast("Balık denize geri bırakıldı 🌊"); } }
      ]);
    });
  }
  // özet kartı
  const ses = S.get("sessions", []);
  const totMin = ses.reduce((a, s) => a + s.minutes, 0);
  $("#catchTotal").textContent = all.length;
  $("#catchTotalD").textContent = all.length ? "Harika!" : "";
  $("#cTotalTime").textContent = fmtMin(totMin);
  $("#cStreak").textContent = streak() + " gün";
  $("#cAvg").textContent = ses.length ? fmtMin(totMin / ses.length) : "0dk";
}
function renderCollection(){
  const caught = new Set(fishes().map(f => f.file));
  $("#fishGrid").innerHTML = CATALOG.map(cf => {
    const has = caught.has(cf.file);
    const mine = fishes().filter(f => f.file === cf.file);
    return `<div class="card fish-card" style="${has ? "" : "opacity:.45;filter:grayscale(1)"}">
      <div class="img"><img src="assets/fish/${cf.file}" alt="" loading="lazy"></div>
      <div class="nm">${has ? (esc(mine[0].name) || '<span class="noname">İsimsiz</span>') : "???"}</div>
      <div class="rar ${cf.tier}"><i></i> ${RAR_LBL[cf.tier]}${has && mine.length > 1 ? " · ×" + mine.length : ""}</div>
      <div class="meta"><span>${has ? "Yakalandı" : "Henüz yakalanmadı"}</span></div>
    </div>`;
  }).join("");
}
$$("[data-cfilter]").forEach(b => b.onclick = () => { $$("[data-cfilter]").forEach(x => x.classList.remove("active")); b.classList.add("active"); fishFilter = b.dataset.cfilter; renderFish(); });
$$("[data-ctab]").forEach(b => b.onclick = () => { $$("[data-ctab]").forEach(x => x.classList.remove("active")); b.classList.add("active"); fishTab = b.dataset.ctab; renderFish(); });
$("#rarFilter").onchange = e => { fishRar = e.target.value; renderFish(); };
$("#fishSearch").oninput = e => { fishSearch = e.target.value.trim().toLowerCase(); renderFish(); };
$("#fishSort").onchange = e => { fishSort = e.target.value; renderFish(); };

/* ---------- İSTATİSTİK HESAPLARI ---------- */
function sessions(){ return S.get("sessions", []); }
function totalMinutes(){ return sessions().reduce((a, s) => a + s.minutes, 0); }
function streak(){
  const days = new Set(sessions().map(s => s.date));
  let best = 0, cur = 0; const d = new Date(); d.setDate(d.getDate() - 365);
  for (let i = 0; i <= 366; i++){ const k = iso(d); cur = days.has(k) ? cur + 1 : 0; best = Math.max(best, cur); d.setDate(d.getDate() + 1); }
  return best;
}
function delta(cur, prev){
  if (!prev) return cur ? "↗ Yeni!" : "";
  const p = Math.round((cur - prev) / prev * 100);
  return (p >= 0 ? "↗ %" + p : "↘ %" + Math.abs(p)) + " geçen haftaya göre";
}
const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MODE_META = { derin: ["Derin Odak", "var(--navy-deep)", "#0d2f40"], orta: ["Orta Odak", "#6fb1b9", "#6fb1b9"], hafif: ["Hafif Odak", "var(--purple)", "#8b7fd1"] };

function renderStats(){
  const off = $("#statRange").value === "Geçen Hafta" ? -1 : 0;
  const wk = weekDays(off), prevWk = weekDays(off - 1);
  const ses = sessions();
  const inWk = ses.filter(s => wk.includes(s.date)), inPrev = ses.filter(s => prevWk.includes(s.date));
  const min = inWk.reduce((a, s) => a + s.minutes, 0), pmin = inPrev.reduce((a, s) => a + s.minutes, 0);
  const doneT = tasks().filter(t => t.done && t.doneAt && wk.includes(t.doneAt)).length;
  const pDoneT = tasks().filter(t => t.done && t.doneAt && prevWk.includes(t.doneAt)).length;
  $("#sTotal").textContent = fmtMin(min); $("#sTotalD").textContent = delta(min, pmin);
  $("#sSessions").textContent = inWk.length; $("#sSessionsD").textContent = delta(inWk.length, inPrev.length);
  $("#sTasks").textContent = doneT; $("#sTasksD").textContent = delta(doneT, pDoneT);
  $("#sStreak").textContent = streak() + " gün"; $("#sStreakD").textContent = streak() > 0 ? "↗ Devam et!" : "";

  // çubuk grafik
  const unit = $("#barUnit").value.includes("Seans") ? "seans" : "saat";
  const data = wk.map((d, i) => {
    const list = ses.filter(s => s.date === d);
    return [GUNLER[i], unit === "saat" ? list.reduce((a, s) => a + s.minutes, 0) / 60 : list.length];
  });
  renderBars(data, unit);

  // tür dağılımı
  const byMode = { derin: 0, orta: 0, hafif: 0 };
  inWk.forEach(s => byMode[s.mode] = (byMode[s.mode] || 0) + s.minutes);
  const tot = byMode.derin + byMode.orta + byMode.hafif;
  $("#modeBars").innerHTML = Object.entries(MODE_META).map(([k, [lbl, col]]) => {
    const pct = tot ? Math.round(byMode[k] / tot * 100) : 0;
    return `<div class="hbar"><div class="t"><span>${lbl}</span><b>${pct}%</b></div><div class="track"><i style="width:${pct}%;background:${col}"></i></div></div>`;
  }).join("");

  // dağılım donut
  $("#distTotal").innerHTML = fmtMin(tot).replace(" ", "<br>");
  const R = 58, CIR = 2 * Math.PI * R;
  let acc = -90, segs = "";
  Object.entries(MODE_META).forEach(([k, [, , col]]) => {
    const frac = tot ? byMode[k] / tot : 0;
    if (frac > 0){
      segs += `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${col}" stroke-width="12" stroke-dasharray="${(frac * CIR).toFixed(1)} ${CIR.toFixed(1)}" transform="rotate(${acc} 70 70)"/>`;
      acc += frac * 360;
    }
  });
  $("#distDonut").innerHTML = segs || `<circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>`;
  $("#distLegend").innerHTML = Object.entries(MODE_META).map(([k, [lbl, , col]]) => {
    const pct = tot ? Math.round(byMode[k] / tot * 100) : 0;
    return `<div class="legend-r"><span class="sq" style="background:${col}"></span> ${lbl} <span class="pc">${pct}%</span><span class="tm">${fmtMin(byMode[k])}</span></div>`;
  }).join("");

  // başarı oranı çizgisi (tamamlanan / başlatılan)
  const starts = S.get("starts", {});
  const pts = wk.map((d, i) => {
    const done = ses.filter(s => s.date === d).length, st = starts[d] || 0;
    const rate = st ? Math.min(1, done / st) : (done ? 1 : 0);
    return [40 + i * 62, 180 - rate * 168];
  });
  $("#linePath").setAttribute("points", pts.map(p => p.join(",")).join(" "));
  $("#lineDots").innerHTML = pts.map(p => `<circle cx="${p[0]}" cy="${p[1].toFixed(0)}" r="3.5" fill="#1d5068"/>`).join("");
  $("#lineLabels").innerHTML = pts.map((p, i) => `<text x="${p[0]}" y="188">${GUNLER[i]}</text>`).join("");

  // ısı haritası (saat dilimlerine göre dakika)
  const buckets = [[0, 6], [6, 12], [12, 18], [18, 24]];
  const lvls = buckets.map(([a, b]) => wk.map(d => ses.filter(s => s.date === d && s.hour >= a && s.hour < b).reduce((x, s) => x + s.minutes, 0)));
  const maxCell = Math.max(1, ...lvls.flat());
  let heat = "<div></div>" + GUNLER.map(g => `<div class="cl">${g}</div>`).join("");
  buckets.forEach(([a, b], ri) => {
    heat += `<div class="rl">${String(a).padStart(2, "0")}:00</div>` + lvls[ri].map(v => `<div class="cell ${v ? "l" + Math.min(4, Math.ceil(v / maxCell * 4)) : ""}" title="${fmtMin(v)}"></div>`).join("");
  });
  $("#heatmap").innerHTML = heat;

  // övgü kartı
  if (min > 0){
    $("#praiseTitle").innerHTML = 'Harika gidiyorsun, ' + esc(profile().name) + '! <svg width="17" height="17" style="color:var(--red)"><use href="#i-anchor"/></svg>';
    $("#praiseDesc").textContent = pmin ? "Bu hafta " + delta(min, pmin).replace("↗ ", "%").replace(" geçen haftaya göre", "").replace("↘ ", "-%") + " değişimle " + fmtMin(min) + " odaklandın." : "Bu hafta " + fmtMin(min) + " odaklandın. Rüzgar arkanda!";
  } else {
    $("#praiseTitle").innerHTML = 'Rotan açık, Kaptan! <svg width="17" height="17" style="color:var(--red)"><use href="#i-anchor"/></svg>';
    $("#praiseDesc").textContent = "Odak seanslarını tamamladıkça istatistiklerin burada birikecek.";
  }
  renderProfileStats();
}
function renderBars(data, unit){
  const rawMax = Math.max(...data.map(d => d[1]), unit === "saat" ? 1 : 4);
  const max = unit === "saat" ? Math.max(1, Math.ceil(rawMax)) : Math.ceil(rawMax);
  let g = '<div class="gridlines">';
  for (let i = 0; i < 5; i++){
    const val = max - max / 4 * i;
    g += `<div class="gl" style="top:${i * 25}%"><span>${unit === "saat" ? (val % 1 ? val.toFixed(1) : val) + " sa" : Math.round(val)}</span></div>`;
  }
  g += "</div>";
  const avg = data.reduce((a, d) => a + d[1], 0) / data.length;
  if (avg > 0){
    const avgTxt = unit === "saat" ? "Ortalama " + fmtMin(avg * 60) : "Ortalama " + avg.toFixed(1);
    g += `<div class="avg-line" style="bottom:${22 + (avg / max) * (230 - 22 - 8)}px"><span>${avgTxt}</span></div>`;
  }
  g += data.map(([l, v]) => `<div class="bar-col"><div class="b" style="height:${Math.max(3, Math.round(v / max * 200))}px"><span class="tip">${unit === "saat" ? fmtMin(v * 60) : v + " seans"}</span></div><div class="lbl">${l}</div></div>`).join("");
  $("#barChart").innerHTML = g;
}
$("#barUnit").onchange = renderStats;
$("#statRange").onchange = renderStats;
$$("[data-stab]").forEach(b => b.onclick = () => {
  $$("[data-stab]").forEach(x => x.classList.remove("active")); b.classList.add("active");
  const map = { genel: null, sure: "Günlük Odak Süresi", seans: "Tamamlanan Seans", aliskanlik: "Saatlere Göre Odaklanma", basari: "Raporu İndir" };
  const key = map[b.dataset.stab];
  if (!key){ window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const el = $$("#page-stats .card, #page-stats .praise").find(c => c.textContent.includes(key));
  if (el){ el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.boxShadow = "0 0 0 2.5px var(--teal)"; setTimeout(() => el.style.boxShadow = "", 1600); }
});
$("#dlReport").onclick = () => {
  const wk = weekDays(0), ses = sessions().filter(s => wk.includes(s.date));
  const r = ["KÖPRÜ — Haftalık Odak Raporu", "Kaptan: " + profile().name, "Tarih: " + trDate(iso()), "",
    "Toplam Odak Süresi: " + fmtMin(ses.reduce((a, s) => a + s.minutes, 0)),
    "Tamamlanan Seans: " + ses.length,
    "Tamamlanan Görev: " + tasks().filter(t => t.done && t.doneAt && wk.includes(t.doneAt)).length,
    "En Uzun Seri: " + streak() + " gün",
    "Yakalanan Balık: " + fishes().length, "",
    "Günlük Dağılım:",
    ...wk.map((d, i) => "  " + GUNLER[i] + " (" + d + "): " + fmtMin(sessions().filter(s => s.date === d).reduce((a, s) => a + s.minutes, 0)))
  ].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([r], { type: "text/plain;charset=utf-8" }));
  a.download = "kopru-haftalik-rapor.txt"; a.click(); URL.revokeObjectURL(a.href);
  toast("Rapor indirildi 📄");
};

/* ---------- ANA SAYFA & ODAK PANELİ ---------- */
function renderHome(){
  const ses = sessions(), today = ses.filter(s => s.date === iso());
  const fishAll = fishes(), fishToday = fishAll.filter(f => f.date === iso());
  $("#homeCatchToday").textContent = fishToday.length;
  $("#homeTotalFish").textContent = fishAll.length;
  $("#homeStreak").textContent = streak() + " gün";
  $("#homeTotalFocus").textContent = fmtMin(totalMinutes());
  $("#homeDoneTasks").textContent = tasks().filter(t => t.done).length;
  const last = fishAll[0];
  $("#homeFishThumb").innerHTML = last ? `<img src="assets/fish/${last.file}" alt="">` : '<svg width="34" height="34" style="color:var(--teal)"><use href="#i-fish"/></svg>';
  // odaklanma oranı: bugün tamamlanan / başlatılan
  const st = S.get("starts", {})[iso()] || 0;
  const rate = st ? Math.min(100, Math.round(today.length / st * 100)) : (today.length ? 100 : 0);
  $("#homePct").textContent = "%" + rate;
  $("#homeRing").style.strokeDashoffset = String(314.16 * (1 - rate / 100));
  // mini görevler
  const three = tasks().filter(t => t.group === "today").slice(0, 3);
  $("#homeTasks").innerHTML = three.length ? three.map(t => `<div class="mini-task">
    <input type="checkbox" class="circle-chk h-chk" data-id="${t.id}" ${t.done ? "checked" : ""}>
    <div><div class="nm ${t.done ? "done" : ""}">${esc(t.name)}</div><div class="mt">Odak ${t.dur} dk</div></div>
  </div>`).join("") : '<div style="padding:14px 20px;color:var(--muted);font-size:13px">Bugün için görev yok.</div>';
  $$("#homeTasks .h-chk").forEach(c => c.onchange = e => {
    const a = tasks(); const t = a.find(x => x.id === +e.target.dataset.id);
    t.done = e.target.checked;
    if (t.done){ t.doneAt = iso(); addXp(C.XP_GOREV); toast('"' + t.name + '" tamamlandı! +' + C.XP_GOREV + ' XP 🎉'); }
    S.set("tasks", a); renderTasks(); renderHome();
  });
  // odak paneli günlük kart
  const dMin = today.reduce((a, s) => a + s.minutes, 0);
  $("#dOdak").textContent = fmtMin(dMin);
  $("#dSeans").textContent = today.length + " / 5";
  $("#dSeri").textContent = streak() + " gün";
  const goal = Math.min(100, Math.round(today.length / 5 * 100));
  $("#dGoalPct").textContent = "%" + goal;
  $("#dGoalRing").style.strokeDashoffset = String(345.6 * (1 - goal / 100));
}
function renderProfileStats(){
  const p = profile(), ses = sessions();
  const totMin = totalMinutes();
  $("#pfTotal").textContent = fmtMin(totMin);
  $("#pfSessions").textContent = ses.length;
  $("#pfFish").textContent = fishes().length;
  $("#jTotal").textContent = fmtMin(totMin);
  $("#jSessions").textContent = ses.length;
  $("#jStreak").textContent = streak() + " gün";
  $("#jAvg").textContent = ses.length ? fmtMin(totMin / ses.length) : "0dk";
  // tür dağılımı
  const all = $("#profRange").value === "Tüm Zamanlar" ? ses : ses.filter(s => weekDays(0).includes(s.date));
  const byMode = { derin: 0, orta: 0, hafif: 0 };
  all.forEach(s => byMode[s.mode] = (byMode[s.mode] || 0) + s.minutes);
  const tot = byMode.derin + byMode.orta + byMode.hafif;
  const icons = { derin: "i-moon", orta: "i-target", hafif: "i-waves" };
  $("#profDist").innerHTML = Object.entries(MODE_META).map(([k, [lbl, , col]]) => {
    const pct = tot ? Math.round(byMode[k] / tot * 100) : 0;
    return `<div class="stat-mini"><div class="ic" style="background:var(--blue-soft);color:${col}"><svg width="16" height="16"><use href="#${icons[k]}"/></svg></div>${lbl}<div class="bar"><i style="width:${pct}%;background:${col}"></i></div><span class="pc">${pct}% (${fmtMin(byMode[k])})</span></div>`;
  }).join("");
  // rozetler
  const badges = [
    { t: "İlk Seans", d: "İlk odak seansını tamamla.", ic: "i-anchor", col: "#1d5068", ok: ses.length >= 1 },
    { t: "5 Balıkçı", d: "5 balık yakala.", ic: "i-fish", col: "#5f97ac", ok: fishes().length >= 5 },
    { t: "Derin Odakçı", d: "10 saatten fazla odaklan.", ic: "i-coral", col: "#3f8f6f", ok: totMin >= 600 },
    { t: "Yolcu Değil Kaptansın", d: "7 gün üst üste odaklan.", ic: "i-lighthouse", col: "#e8912d", ok: streak() >= 7 },
    { t: "Usta Kaptan", d: "20 seans tamamla.", ic: "i-crown", col: "#8b7fd1", ok: ses.length >= 20 }
  ];
  $("#badgeGrid").innerHTML = badges.map(b => `<div class="badge ${b.ok ? "" : "locked"}" title="${b.ok ? "Kazanıldı!" : "Henüz kilitli"}"><div class="hexa" style="background:${b.col}"><svg width="22" height="22"><use href="#${b.ic}"/></svg></div><div class="t">${b.t}</div><div class="d">${b.d}</div></div>`).join("");
  $("#allBadges").onclick = () => toast(badges.filter(b => b.ok).length + " / " + badges.length + " rozet kazandın. Yenileri seni bekliyor!");
}
$("#profRange").onchange = renderProfileStats;

/* ---------- AYARLAR ---------- */
function applySettingsToUI(){
  const s = S.get("settings", {});
  applyTheme(s.theme || "light");
  $("#setSens").value = s.sens !== undefined ? s.sens : 50;
  updateSens(false);
  if (s.thresh) $("#setThresh").value = s.thresh;
  if (s.faceThresh) $("#setFaceThresh").value = s.faceThresh;
  C.KAPALI_SURE_ESIGI = parseFloat($("#setThresh").value);
  C.YUZ_YOK_ESIGI = parseFloat($("#setFaceThresh").value);
  $("#setSfx").checked = s.sfx !== false;
  $("#setAmbient").checked = s.ambient !== false;
  $("#setPreview").checked = s.preview !== false;
  $("#setSync").checked = !!s.sync;
  $("#setReminders").checked = s.reminders !== false;
  $("#setMotiv").checked = s.motiv !== false;
  $("#soundIcon").innerHTML = '<use href="#i-volume' + (s.ambient === false ? "-x" : "") + '"/>';
  if (s.camId) Cam.deviceId = s.camId;
}
function updateSens(save){
  const v = +$("#setSens").value;
  $("#sensLabel").textContent = v < 34 ? "Düşük" : v < 67 ? "Orta" : "Yüksek";
  C.EAR_ESIK = 0.14 + v / 100 * 0.12; // 0.14–0.26 (50 → 0.20, py varsayılanı)
  if (save) S.update("settings", s => { s.sens = v; return s; }, {});
}
$("#setSens").oninput = () => updateSens(true);
$("#setSens").onchange = () => toast("Göz kapanma hassasiyeti: " + $("#sensLabel").textContent + " (EAR eşiği " + C.EAR_ESIK.toFixed(2) + ")");
$("#setThresh").onchange = e => { C.KAPALI_SURE_ESIGI = parseFloat(e.target.value); S.update("settings", s => { s.thresh = e.target.value; return s; }, {}); toast("Uyarı eşiği: " + e.target.value + " saniye"); };
$("#setFaceThresh").onchange = e => { C.YUZ_YOK_ESIGI = parseFloat(e.target.value); S.update("settings", s => { s.faceThresh = e.target.value; return s; }, {}); toast("Yüz kaybı eşiği: " + e.target.value + " saniye"); };
$("#setCam").onchange = async e => { S.update("settings", s => { s.camId = e.target.value; return s; }, {}); await Cam.setDevice(e.target.value); toast("Kamera değiştirildi"); };
$("#setPreview").onchange = e => { S.update("settings", s => { s.preview = e.target.checked; return s; }, {}); applyPreview(); toast("Kamera önizlemesi " + (e.target.checked ? "açıldı" : "kapatıldı — takip sürüyor")); };
const SET_TOGGLES = { setSfx: ["sfx", "Ses efektleri"], setAmbient: ["ambient", "Arka plan ambiyansı"], setSync: ["sync", "Bulut senkronizasyonu"], setReminders: ["reminders", "Odak hatırlatıcıları"], setMotiv: ["motiv", "Motivasyon mesajları"] };
Object.entries(SET_TOGGLES).forEach(([id, [key, lbl]]) => {
  $("#" + id).onchange = e => {
    S.update("settings", s => { s[key] = e.target.checked; return s; }, {});
    toast(lbl + (e.target.checked ? " açıldı" : " kapatıldı"));
    if (id === "setAmbient") $("#soundIcon").innerHTML = '<use href="#i-volume' + (e.target.checked ? "" : "-x") + '"/>';
  };
});
["setLang", "setTime", "setWeek", "setRemInt", "setShortBreak", "setLongBreak"].forEach(id => {
  $("#" + id).onchange = e => { S.update("settings", s => { s[id] = e.target.value; return s; }, {}); toast(e.target.value + " seçildi"); };
});
$$("[data-setab]").forEach(b => b.onclick = () => {
  $$("[data-setab]").forEach(x => x.classList.remove("active")); b.classList.add("active");
  const map = { genel: "Genel Tercihler", odak: "Kamera ve Odak Takibi", bildirim: "Odak Hatırlatıcıları", gorunum: "Tema", hesap: "Premium Özellikler", veri: "Veri ve Senkronizasyon" };
  const el = $$("#page-settings .card, #page-settings .prem").find(c => c.textContent.includes(map[b.dataset.setab]));
  if (el){ el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.boxShadow = "0 0 0 2.5px var(--teal)"; setTimeout(() => el.style.boxShadow = "", 1600); }
});
function exportData(){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S.exportAll(), null, 2)], { type: "application/json" }));
  a.download = "kopru-" + S.user.replace(/[^a-z0-9]/g, "_") + ".json"; a.click(); URL.revokeObjectURL(a.href);
  toast("Verilerin dışa aktarıldı 📦");
}
$("#exportBtn").onclick = exportData;
$("#qaExport").onclick = exportData;
$("#clearBtn").onclick = () => {
  openModal(`<h3>Verileri Temizle <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <p style="color:var(--muted);font-size:14px;line-height:1.6">Emin misin, Kaptan? <b>${esc(S.user)}</b> hesabındaki odak süreleri, geçmiş görevler, balık koleksiyonu, grafikler ve tüm istatistikler <b>kalıcı olarak</b> silinecek. Bu işlem geri alınamaz.</p>
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Vazgeç</button><button class="btn-danger-o" id="clearOk"><svg width="15" height="15"><use href="#i-trash"/></svg> Evet, Hepsini Sil</button></div>`);
  $("#clearOk").onclick = () => {
    S.clearAll();
    closeModal();
    applySettingsToUI();
    renderAll();
    toast("Tüm verilerin temizlendi. Temiz bir sayfa, yeni bir rota ⚓");
  };
};
$("#premBtn").onclick = () => {
  openModal(`<h3>Premium'a Geç <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <p style="color:var(--muted);font-size:14px;margin-bottom:14px">Sınırsız seans, detaylı raporlar, özel ambiyans sesleri ve yedekleme — hepsi tek pakette.</p>
  <div style="font-family:'Quicksand';font-weight:700;font-size:26px;margin-bottom:18px">₺49,99<span style="font-size:14px;color:var(--muted)"> / ay</span></div>
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Belki sonra</button><button class="btn-red" id="premOk" style="padding:11px 22px;font-size:14px">Hemen Yükselt</button></div>`);
  $("#premOk").onclick = () => { closeModal(); toast("Bu bir demo — ödeme alınmadı, ama ruhun premium Kaptan! 👑"); };
};

/* ---------- motivasyon mesajları (otomatik döner) ---------- */
let quoteIdx = 0, quoteInt = null;
function startQuoteRotation(){
  if (quoteInt) return;
  const rotate = () => {
    if (S.get("settings", {}).motiv === false) return;
    quoteIdx = (quoteIdx + 1) % C.MOTIVASYON.length;
    [["#quoteText", quoteIdx], ["#rememberQuote", (quoteIdx + 3) % C.MOTIVASYON.length]].forEach(([sel, i]) => {
      const el = $(sel); if (!el) return;
      el.classList.add("fade");
      setTimeout(() => { el.textContent = C.MOTIVASYON[i]; el.classList.remove("fade"); }, 500);
    });
  };
  quoteInt = setInterval(rotate, C.MOTIVASYON_ARALIGI_SN * 1000);
}

/* ---------- PROFİL ---------- */
function editNameModal(){
  const p = profile();
  openModal(`<h3>Profil Bilgilerini Düzenle <button class="x" onclick="closeModal()"><svg width='18' height='18'><use href='#i-x'/></svg></button></h3>
  <label class="f-label">Görünen ad</label><input class="f-input" id="pName" value="${esc(p.name)}">
  <label class="f-label">E-posta (hesap anahtarı)</label><input class="f-input" id="pMail" type="email" value="${esc(S.user)}" disabled>
  <label class="f-label">Yeni şifre (opsiyonel)</label><input class="f-input" id="pPass" type="password" placeholder="••••••••">
  <div class="actions"><button class="btn-outline" onclick="closeModal()">Vazgeç</button><button class="btn-navy" id="pSave">Kaydet</button></div>`);
  $("#pSave").onclick = () => {
    const v = $("#pName").value.trim();
    if (!v){ $("#pName").style.borderColor = "var(--red)"; return; }
    const pp = profile(); pp.name = v; saveProfile(pp);
    closeModal(); toast("Profil güncellendi");
  };
}
$("#editNameBtn").onclick = editNameModal;
$("#qaProfile").onclick = editNameModal;
$("#avatarBtn").onclick = () => {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = () => { const f = inp.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    $("#profAvatar").src = url; $$(".side-profile img.av").forEach(i => i.src = url);
    toast("Profil fotoğrafı güncellendi 📷"); };
  inp.click();
};

/* ---------- toplu render + başlangıç ---------- */
function renderAll(){
  renderProfileEverywhere();
  renderTasks();
  renderFish();
  renderHome();
  renderWarnings();
  renderNotifs();
  renderStats();
  renderTimers();
  setFocusButtons();
}
(function init(){
  const remembered = S.rememberedUser();
  if (remembered){
    S.login(remembered, true);
    $("#loginScreen").classList.add("hidden"); $("#app").classList.remove("hidden");
    applySettingsToUI(); renderAll(); startSession(); startQuoteRotation(); populateCameras();
  }
})();
