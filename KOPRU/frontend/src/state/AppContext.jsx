/* ============================================================
   KÖPRÜ — Uygulama Durumu (React Context)
   Zamanlayıcı, kullanıcı verileri, XP, balık yakalama, bildirim,
   dil (TR/EN), ipucu-motivasyon rotasyonu ve toast tek yerden.
   ============================================================ */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Storage } from "../utils/storage.js";
import { KOPRU_CONFIG as C, RAR_LBL } from "../utils/config.js";
import { Cam } from "../utils/camera.js";
import { iso } from "../utils/helpers.js";
import { EN, EN_MOTIVATION, EN_TIPS } from "../utils/i18n.js";

const Ctx = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((r) => r + 1), []);
  const [lang, setLangState] = useState("tr");

  /* ---------- dil ---------- */
  const t = useCallback((s) => (lang === "en" ? (EN[s] ?? s) : s), [lang]);
  const setLang = useCallback((l) => {
    setLangState(l);
    if (Storage.user) Storage.update("settings", (x) => { x.lang = l; return x; }, {});
  }, []);
  const motivasyon = useCallback(
    (i) => (lang === "en" ? EN_MOTIVATION[i] ?? C.MOTIVASYON[i] : C.MOTIVASYON[i]),
    [lang]
  );
  const ipucu = useCallback(
    (i) => (lang === "en" ? EN_TIPS[i] ?? C.IPUCLARI[i] : C.IPUCLARI[i]),
    [lang]
  );

  /* ---------- toast ---------- */
  const [toastMsg, setToastMsg] = useState(null);
  const toastT = useRef(null);
  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  /* ---------- veri erişimi ---------- */
  const get = useCallback((col, fb) => (Storage.user ? Storage.get(col, fb) : fb), []);
  const set = useCallback((col, val) => { Storage.set(col, val); bump(); }, [bump]);

  /* ---------- profil / XP / avatar ---------- */
  const profile = useCallback(
    () => get("profile", { name: "Kaptan", level: 1, xp: 0, xpMax: 1000, joined: iso(), avatar: null }),
    [get]
  );
  const setAvatar = useCallback((dataUrl) => {
    const p = profile();
    p.avatar = dataUrl;
    Storage.set("profile", p);
    bump();
  }, [profile, bump]);
  const addNotif = useCallback((icon, tt, d) => {
    Storage.update("notifs", (a) => { a.unshift({ icon, t: tt, d, ts: Date.now() }); return a.slice(0, 12); }, []);
    bump();
  }, [bump]);
  const addXp = useCallback((n) => {
    const p = profile();
    p.xp += n;
    while (p.xp >= p.xpMax) {
      p.xp -= p.xpMax;
      p.level++;
      p.xpMax += 200;
      toast(t("Tebrikler Kaptan! Seviye") + " " + p.level + " ⚓");
      addNotif("flame", "Seviye atladın!", "Seviye " + p.level);
    }
    Storage.set("profile", p);
    bump();
  }, [profile, toast, addNotif, bump, t]);

  /* ---------- tema ---------- */
  const applyTheme = useCallback((th) => {
    if (Storage.user) Storage.update("settings", (s) => { s.theme = th; return s; }, {});
    const dark = th === "dark" || (th === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("dark", dark);
    bump();
  }, [bump]);

  /* ---------- oturum sayacı ---------- */
  const [sessionSec, setSessionSec] = useState(0);
  const [sessionPaused, setSessionPaused] = useState(false);
  useEffect(() => {
    if (!user || sessionPaused) return;
    const id = setInterval(() => setSessionSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [user, sessionPaused]);

  /* ---------- odak zamanlayıcısı (tüm sayfalarda ortak) ---------- */
  const [timer, setTimer] = useState({ sec: 25 * 60, total: 25 * 60, running: false, isBreak: false, mode: "derin" });
  const [pendingFish, setPendingFish] = useState(null);

  const catchFish = useCallback(async (minutes) => {
    const catalog = window.FISH_CATALOG || [];
    if (!catalog.length) { toast("Balık kataloğu bulunamadı (assets/fish/manifest.js)"); return; }
    const tier = C.NADIRLIK_ESIKLERI.find((e) => minutes >= e.min).tier;
    let pool = catalog.filter((f) => f.tier === tier);
    if (!pool.length) pool = catalog;
    /* Çeşitlilik: önce hiç yakalanmamış türlerden seç, hepsi toplandıysa
       en az sahip olunanlar arasından rastgele — aynı balık üst üste gelmesin */
    const sahip = Storage.get("fish", []).map((x) => x.file);
    const yeni = pool.filter((p) => !sahip.includes(p.file));
    if (yeni.length) pool = yeni;
    else {
      const sayac = pool.map((p) => sahip.filter((s) => s === p.file).length);
      const enAz = Math.min(...sayac);
      pool = pool.filter((_, i) => sayac[i] === enAz);
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const payload = { name: "", file: pick.file, tier, minutes, date: iso(), isNew: true, movement: "swim" };
    try {
      /* Sunucudan gerçek id dönene kadar bekliyoruz; aksi halde isimlendirme
         penceresi geçici bir yerel id tutar ve arka planda id değişince
         balık bulunamayıp isim kaydedilemezdi. */
      const created = await Storage.createItem("fish", payload);
      addNotif("fish", "Yeni balık yakaladın!", RAR_LBL[tier] + " · " + minutes + " dk");
      setPendingFish(created);
      bump();
    } catch {
      toast("Balık kaydedilemedi — sunucuya bağlanılamadı 🐟");
    }
  }, [toast, addNotif, bump]);

  const finishingRef = useRef(false);
  const finishFocus = useCallback((tm) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setTimeout(() => { finishingRef.current = false; }, 800);

    if (tm.isBreak) { toast(t("Ara bitti. Rotaya dönme zamanı! 🧭")); return; }
    const minutes = Math.round(tm.total / 60);
    Storage.push("sessions", { date: iso(), minutes, mode: tm.mode, hour: new Date().getHours(), completed: true, ts: Date.now() });
    addXp(C.XP_SEANS);
    catchFish(minutes);
  }, [toast, addXp, catchFish, t]);

  const finishFocusRef = useRef(finishFocus);
  useEffect(() => { finishFocusRef.current = finishFocus; }, [finishFocus]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setTimer((tm) => {
        if (tm.sec <= 1) {
          setTimeout(() => finishFocusRef.current(tm), 0);
          return { ...tm, sec: tm.total, running: false };
        }
        return { ...tm, sec: tm.sec - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const startingRef = useRef(false);
  const toggleTimer = useCallback(() => {
    setTimer((tm) => {
      const running = !tm.running;
      if (running && tm.sec === tm.total && !tm.isBreak && !startingRef.current) {
        startingRef.current = true;
        setTimeout(() => { startingRef.current = false; }, 800);
        Storage.update("starts", (m) => { m[iso()] = (m[iso()] || 0) + 1; return m; }, {});
      }
      return { ...tm, running };
    });
  }, []);

  const endingRef = useRef(false);
  const finishEarly = useCallback(() => {
    setTimer((tm) => {
      if (tm.sec >= tm.total) return tm; // hiç başlamamış
      if (endingRef.current) return { ...tm, sec: tm.total, running: false };
      endingRef.current = true;
      setTimeout(() => { endingRef.current = false; }, 800);

      const elapsedMin = Math.round((tm.total - tm.sec) / 60);
      if (!tm.isBreak && elapsedMin >= 1) {
        Storage.push("sessions", { date: iso(), minutes: elapsedMin, mode: tm.mode, hour: new Date().getHours(), completed: false, ts: Date.now() });
        toast(t("Seans erken bitirildi") + " — " + elapsedMin + " dk " + t("istatistiklere eklendi") + " 📊");
      } else {
        toast(t("Seans erken bitirildi"));
      }
      setTimeout(bump, 0);
      return { ...tm, sec: tm.total, running: false };
    });
  }, [toast, t, bump]);

  const setDuration = useCallback((min, isBreak = false) => {
    setTimer((tm) => ({ ...tm, sec: min * 60, total: min * 60, running: false, isBreak }));
  }, []);
  const setMode = useCallback((mode) => setTimer((tm) => ({ ...tm, mode })), []);

  /* ---------- kamera uyarıları → kayıt + bildirim ---------- */
  useEffect(() => {
    Cam.onAlarm = (reason) => {
      if (!Storage.user) return;
      Storage.push("warnings", { time: Date.now(), reason });
      addNotif("alert", reason, "Odak takip sistemi uyarı verdi");
      bump();
    };
  }, [addNotif, bump]);

  /* ---------- motivasyon + ipucu rotasyonu ---------- */
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    if (!user) return;
    const q = setInterval(() => {
      if (Storage.get("settings", {}).motiv === false) return;
      setQuoteIdx((i) => (i + 1) % C.MOTIVASYON.length);
    }, C.MOTIVASYON_ARALIGI_SN * 1000);
    const p = setInterval(() => setTipIdx((i) => (i + 1) % C.IPUCLARI.length), C.IPUCU_ARALIGI_SN * 1000);
    return () => { clearInterval(q); clearInterval(p); };
  }, [user]);

  /* ---------- giriş / çıkış ---------- */
  const applySettings = useCallback(() => {
    const s = Storage.get("settings", {});
    C.KAPALI_SURE_ESIGI = parseFloat(s.thresh || 2);
    C.YUZ_YOK_ESIGI = parseFloat(s.faceThresh || 4);
    const v = s.sens !== undefined ? s.sens : 50;
    C.EAR_ESIK = 0.14 + (v / 100) * 0.12;
    if (s.camId) Cam.deviceId = s.camId;
    setLangState(s.lang === "en" ? "en" : "tr");
    applyTheme(s.theme || "light");
  }, [applyTheme]);

  const login = useCallback(async (email, password, remember, registerName) => {
    await Storage.login(email, password, remember, registerName);
    applySettings();
    setUser(Storage.user);
    bump();
    const p = Storage.get("profile", { name: "Kaptan" });
    toast("Hoş geldin, " + p.name + "! ⚓");
  }, [applySettings, toast, bump]);

  const logout = useCallback(() => { Cam.stop(); Storage.logout(); setUser(null); }, []);

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    (async () => {
      const restored = await Storage.restoreSession();
      if (restored) { applySettings(); setUser(Storage.user); }
      setAuthChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onSyncError = (e) => {
      toast(`⚠️ ${e.detail.col} ${e.detail.action} — sunucuya bağlanılamadı`);
    };
    window.addEventListener("kopru:sync-error", onSyncError);
    return () => window.removeEventListener("kopru:sync-error", onSyncError);
  }, [toast]);

  const value = {
    user, login, logout, rev, bump, authChecked,
    get, set, profile, addXp, addNotif, setAvatar, toast, toastMsg,
    applyTheme, applySettings,
    lang, setLang, t, motivasyon, ipucu,
    sessionSec, sessionPaused, setSessionPaused,
    timer, toggleTimer, setDuration, setMode, finishEarly,
    pendingFish, setPendingFish,
    quoteIdx, tipIdx,
    Storage, C,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
