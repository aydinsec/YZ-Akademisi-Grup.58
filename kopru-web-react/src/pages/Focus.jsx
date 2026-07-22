import { useState, useEffect, useRef, useCallback } from "react";
import BoatScene from "../components/BoatScene";
import { useApp } from "../state/AppContext.jsx";
import { Cam } from "../utils/camera.js";
import { iso, fmtMin } from "../utils/helpers.js";

export default function Focus() {
  const { get, rev, timer, toggleTimer, setDuration, toast, t, ipucu, tipIdx, C } = useApp();
  void rev;

  const [isCamOpen, setIsCamOpen] = useState(Cam.running);
  const [camStatus, setCamStatus] = useState({ state: "kapali", text: t("Kamera izleme kapalı"), color: "muted" });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const sessions = get("sessions", []);
  const warnings = get("warnings", []);
  const today = iso();
  const todaySes = sessions.filter((s) => s.date === today);
  const todayWarn = warnings.filter((w) => iso(new Date(w.time)) === today);
  const dMin = todaySes.reduce((a, s) => a + s.minutes, 0);
  const goal = Math.min(100, Math.round((todaySes.length / 5) * 100));
  const preview = get("settings", {}).preview !== false;

  const mm = String(Math.floor(timer.sec / 60)).padStart(2, "0");
  const ss = String(timer.sec % 60).padStart(2, "0");
  const pct = timer.total ? Math.round(((timer.total - timer.sec) / timer.total) * 100) : 0;

  useEffect(() => {
    Cam.onStatus = (st) => setCamStatus(st);
    return () => { Cam.onStatus = null; };
  }, []);

  const startCam = useCallback(async () => {
    if (Cam.running) return;
    try {
      setCamStatus({ state: "yukleniyor", text: "Model yükleniyor…", color: "muted" });
      setIsCamOpen(true);
      await Cam.start(videoRef.current, canvasRef.current);
      toast("Odak takip sistemi aktif 👁");
    } catch (err) {
      setIsCamOpen(false);
      const msg = err && err.name === "NotAllowedError"
        ? "Kamera izni reddedildi. Tarayıcı ayarlarından izin vermelisin."
        : err && err.name === "NotFoundError" ? "Kamera bulunamadı." : "Kamera başlatılamadı: " + (err.message || err);
      setCamStatus({ state: "kapali", text: msg, color: "muted" });
      toast(msg);
    }
  }, [toast]);
  const stopCam = () => { Cam.stop(); setIsCamOpen(false); };

  /* Odak başlat → kamera izleme otomatik aktifleşir */
  const startFocus = () => {
    const wasRunning = timer.running;
    toggleTimer();
    if (!wasRunning && !timer.isBreak && !Cam.running) startCam();
  };

  const faceState =
    camStatus.state === "odak" ? t("Gözler Açık") :
    camStatus.state === "alarm" || camStatus.state === "kapali-goz" ? t("Gözler Kapalı") :
    camStatus.state === "yuz-yok" ? t("Yüz Yok") :
    camStatus.state === "bekleniyor" ? t("Aranıyor…") : "—";
  const attn = !isCamOpen ? "—" : camStatus.state === "alarm" ? t("Düşük") : todayWarn.length === 0 ? t("Yüksek") : todayWarn.length < 3 ? t("Orta") : t("Düşük");
  const lastWarn = todayWarn.length ? Math.max(0, Math.round((Date.now() - todayWarn[todayWarn.length - 1].time) / 60000)) + " " + t("dk önce") : "—";

  /* dönen ipuçları — 4'lü pencere */
  const tips = [0, 1, 2, 3].map((k) => ipucu((tipIdx + k) % C.IPUCLARI.length));

  return (
    <section className="page" id="page-focus">
      {/* === SOL: BÜTÜNLEŞİK 3D SAHNE + KAMERA === */}
      <div>
        {/* Sayaç ve kontroller 3D sahnenin içinde */}
        <BoatScene isRunning={timer.running} minutes={mm} seconds={ss}>
          <div className="scene-controls">
            <div className="sc-goal">
              {timer.isBreak ? t("Hedefin: Zihnini dinlendir (Ara)") : `${t("Hedefin: 1 odak seansı")} (${Math.round(timer.total / 60)} dk)`}
            </div>
            <div className="sc-row">
              <button className="btn-red" onClick={startFocus}>
                <svg width="16" height="16"><use href={timer.running ? "#i-pause" : "#i-play"} /></svg>
                <span>{timer.running ? t("Duraklat") : timer.sec < timer.total ? t("Devam Et") : t("Odak Modunu Başlat")}</span>
              </button>
              <button className="scene-btn sc-break" onClick={() => { setDuration(5, true); toggleTimer(); }}>
                <svg width="15" height="15"><use href="#i-coffee" /></svg> {t("Kısa Ara (5 dk)")}
              </button>
            </div>
            <div className="sc-prog">
              <div className="bar"><i style={{ width: `${pct}%` }}></i></div>
              <span>%{pct}</span>
            </div>
          </div>
        </BoatScene>

        {/* KAMERA İZLEME */}
        <div className="card cam-card" style={{ marginTop: "24px" }}>
          <div className="card-h">
            <div className="l"><svg width="18" height="18"><use href="#i-camera" /></svg> {t("Kamera İzleme")}</div>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: isCamOpen ? "var(--green)" : "var(--muted)", display: "flex", alignItems: "center", gap: "7px" }}>
              <i style={{ width: 8, height: 8, borderRadius: "50%", background: isCamOpen ? "var(--green)" : "var(--muted2)", display: "inline-block" }}></i>
              {isCamOpen ? t("Kamera: Aktif") : t("Kamera: Kapalı")}
            </span>
          </div>

          <div className="cam-body">
            {!isCamOpen && (
              <div className="cam-off">
                <svg width="46" height="46"><use href="#i-camera" /></svg>
                <div className="t">{t("Kamera izleme kapalı")}</div>
                <div className="d">{t("Eğitilen odak takip sistemi göz kapalılığını, baş yatıklığını ve yüz kaybını izler. Başlatınca tarayıcı kamera izni isteyecek.")}</div>
                <button className="btn-red" onClick={startCam}>
                  <svg width="16" height="16"><use href="#i-camera" /></svg> {t("Kamerayı Başlat")}
                </button>
              </div>
            )}

            <video ref={videoRef} className={isCamOpen ? "" : "hidden"}
              style={{ visibility: preview ? "visible" : "hidden" }} playsInline muted />
            <canvas ref={canvasRef} className={isCamOpen ? "" : "hidden"}
              style={{ visibility: preview ? "visible" : "hidden" }} />

            {isCamOpen && <div className={"cam-status " + (camStatus.color || "muted")}>{camStatus.text}</div>}
            {isCamOpen && camStatus.state === "alarm" && (
              <div className="cam-alert">
                <div className="spk"><svg width="18" height="18"><use href="#i-volume" /></svg></div>
                <div>
                  <div className="t1">{camStatus.text.replace("UYARI! ", "")}</div>
                  <div className="t2">{t("Lütfen uyanık kal ve odaklanmaya devam et.")}</div>
                </div>
              </div>
            )}
          </div>

          <div className="cam-foot">
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-user" /></svg>
              <div>
                <div className="k">{t("Yüz Durumu")}</div>
                <div className={"v " + (camStatus.state === "odak" ? "green" : camStatus.state === "alarm" ? "red" : camStatus.color === "orange" ? "orange" : "")}>{faceState}</div>
              </div>
            </div>
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-target" /></svg>
              <div>
                <div className="k">{t("Dikkat Seviyesi")}</div>
                <div className={"v " + (attn === t("Yüksek") ? "green" : attn === t("Düşük") ? "red" : attn === t("Orta") ? "orange" : "")}>{attn}</div>
              </div>
            </div>
            <div className="cam-stat" style={{ borderRight: "none" }}>
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-clock" /></svg>
              <div><div className="k">{t("Son Uyarı")}</div><div className="v">{lastWarn}</div></div>
            </div>
            <button className="btn-outline" onClick={isCamOpen ? stopCam : startCam}>
              <svg width="16" height="16"><use href={isCamOpen ? "#i-camera-off" : "#i-camera"} /></svg>
              <span>{isCamOpen ? t("Kamerayı Kapat") : t("Kamerayı Aç")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* === SAĞ: İPUÇLARI, UYARILAR, GÜNLÜK === */}
      <div>
        <div className="card">
          <div className="card-h"><div className="l"><svg width="18" height="18"><use href="#i-bulb" /></svg> {t("Odak İpuçları")}</div></div>
          <ul className="tips tips-rotating" style={{ padding: "8px 20px 16px" }}>
            {tips.map((tip) => (
              <li key={tip}><svg width="17" height="17"><use href="#i-check-c" /></svg> {tip}</li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">{t("Uyarılar")}</div><span className="badge-count">{todayWarn.length}</span></div>
          {todayWarn.length === 0 && <div className="warn-empty">{t("Bu oturumda uyarı yok. Böyle devam, Kaptan! ⚓")}</div>}
          {todayWarn.slice(-4).reverse().map((w, i) => {
            const dk = Math.round((Date.now() - w.time) / 60000);
            return (
              <div className="warn-row" key={i}>
                <svg width="18" height="18"><use href="#i-alert" /></svg>
                <div>
                  <div className="t">{w.reason}.</div>
                  <div className="d">{t("Lütfen uyanık kal ve odaklanmaya devam et.")}</div>
                </div>
                <span className="when">{dk < 1 ? t("Şimdi") : dk + " " + t("dk önce")}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">{t("Günlük İstatistiklerin")}</div></div>
          <div className="daily-grid">
            <div className="donut-wrap" style={{ padding: "8px 0" }}>
              <svg className="donut" width="130" height="130">
                <circle className="bgc" cx="65" cy="65" r="55" strokeWidth="10" />
                <circle className="fgc" cx="65" cy="65" r="55" strokeWidth="10"
                  strokeDasharray="345.6" strokeDashoffset={String(345.6 * (1 - goal / 100))} />
              </svg>
              <div className="donut-c"><div className="p">%{goal}</div><div className="s">{t("Günlük Hedef")}</div></div>
            </div>
            <div className="daily-rows">
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-moon" /></svg></div>
                <span className="k">{t("Odak Süresi")}</span><span className="v">{fmtMin(dMin)}</span>
              </div>
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-target" /></svg></div>
                <span className="k">{t("Tamamlanan Seans")}</span><span className="v">{todaySes.length} / 5</span>
              </div>
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-anchor" /></svg></div>
                <span className="k">{t("Bugünkü Uyarı")}</span><span className="v">{todayWarn.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="banner" style={{ marginTop: "20px" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="t">{t("Okyanus Akıntın")}</div>
            <div className="d">{t("Her odak seansı, seni hedeflerine")}<br />{t("bir adım daha yaklaştırır.")}</div>
          </div>
          <img className="art" src="assets/img/buoy_banner.png" alt="" />
        </div>
      </div>
    </section>
  );
}
