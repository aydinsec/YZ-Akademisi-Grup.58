import { useState, useEffect, useRef } from "react";
import BoatScene from "../components/BoatScene";
import { useApp } from "../state/AppContext.jsx";
import { Cam } from "../utils/camera.js";
import { iso, fmtMin } from "../utils/helpers.js";

export default function Focus() {
  const { get, rev, timer, toggleTimer, setDuration, setMode, toast } = useApp();
  void rev;

  const [isCamOpen, setIsCamOpen] = useState(Cam.running);
  const [camStatus, setCamStatus] = useState({ state: "kapali", text: "Kamera izleme kapalı", color: "muted" });
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

  /* kamera durum akışını bu sayfaya bağla */
  useEffect(() => {
    Cam.onStatus = (st) => setCamStatus(st);
    return () => { Cam.onStatus = null; };
  }, []);

  const startCam = async () => {
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
  };
  const stopCam = () => { Cam.stop(); setIsCamOpen(false); toast("Kamera izleme kapatıldı"); };

  const faceState =
    camStatus.state === "odak" ? "Gözler Açık" :
    camStatus.state === "alarm" || camStatus.state === "kapali-goz" ? "Gözler Kapalı" :
    camStatus.state === "yuz-yok" ? "Yüz Yok" :
    camStatus.state === "bekleniyor" ? "Aranıyor…" : "—";
  const attn = !isCamOpen ? "—" : camStatus.state === "alarm" ? "Düşük" : todayWarn.length === 0 ? "Yüksek" : todayWarn.length < 3 ? "Orta" : "Düşük";
  const lastWarn = todayWarn.length ? Math.max(0, Math.round((Date.now() - todayWarn[todayWarn.length - 1].time) / 60000)) + " dk önce" : "—";

  return (
    <section className="page" id="page-focus">
      {/* === SOL: SAYAÇ, 3D SAHNE, KAMERA === */}
      <div>
        <div className="card focus-timer">
          <div>
            <div className="select" style={{ marginBottom: "14px" }}>
              <select value={timer.mode} onChange={(e) => setMode(e.target.value)}>
                <option value="derin">Derin Odak</option>
                <option value="orta">Orta Odak</option>
                <option value="hafif">Hafif Odak</option>
              </select>
            </div>
            <div className="clock">{mm}:{ss}</div>
            <div className="goal">
              {timer.isBreak ? "Hedefin: Zihnini dinlendir (Ara)" : `Hedefin: 1 odak seansı (${Math.round(timer.total / 60)} dk)`}
            </div>
          </div>

          <div className="ring-wrap">
            <svg className="donut" width="150" height="150">
              <circle className="bgc" cx="75" cy="75" r="65" strokeWidth="9" />
              <circle className="fgc" cx="75" cy="75" r="65" strokeWidth="9"
                strokeDasharray="408.4" strokeDashoffset={String(408.4 * (1 - pct / 100))} />
            </svg>
            <img src="assets/img/timer_boat.png" alt="" />
          </div>

          <div className="focus-btns">
            <button className="btn-red" onClick={toggleTimer}>
              <svg width="16" height="16"><use href={timer.running ? "#i-pause" : "#i-play"} /></svg>
              <span>{timer.running ? "Duraklat" : timer.sec < timer.total ? "Devam Et" : "Odak Modunu Başlat"}</span>
            </button>
            <button className="btn-outline" onClick={() => { setDuration(5, true); toggleTimer(); }}>
              <svg width="16" height="16"><use href="#i-coffee" /></svg> Kısa Ara (5 dk)
            </button>
          </div>

          <div className="prog-line">
            <div className="bar"><i style={{ width: `${pct}%` }}></i></div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 700 }}>%{pct}</span>
          </div>
        </div>

        {/* 3D TEKNE SAHNESİ (Three.js) 🌊 */}
        <div style={{ marginTop: "24px" }}>
          <BoatScene isRunning={timer.running} minutes={mm} seconds={ss} />
        </div>

        {/* KAMERA İZLEME (odak takip sistemi) */}
        <div className="card cam-card" style={{ marginTop: "24px" }}>
          <div className="card-h">
            <div className="l"><svg width="18" height="18"><use href="#i-camera" /></svg> Kamera İzleme</div>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: isCamOpen ? "var(--green)" : "var(--muted)", display: "flex", alignItems: "center", gap: "7px" }}>
              <i style={{ width: 8, height: 8, borderRadius: "50%", background: isCamOpen ? "var(--green)" : "var(--muted2)", display: "inline-block" }}></i>
              {isCamOpen ? "Kamera: Aktif" : "Kamera: Kapalı"}
            </span>
          </div>

          <div className="cam-body">
            {!isCamOpen && (
              <div className="cam-off">
                <svg width="46" height="46"><use href="#i-camera" /></svg>
                <div className="t">Kamera izleme kapalı</div>
                <div className="d">
                  Eğitilen odak takip sistemi göz kapalılığını, baş yatıklığını ve yüz kaybını izler.
                  Başlatınca tarayıcı kamera izni isteyecek.
                </div>
                <button className="btn-red" onClick={startCam}>
                  <svg width="16" height="16"><use href="#i-camera" /></svg> Kamerayı Başlat
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
                  <div className="t1">Uyanık kal! {camStatus.text.replace("UYARI! ", "")}</div>
                  <div className="t2">Lütfen odaklanmaya devam et.</div>
                </div>
              </div>
            )}
          </div>

          <div className="cam-foot">
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-user" /></svg>
              <div>
                <div className="k">Yüz Durumu</div>
                <div className={"v " + (camStatus.state === "odak" ? "green" : camStatus.state === "alarm" ? "red" : camStatus.color === "orange" ? "orange" : "")}>{faceState}</div>
              </div>
            </div>
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-target" /></svg>
              <div>
                <div className="k">Dikkat Seviyesi</div>
                <div className={"v " + (attn === "Yüksek" ? "green" : attn === "Düşük" ? "red" : attn === "Orta" ? "orange" : "")}>{attn}</div>
              </div>
            </div>
            <div className="cam-stat" style={{ borderRight: "none" }}>
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}><use href="#i-clock" /></svg>
              <div><div className="k">Son Uyarı</div><div className="v">{lastWarn}</div></div>
            </div>
            <button className="btn-outline" onClick={isCamOpen ? stopCam : startCam}>
              <svg width="16" height="16"><use href={isCamOpen ? "#i-camera-off" : "#i-camera"} /></svg>
              <span>{isCamOpen ? "Kamerayı Kapat" : "Kamerayı Aç"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* === SAĞ: İPUÇLARI, UYARILAR, GÜNLÜK === */}
      <div>
        <div className="card">
          <div className="card-h"><div className="l"><svg width="18" height="18"><use href="#i-bulb" /></svg> Odak İpuçları</div></div>
          <ul className="tips" style={{ padding: "8px 20px 16px" }}>
            {["Bildirimlerini kapat", "Tek bir işe odaklan", "Küçük adımlar, büyük ilerleme", "Derin nefes al, devam et"].map((t) => (
              <li key={t}><svg width="17" height="17"><use href="#i-check-c" /></svg> {t}</li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">Uyarılar</div><span className="badge-count">{todayWarn.length}</span></div>
          {todayWarn.length === 0 && <div className="warn-empty">Bu oturumda uyarı yok. Böyle devam, Kaptan! ⚓</div>}
          {todayWarn.slice(-4).reverse().map((w, i) => {
            const dk = Math.round((Date.now() - w.time) / 60000);
            return (
              <div className="warn-row" key={i}>
                <svg width="18" height="18"><use href="#i-alert" /></svg>
                <div>
                  <div className="t">{w.reason}.</div>
                  <div className="d">Lütfen uyanık kal ve odaklanmaya devam et.</div>
                </div>
                <span className="when">{dk < 1 ? "Şimdi" : dk + " dk önce"}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">Günlük İstatistiklerin</div></div>
          <div className="daily-grid">
            <div className="donut-wrap" style={{ padding: "8px 0" }}>
              <svg className="donut" width="130" height="130">
                <circle className="bgc" cx="65" cy="65" r="55" strokeWidth="10" />
                <circle className="fgc" cx="65" cy="65" r="55" strokeWidth="10"
                  strokeDasharray="345.6" strokeDashoffset={String(345.6 * (1 - goal / 100))} />
              </svg>
              <div className="donut-c"><div className="p">%{goal}</div><div className="s">Günlük Hedef</div></div>
            </div>
            <div className="daily-rows">
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-moon" /></svg></div>
                <span className="k">Odak Süresi</span><span className="v">{fmtMin(dMin)}</span>
              </div>
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-target" /></svg></div>
                <span className="k">Tamamlanan Seans</span><span className="v">{todaySes.length} / 5</span>
              </div>
              <div className="daily-row">
                <div className="mini-ic"><svg width="16" height="16"><use href="#i-anchor" /></svg></div>
                <span className="k">Bugünkü Uyarı</span><span className="v">{todayWarn.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="banner" style={{ marginTop: "20px" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="t">Okyanus Akıntın</div>
            <div className="d">Her odak seansı, seni hedeflerine<br />bir adım daha yaklaştırır.</div>
          </div>
          <img className="art" src="assets/img/buoy_banner.png" alt="" />
        </div>
      </div>
    </section>
  );
}
