import { useState } from "react";

function Home({ setCurrentPage }) {
  // Sayaç ve modlar için temel state'ler
  const [focusMode, setFocusMode] = useState("derin");
  const [timerMin, setTimerMin] = useState(25);
  const [isRunning, setIsRunning] = useState(false);

  // Önceden ayarlanmış süre butonlarına basılınca çalışacak fonksiyon
  const handlePresetClick = (min, mode) => {
    setTimerMin(min);
    if (mode === "Odak") setFocusMode("derin");
    else setFocusMode("hafif");
  };

  return (
    <section
      className="page"
      id="page-home"
      style={{ display: "flex", gap: "24px" }}
    >
      <div className="home-left" style={{ flex: 1 }}>
        {/* === HERO (SAYAÇ ALANI) === */}
        <div className="hero">
          <div>
            <div className="inner">
              <div className="tag">
                <svg width="20" height="20">
                  <use href="#i-waves" />
                </svg>{" "}
                Odak Zamanı
              </div>

              <div className="clock" id="homeClock">
                {timerMin < 10 ? `0${timerMin}` : timerMin}:00
              </div>

              <div className="select mode-dd">
                <select
                  value={focusMode}
                  onChange={(e) => setFocusMode(e.target.value)}
                >
                  <option value="derin">Derin Odak</option>
                  <option value="orta">Orta Odak</option>
                  <option value="hafif">Hafif Odak</option>
                </select>
              </div>
              <br />

              <button
                className="btn-red"
                onClick={() => setIsRunning(!isRunning)}
              >
                <svg width="17" height="17">
                  <use href={isRunning ? "#i-pause" : "#i-play"} />
                </svg>
                <span>
                  {isRunning ? "Odak Modunu Duraklat" : "Odak Modunu Başlat"}
                </span>
              </button>
            </div>

            {/* Önceden Tanımlı Süre Butonları */}
            <div className="presets">
              <button
                className={`preset ${timerMin === 25 ? "sel" : ""}`}
                onClick={() => handlePresetClick(25, "Odak")}
              >
                <span className="reddot"></span>
                <div className="a">25 dk</div>
                <div className="b">Odak</div>
              </button>

              <button
                className={`preset ${timerMin === 15 ? "sel" : ""}`}
                onClick={() => handlePresetClick(15, "Kısa Ara")}
              >
                <div className="a">15 dk</div>
                <div className="b">Kısa Ara</div>
              </button>

              <button
                className={`preset ${timerMin === 50 ? "sel" : ""}`}
                onClick={() => handlePresetClick(50, "Odak")}
              >
                <div className="a">50 dk</div>
                <div className="b">Odak</div>
              </button>

              <button
                className={`preset ${timerMin === 20 ? "sel" : ""}`}
                onClick={() => handlePresetClick(20, "Uzun Ara")}
              >
                <div className="a">20 dk</div>
                <div className="b">Uzun Ara</div>
              </button>

              <button className="preset">
                <div
                  className="a"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <svg width="15" height="15">
                    <use href="#i-sliders" />
                  </svg>{" "}
                  Özelleştir
                </div>
              </button>
            </div>
          </div>

          <div className="art">
            <img
              src="assets/img/hero_sun.png"
              alt="Gün doğumunda balıkçı teknesi"
            />
          </div>
        </div>

        {/* === BİLGİ KARTLARI (GÖREVLER, YAKALAMALAR, İSTATİSTİKLER) === */}
        <div className="home-grid">
          {/* 1. Kart: Günün Görevleri */}
          <div className="card">
            <div className="card-h">
              <div className="l">
                <svg width="18" height="18">
                  <use href="#i-check-sq" />
                </svg>{" "}
                Günün Görevleri
              </div>
              <button className="link" onClick={() => setCurrentPage("tasks")}>
                Tümünü Gör
              </button>
            </div>
            <div
              style={{
                padding: "16px",
                color: "var(--muted)",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Henüz bir görev eklenmedi.
            </div>
            <button
              className="add-mini"
              onClick={() => setCurrentPage("tasks")}
            >
              <svg width="15" height="15">
                <use href="#i-plus" />
              </svg>{" "}
              Yeni görev ekle
            </button>
          </div>

          {/* 2. Kart: Yakalamalarım */}
          <div className="card">
            <div className="card-h">
              <div className="l">
                <svg width="18" height="18">
                  <use href="#i-fish" />
                </svg>{" "}
                Yakalamalarım
              </div>
              <button
                className="link"
                onClick={() => setCurrentPage("catches")}
              >
                Tümünü Gör
              </button>
            </div>
            <div className="fish-big">
              <div className="cir">
                <svg width="34" height="34" style={{ color: "var(--teal)" }}>
                  <use href="#i-fish" />
                </svg>
              </div>
              <div>
                <div className="n">0</div>
                <div className="d">Bugünkü yakalaman</div>
              </div>
            </div>
            <div className="two-stats">
              <div>
                <div class="k">Toplam Balık</div>
                <div className="v">0</div>
              </div>
              <div>
                <div class="k">En Büyük Seri</div>
                <div className="v">0 gün</div>
              </div>
            </div>
          </div>

          {/* 3. Kart: İstatistikler */}
          <div className="card">
            <div className="card-h">
              <div className="l">
                <svg width="18" height="18">
                  <use href="#i-chart" />
                </svg>{" "}
                İstatistikler
              </div>
              <button className="link" onClick={() => setCurrentPage("stats")}>
                Bu Hafta
              </button>
            </div>
            <div className="donut-wrap">
              <svg className="donut" width="120" height="120">
                <circle
                  className="bgc"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="11"
                />
                <circle
                  className="fgc"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="11"
                  strokeDasharray="314.16"
                  strokeDashoffset="314.16"
                />
              </svg>
              <div className="donut-c">
                <div className="p">%0</div>
                <div className="s">
                  Odaklanma
                  <br />
                  Oranın
                </div>
              </div>
            </div>
            <div className="two-stats">
              <div>
                <div className="k">Toplam Odak</div>
                <div className="v">0dk</div>
              </div>
              <div>
                <div className="k">Tamamlanan</div>
                <div className="v">0</div>
              </div>
            </div>
          </div>
        </div>

        {/* === ALT BANNER === */}
        <div className="banner" style={{ marginTop: "24px" }}>
          <div className="ic">
            <svg width="24" height="24">
              <use href="#i-anchor" />
            </svg>
          </div>
          <div>
            <div className="t">Köprünü kur</div>
            <div className="d">
              Odaklan, yakala, ilerle.
              <br />
              Küçük adımlar büyük rotalar çizer.
            </div>
          </div>
          <img className="art" src="assets/img/lighthouse_banner.png" alt="" />
        </div>
      </div>

      {/* === SAĞ TARAFTAKİ FOTOĞRAF VE SES BUTONU === */}
      <div className="side-photo">
        <img src="assets/img/side_photo.png" alt="Denizde balıkçı teknesi" />
        <button className="sound-fab" aria-label="Ortam sesi aç/kapat">
          <svg width="22" height="22">
            <use href="#i-volume" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default Home;
