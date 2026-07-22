/* ============================================================
   KÖPRÜ — Uygulama Durumu (React Context)
   Zamanlayıcı, kullanıcı verileri, XP, balık yakalama, bildirim
   ve toast tek yerden yönetilir; tüm sayfalar buradan beslenir.
   ============================================================ */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Storage } from "../utils/storage.js";
import { KOPRU_CONFIG as C, RAR_LBL } from "../utils/config.js";
import { Cam } from "../utils/camera.js";
import { iso } from "../utils/helpers.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rev, setRev] = useState(0); // veri değişince artar → sayfalar yeniden hesaplar
  const bump = useCallback(() => setRev((r) => r + 1), []);

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

  /* ---------- profil / XP ---------- */
  const profile = useCallback(
    () => get("profile", { name: "Kaptan", level: 1, xp: 0, xpMax: 1000, joined: iso() }),
    [get]
  );
  const addNotif = useCallback((icon, t, d) => {
    Storage.update("notifs", (a) => { a.unshift({ icon, t, d, ts: Date.now() }); return a.slice(0, 12); }, []);
    bump();
  }, [bump]);
  const addXp = useCallback((n) => {
    const p = profile();
    p.xp += n;
    while (p.xp >= p.xpMax) {
      p.xp -= p.xpMax;
      p.level++;
      p.xpMax += 200;
      toast("Tebrikler Kaptan! Seviye " + p.level + " oldun ⚓");
      addNotif("flame", "Seviye atladın!", "Artık Seviye " + p.level + " kaptanısın.");
    }
    Storage.set("profile", p);
    bump();
  }, [profile, toast, addNotif, bump]);

  /* ---------- tema ---------- */
  const applyTheme = useCallback((t) => {
    if (Storage.user) Storage.update("settings", (s) => { s.theme = t; return s; }, {});
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
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

  /* ---------- odak zamanlayıcısı (Ana Sayfa + Odak Modu ortak) ---------- */
  const [timer, setTimer] = useState({ sec: 25 * 60, total: 25 * 60, running: false, isBreak: false, mode: "derin" });
  const [pendingFish, setPendingFish] = useState(null); // seans sonrası isim bekleyen balık

  const catchFish = useCallback((minutes) => {
    const catalog = window.FISH_CATALOG || [];
    if (!catalog.length) { toast("Balık kataloğu bulunamadı (assets/fish/manifest.js)"); return; }
    const tier = C.NADIRLIK_ESIKLERI.find((e) => minutes >= e.min).tier;
    let pool = catalog.filter((f) => f.tier === tier);
    if (!pool.length) pool = catalog;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const f = { id: Date.now(), name: "", file: pick.file, tier, minutes, date: iso(), isNew: true };
    Storage.update("fish", (a) => { a.unshift(f); return a; }, []);
    addNotif("fish", "Yeni balık yakaladın!", RAR_LBL[tier] + " tür · " + minutes + " dk seans");
    setPendingFish(f);
    bump();
  }, [toast, addNotif, bump]);

  const finishFocus = useCallback((t) => {
    if (t.isBreak) { toast("Ara bitti. Rotaya dönme zamanı! 🧭"); return; }
    const minutes = Math.round(t.total / 60);
    Storage.push("sessions", { date: iso(), minutes, mode: t.mode, hour: new Date().getHours(), completed: true, ts: Date.now() });
    addXp(C.XP_SEANS);
    catchFish(minutes);
  }, [toast, addXp, catchFish]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t.sec <= 1) {
          const bitti = { ...t, sec: t.total, running: false };
          setTimeout(() => finishFocus(t), 0);
          return bitti;
        }
        return { ...t, sec: t.sec - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running, finishFocus]);

  const toggleTimer = useCallback(() => {
    setTimer((t) => {
      const running = !t.running;
      if (running) {
        if (t.sec === t.total && !t.isBreak) Storage.update("starts", (m) => { m[iso()] = (m[iso()] || 0) + 1; return m; }, {});
        toast(t.isBreak ? "Ara başladı, iyi dinlenmeler ☕" : "Odak modu başladı. Rüzgar arkanda, Kaptan! ⚓");
      } else {
        toast("Zamanlayıcı duraklatıldı");
      }
      return { ...t, running };
    });
  }, [toast]);

  const setDuration = useCallback((min, isBreak = false) => {
    setTimer((t) => ({ ...t, sec: min * 60, total: min * 60, running: false, isBreak }));
  }, []);
  const setMode = useCallback((mode) => setTimer((t) => ({ ...t, mode })), []);

  /* ---------- kamera uyarıları → kayıt + bildirim ---------- */
  useEffect(() => {
    Cam.onAlarm = (reason) => {
      if (!Storage.user) return;
      Storage.push("warnings", { time: Date.now(), reason });
      addNotif("alert", reason, "Odak takip sistemi uyarı verdi");
      bump();
    };
  }, [addNotif, bump]);

  /* ---------- motivasyon mesajı (otomatik döner) ---------- */
  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (Storage.get("settings", {}).motiv === false) return;
      setQuoteIdx((i) => (i + 1) % C.MOTIVASYON.length);
    }, C.MOTIVASYON_ARALIGI_SN * 1000);
    return () => clearInterval(id);
  }, [user]);

  /* ---------- giriş / çıkış ---------- */
  const applySettings = useCallback(() => {
    const s = Storage.get("settings", {});
    C.KAPALI_SURE_ESIGI = parseFloat(s.thresh || 2);
    C.YUZ_YOK_ESIGI = parseFloat(s.faceThresh || 4);
    const v = s.sens !== undefined ? s.sens : 50;
    C.EAR_ESIK = 0.14 + (v / 100) * 0.12;
    if (s.camId) Cam.deviceId = s.camId;
    applyTheme(s.theme || "light");
  }, [applyTheme]);

  const login = useCallback((email, remember, registerName) => {
    Storage.login(email, remember);
    const yeni = Storage.get("profile", null) === null;
    const p = Storage.get("profile", { name: "Kaptan", level: 1, xp: 0, xpMax: 1000, joined: iso() });
    if (registerName) p.name = registerName.split(" ")[0];
    else if (yeni) p.name = email.split("@")[0];
    if (yeni) p.joined = iso();
    Storage.set("profile", p);
    applySettings();
    setUser(Storage.user);
    bump();
    toast("Hoş geldin, " + p.name + "! ⚓");
  }, [applySettings, toast, bump]);

  const logout = useCallback(() => { Cam.stop(); Storage.logout(); setUser(null); }, []);

  /* hatırlanan kullanıcıyla otomatik giriş */
  useEffect(() => {
    const r = Storage.rememberedUser();
    if (r) { Storage.login(r, true); applySettings(); setUser(Storage.user); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user, login, logout, rev, bump,
    get, set, profile, addXp, addNotif, toast, toastMsg,
    applyTheme, applySettings,
    sessionSec, sessionPaused, setSessionPaused,
    timer, toggleTimer, setDuration, setMode,
    pendingFish, setPendingFish,
    quoteIdx,
    Storage, C,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
