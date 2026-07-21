import { useState, useEffect, useRef } from "react";
import BoatScene from "../components/BoatScene";

export default function Focus() {
  // Sayaç ve modlar için durum yönetimi
  const [focusMode, setFocusMode] = useState("derin");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Yapay zeka kamera ve yüz takibi durumları
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [camStatusText, setCamStatusText] = useState("Kamera izleme kapalı");
  const [faceState, setFaceState] = useState("—");
  const [attnLevel, setAttnLevel] = useState("—");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // --- GERÇEK ZAMANLI SAYACIN ÇALIŞMA MANTIĞI ---
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            alert(
              isBreak
                ? "Mola bitti Kaptan, rotaya dönme zamanı! 🧭"
                : "Tebrikler Kaptan! Odak seansını başarıyla tamamladın! ⚓🐟",
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreak]);

  // Süreyi dakika ve saniyeye çevir
  const formatMin = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const formatSec = (secondsLeft % 60).toString().padStart(2, "0");
  const progressPct = totalDuration
    ? Math.round(((totalDuration - secondsLeft) / totalDuration) * 100)
    : 0;

  // Önceden ayarlı butonlara tıklandığında (25dk, 5dk mola vb.)
  const handleDurationSet = (mins, breakMode = false) => {
    setIsRunning(false);
    setIsBreak(breakMode);
    setTotalDuration(mins * 60);
    setSecondsLeft(mins * 60);
  };

  // --- YAPAY ZEKA KAMERA TAKİBİ (camera.js BAĞLANTISI) ---
  const toggleCamera = async () => {
    const Cam = window.KopruCam;
    if (!Cam) {
      alert(
        "Kamera motoru bulanamadı! index.html içinde camera.js bağlı mı kontrol et.",
      );
      return;
    }

    if (!isCamOpen) {
      try {
        setCamStatusText("Model yükleniyor, lütfen bekleyin...");
        setIsCamOpen(true);
        await Cam.start(videoRef.current, canvasRef.current);
        setCamStatusText("Kamera Aktif — Yüz İzleniyor");
        setFaceState("Aranıyor...");
        setAttnLevel("Yüksek");
      } catch (err) {
        setIsCamOpen(false);
        setCamStatusText("Kamera başlatılamadı veya izin reddedildi.");
        console.error("Kamera hatası:", err);
      }
    } else {
      Cam.stop();
      setIsCamOpen(false);
      setCamStatusText("Kamera izleme kapalı");
      setFaceState("—");
      setAttnLevel("—");
    }
  };

  useEffect(() => {
    const Cam = window.KopruCam;
    if (Cam) {
      Cam.onStatus = (st) => {
        setCamStatusText(st.text);
        if (st.state === "odak") {
          setFaceState("Odaklanmış (Gözler Açık)");
          setAttnLevel("Yüksek");
        } else if (st.state === "kapali-goz" || st.state === "alarm") {
          setFaceState("Gözler Kapalı!");
          setAttnLevel("Düşük");
        } else if (st.state === "yuz-yok") {
          setFaceState("Yüz Görünmüyor");
          setAttnLevel("Tehlikeli");
        }
      };
    }
  }, []);

  return (
    <section
      className="page"
      id="page-focus"
      style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}
    >
      {/* === SOL TARAF: SAYAÇ, 3D DENİZ VE KAMERA === */}
      <div>
        {/* 1. Odak Sayacı Kartı */}
        <div className="card focus-timer">
          <div>
            <div className="select" style={{ marginBottom: "14px" }}>
              <select
                value={focusMode}
                onChange={(e) => setFocusMode(e.target.value)}
              >
                <option value="derin">Derin Odak</option>
                <option value="orta">Orta Odak</option>
                <option value="hafif">Hafif Odak</option>
              </select>
            </div>
            <div className="clock" id="focusClock">
              {formatMin}:{formatSec}
            </div>
            <div className="goal" id="focusGoal">
              {isBreak
                ? "Hedefin: Zihnini dinlendir (Mola)"
                : "Hedefin: 1 odak seansı (" +
                  Math.round(totalDuration / 60) +
                  " dk)"}
            </div>
          </div>

          <div className="ring-wrap">
            <svg className="donut" width="150" height="150">
              <circle className="bgc" cx="75" cy="75" r="65" strokeWidth="9" />
              <circle
                className="fgc"
                id="focusRing"
                cx="75"
                cy="75"
                r="65"
                strokeWidth="9"
                strokeDasharray="408.4"
                strokeDashoffset={String(408.4 * (1 - progressPct / 100))}
              />
            </svg>
            <img src="assets/img/timer_boat.png" alt="" />
          </div>

          <div className="focus-btns">
            <button
              className="btn-red"
              onClick={() => setIsRunning(!isRunning)}
            >
              <svg width="16" height="16">
                <use href={isRunning ? "#i-pause" : "#i-play"} />
              </svg>
              <span>
                {isRunning ? "Odak Modunu Duraklat" : "Odak Modunu Başlat"}
              </span>
            </button>
            <button
              className="btn-outline"
              onClick={() => handleDurationSet(5, true)}
            >
              <svg width="16" height="16">
                <use href="#i-coffee" />
              </svg>{" "}
              Kısa Ara (5 dk)
            </button>
          </div>

          <div className="prog-line">
            <div className="bar">
              <i id="focusBar" style={{ width: `${progressPct}%` }}></i>
            </div>
            <span
              id="focusPct"
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                fontWeight: "700",
              }}
            >
              %{progressPct}
            </span>
          </div>
        </div>

        {/* 2. SENİN THREE.JS 3D TEKNE SAHNEN BURADA! 🌊 */}
        <div style={{ marginTop: "24px" }}>
          <BoatScene
            isRunning={isRunning}
            minutes={formatMin}
            seconds={formatSec}
          />
        </div>

        {/* 3. Kamera İzleme Kartı (Yapay Zeka) */}
        <div className="card cam-card" style={{ marginTop: "24px" }}>
          <div className="card-h">
            <div className="l">
              <svg width="18" height="18">
                <use href="#i-camera" />
              </svg>{" "}
              Kamera İzleme
            </div>
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: "700",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <i
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isCamOpen ? "var(--green)" : "var(--muted2)",
                  display: "inline-block",
                }}
              ></i>
              <span>
                {isCamOpen ? "Kamera: Açık (İzleniyor)" : "Kamera: Kapalı"}
              </span>
            </span>
          </div>

          <div
            className="cam-body"
            id="camBody"
            style={{
              minHeight: "260px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-soft)",
              overflow: "hidden",
              borderRadius: "12px",
            }}
          >
            {!isCamOpen && (
              <div
                className="cam-off"
                style={{ textAlign: "center", padding: "20px", zIndex: 2 }}
              >
                <svg
                  width="46"
                  height="46"
                  style={{ margin: "0 auto", color: "var(--muted2)" }}
                >
                  <use href="#i-camera" />
                </svg>
                <div
                  className="t"
                  style={{ fontWeight: "700", marginTop: "10px" }}
                >
                  Kamera izleme kapalı
                </div>
                <div
                  className="d"
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    maxWidth: "380px",
                    margin: "8px auto",
                  }}
                >
                  Eğittiğin odak takip sistemi göz kapalılığını, baş yatıklığını
                  ve yüz kaybını izler.
                </div>
                <button
                  className="btn-red"
                  style={{ marginTop: "14px" }}
                  onClick={toggleCamera}
                >
                  <svg width="16" height="16">
                    <use href="#i-camera" />
                  </svg>{" "}
                  Kamerayı Başlat
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              style={{
                display: isCamOpen ? "block" : "none",
                width: "100%",
                height: "auto",
                maxHeight: "320px",
                objectFit: "cover",
                borderRadius: "8px",
                transform: "scaleX(-1)",
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{
                display: isCamOpen ? "block" : "none",
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                transform: "scaleX(-1)",
              }}
            />
          </div>

          <div className="cam-foot" style={{ marginTop: "12px" }}>
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}>
                <use href="#i-user" />
              </svg>
              <div>
                <div className="k">Yüz Durumu</div>
                <div
                  className="v"
                  style={{ fontSize: "13px", fontWeight: "bold" }}
                >
                  {faceState}
                </div>
              </div>
            </div>
            <div className="cam-stat">
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}>
                <use href="#i-target" />
              </svg>
              <div>
                <div className="k">Dikkat Seviyesi</div>
                <div
                  className="v"
                  style={{ fontSize: "13px", fontWeight: "bold" }}
                >
                  {attnLevel}
                </div>
              </div>
            </div>
            <div className="cam-stat" style={{ borderRight: "none" }}>
              <svg width="16" height="16" style={{ color: "var(--muted2)" }}>
                <use href="#i-clock" />
              </svg>
              <div>
                <div className="k">Durum</div>
                <div
                  className="v"
                  style={{ fontSize: "11px", color: "var(--muted)" }}
                >
                  {camStatusText}
                </div>
              </div>
            </div>
            <button className="btn-outline" onClick={toggleCamera}>
              <svg width="16" height="16">
                <use href={isCamOpen ? "#i-camera-off" : "#i-camera"} />
              </svg>
              <span>{isCamOpen ? "Kamerayı Kapat" : "Kamerayı Aç"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* === SAĞ TARAF: BİLGİ KARTLARI VE BANNER === */}
      <div>
        <div className="card">
          <div className="card-h">
            <div className="l">
              <svg width="18" height="18">
                <use href="#i-bulb" />
              </svg>{" "}
              Odak İpuçları
            </div>
          </div>
          <ul
            className="tips"
            style={{
              padding: "8px 20px 16px",
              listStyle: "none",
              margin: 0,
              fontSize: "13.5px",
            }}
          >
            <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
              <svg width="17" height="17" style={{ color: "var(--teal)" }}>
                <use href="#i-check-c" />
              </svg>{" "}
              Bildirimlerini kapat
            </li>
            <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
              <svg width="17" height="17" style={{ color: "var(--teal)" }}>
                <use href="#i-check-c" />
              </svg>{" "}
              Tek bir işe odaklan
            </li>
            <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
              <svg width="17" height="17" style={{ color: "var(--teal)" }}>
                <use href="#i-check-c" />
              </svg>{" "}
              Küçük adımlar, büyük ilerleme
            </li>
            <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
              <svg width="17" height="17" style={{ color: "var(--teal)" }}>
                <use href="#i-check-c" />
              </svg>{" "}
              Derin nefes al, devam et
            </li>
          </ul>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h">
            <div className="l">Uyarılar</div>
            <span
              className="badge-count"
              style={{
                background: "var(--bg-soft)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              0
            </span>
          </div>
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "13.5px",
            }}
          >
            Bu oturumda uyarı yok. Böyle devam, Kaptan! ⚓
          </div>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h">
            <div className="l">Günlük İstatistiklerin</div>
          </div>
          <div
            className="daily-grid"
            style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div className="donut-wrap" style={{ padding: "0" }}>
              <svg className="donut" width="100" height="100">
                <circle
                  className="bgc"
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                />
                <circle
                  className="fgc"
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="251.2"
                />
              </svg>
              <div className="donut-c">
                <div className="p" style={{ fontSize: "16px" }}>
                  %0
                </div>
              </div>
            </div>
            <div className="daily-rows" style={{ flex: 1, fontSize: "13px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "6px 0",
                }}
              >
                <span style={{ color: "var(--muted)" }}>Odak Süresi</span>
                <b>0dk</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "6px 0",
                }}
              >
                <span style={{ color: "var(--muted)" }}>Seans</span>
                <b>0 / 5</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "6px 0",
                }}
              >
                <span style={{ color: "var(--muted)" }}>Seri</span>
                <b>0 gün</b>
              </div>
            </div>
          </div>
        </div>

        <div className="banner" style={{ marginTop: "20px" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="t">Okyanus Akıntın</div>
            <div className="d">
              Her odak seansı, seni hedeflerine
              <br />
              bir adım daha yaklaştırır.
            </div>
          </div>
          <img className="art" src="assets/img/buoy_banner.png" alt="" />
        </div>
      </div>
    </section>
  );
}
