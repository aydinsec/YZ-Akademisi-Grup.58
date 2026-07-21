import { useState } from "react";

function Settings() {
  // Üst sekmeler için state
  const [activeTab, setActiveTab] = useState("genel");

  // Ayar anahtarları (Toggle) ve seçimler için interaktif state'ler[cite: 1]
  const [sfx, setSfx] = useState(true);
  const [ambient, setAmbient] = useState(true);
  const [sync, setSync] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [motiv, setMotiv] = useState(true);
  const [theme, setTheme] = useState("light");
  const [sens, setSens] = useState(50);

  return (
    <section className="page" id="page-settings">
      {/* Üst Sekmeler[cite: 1] */}
      <div className="tabs" style={{ marginBottom: "24px" }}>
        <button
          className={activeTab === "genel" ? "active" : ""}
          onClick={() => setActiveTab("genel")}
        >
          Genel
        </button>
        <button
          className={activeTab === "odak" ? "active" : ""}
          onClick={() => setActiveTab("odak")}
        >
          Odak Modu
        </button>
        <button
          className={activeTab === "bildirim" ? "active" : ""}
          onClick={() => setActiveTab("bildirim")}
        >
          Bildirimler
        </button>
        <button
          className={activeTab === "gorunum" ? "active" : ""}
          onClick={() => setActiveTab("gorunum")}
        >
          Görünüm
        </button>
        <button
          className={activeTab === "hesap" ? "active" : ""}
          onClick={() => setActiveTab("hesap")}
        >
          Hesap
        </button>
        <button
          className={activeTab === "veri" ? "active" : ""}
          onClick={() => setActiveTab("veri")}
        >
          Veri Yönetimi
        </button>
      </div>

      <div
        className="grid2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        {/* === SOL KOLON === */}
        <div>
          {/* 1. Genel Tercihler[cite: 1] */}
          <div className="card set-group" style={{ marginBottom: "20px" }}>
            <div className="set-h">
              <svg width="18" height="18">
                <use href="#i-gear" />
              </svg>{" "}
              Genel Tercihler
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-globe" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Dil</div>
                <div className="d">Uygulama dilini seç.</div>
              </div>
              <div className="select">
                <select>
                  <option>Türkçe</option>
                  <option>English</option>
                </select>
              </div>
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-clock" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Zaman Formatı</div>
                <div className="d">Saat ve tarih gösterim biçimini seç.</div>
              </div>
              <div className="select">
                <select>
                  <option>24 Saat</option>
                  <option>12 Saat</option>
                </select>
              </div>
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-cal" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Haftanın İlk Günü</div>
                <div className="d">
                  Takvim ve istatistikler için haftanın başlangıcını seç.
                </div>
              </div>
              <div className="select">
                <select>
                  <option>Pazartesi</option>
                  <option>Pazar</option>
                </select>
              </div>
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-volume" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Ses Efektleri</div>
                <div className="d">
                  Alarm ve uygulama seslerini aç veya kapat.
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={sfx}
                onChange={() => setSfx(!sfx)}
              />
            </div>

            <div className="set-row" style={{ borderBottom: "none" }}>
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-waves" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Arka Plan Ambiyansı</div>
                <div className="d">
                  Odak modunda arka plan deniz seslerini aç veya kapat.
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={ambient}
                onChange={() => setAmbient(!ambient)}
              />
            </div>
          </div>

          {/* 2. Kamera ve Odak Takibi[cite: 1] */}
          <div className="card set-group" style={{ marginBottom: "20px" }}>
            <div className="set-h">
              <svg width="18" height="18">
                <use href="#i-camera" />
              </svg>{" "}
              Kamera ve Odak Takibi
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-camera" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Kamera</div>
                <div className="d">
                  Odak takibi için kullanılacak kamerayı seç.
                </div>
              </div>
              <div className="select">
                <select>
                  <option value="">Varsayılan Kamera</option>
                </select>
              </div>
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-eye" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Göz Kapanma Hassasiyeti</div>
                <div className="d">
                  EAR eşiğini ayarlar — yüksek hassasiyet kapanmayı daha erken
                  algılar.
                </div>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="100"
                value={sens}
                onChange={(e) => setSens(e.target.value)}
              />
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  width: "44px",
                  textAlign: "right",
                }}
              >
                {sens > 66 ? "Yüksek" : sens > 33 ? "Orta" : "Düşük"}
              </span>
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-alert" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Uyarı Eşiği</div>
                <div className="d">
                  Kaç saniye göz kapalı kalırsa alarm verilsin?
                </div>
              </div>
              <div className="select">
                <select defaultValue="2">
                  <option value="1">1 saniye</option>
                  <option value="2">2 saniye</option>
                  <option value="3">3 saniye</option>
                </select>
              </div>
            </div>

            <div className="set-row" style={{ borderBottom: "none" }}>
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-monitor" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Kamera Önizlemesi</div>
                <div className="d">
                  Kapatılırsa takip sürer ama görüntü gizlenir.
                </div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>

          {/* 3. Veri ve Senkronizasyon[cite: 1] */}
          <div className="card set-group">
            <div className="set-h">
              <svg width="18" height="18">
                <use href="#i-cloud" />
              </svg>{" "}
              Veri ve Senkronizasyon
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-cloud" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Bulut Senkronizasyonu</div>
                <div className="d">
                  Verilerini buluta yedekle ve cihazların arasında senkronize
                  et.
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={sync}
                onChange={() => setSync(!sync)}
              />
            </div>

            <div className="set-row">
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-download" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Verileri Dışa Aktar</div>
                <div className="d">Tüm verilerini JSON olarak dışa aktar.</div>
              </div>
              <button
                className="btn-outline"
                onClick={() => alert("Veriler JSON olarak indirildi!")}
              >
                <svg width="15" height="15">
                  <use href="#i-download" />
                </svg>{" "}
                Dışa Aktar
              </button>
            </div>

            <div className="set-row" style={{ borderBottom: "none" }}>
              <div className="set-ic">
                <svg width="17" height="17">
                  <use href="#i-trash" />
                </svg>
              </div>
              <div className="b">
                <div className="t">Verileri Temizle</div>
                <div className="d">
                  Odak süreleri, görevler ve balıkları kalıcı olarak sil.
                </div>
              </div>
              <button
                className="btn-danger-o"
                onClick={() => alert("Tüm veriler temizlendi!")}
              >
                <svg width="15" height="15">
                  <use href="#i-trash" />
                </svg>{" "}
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* === SAĞ KOLON === */}
        <div>
          {/* 1. Odak Hatırlatıcıları[cite: 1] */}
          <div className="card set-group" style={{ marginBottom: "20px" }}>
            <div
              className="set-h"
              style={{ borderBottom: "none", justifyContent: "space-between" }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "11px" }}
              >
                <svg width="18" height="18">
                  <use href="#i-bell" />
                </svg>{" "}
                Odak Hatırlatıcıları
              </span>
              <input
                type="checkbox"
                className="toggle"
                checked={reminders}
                onChange={() => setReminders(!reminders)}
              />
            </div>
            <div
              style={{
                padding: "0 22px 6px",
                color: "var(--muted)",
                fontSize: "12.5px",
                marginTop: "-4px",
              }}
            >
              Belirlediğin aralıklarla odaklanman için hatırlatıcılar al.
            </div>

            <div className="set-row" style={{ marginTop: "8px" }}>
              <div className="b">
                <div className="t">Hatırlatıcı Aralığı</div>
              </div>
              <div className="select">
                <select defaultValue="25 dakika">
                  <option>15 dakika</option>
                  <option>25 dakika</option>
                  <option>50 dakika</option>
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="b">
                <div className="t">Kısa Mola Süresi</div>
              </div>
              <div className="select">
                <select defaultValue="5 dakika">
                  <option>5 dakika</option>
                  <option>10 dakika</option>
                </select>
              </div>
            </div>
            <div className="set-row" style={{ borderBottom: "none" }}>
              <div className="b">
                <div className="t">Uzun Mola Süresi</div>
              </div>
              <div className="select">
                <select defaultValue="15 dakika">
                  <option>10 dakika</option>
                  <option>15 dakika</option>
                  <option>20 dakika</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Motivasyon Mesajları[cite: 1] */}
          <div className="card set-group" style={{ marginBottom: "20px" }}>
            <div
              className="set-h"
              style={{ borderBottom: "none", justifyContent: "space-between" }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "11px" }}
              >
                <svg width="18" height="18">
                  <use href="#i-star" />
                </svg>{" "}
                Motivasyon Mesajları
              </span>
              <input
                type="checkbox"
                className="toggle"
                checked={motiv}
                onChange={() => setMotiv(!motiv)}
              />
            </div>
            <div
              style={{
                padding: "0 22px",
                color: "var(--muted)",
                fontSize: "12.5px",
                marginTop: "-4px",
              }}
            >
              Mesajlar belirli aralıklarla kendiliğinden değişir.
            </div>
            <div
              className="quote-box"
              style={{
                margin: "16px 20px",
                padding: "16px",
                background: "var(--bg-soft)",
                borderRadius: "12px",
                position: "relative",
              }}
            >
              <svg
                width="26"
                height="26"
                style={{ color: "var(--teal)", opacity: 0.5 }}
              >
                <use href="#i-quote" />
              </svg>
              <div
                className="q"
                style={{
                  fontFamily: "Quicksand",
                  fontWeight: "bold",
                  fontSize: "14px",
                  margin: "8px 0",
                  whiteSpace: "pre-line",
                }}
              >
                {"Derin sulara dalmadan\nbüyük balıklar yakalanmaz."}
              </div>
              <img
                src="assets/img/quote_boat.png"
                alt=""
                style={{
                  position: "absolute",
                  right: "10px",
                  bottom: "10px",
                  height: "40px",
                  opacity: 0.8,
                }}
              />
            </div>
          </div>

          {/* 3. Tema[cite: 1] */}
          <div className="card set-group" style={{ marginBottom: "20px" }}>
            <div className="set-h">
              <svg width="18" height="18">
                <use href="#i-moon" />
              </svg>{" "}
              Tema{" "}
              <span
                style={{
                  fontWeight: "500",
                  color: "var(--muted)",
                  fontSize: "12px",
                  marginLeft: "auto",
                }}
              >
                Uygulama temasını seç.
              </span>
            </div>
            <div
              className="themes"
              style={{ display: "flex", gap: "10px", padding: "16px 20px" }}
            >
              <button
                className={`theme-opt ${theme === "light" ? "sel" : ""}`}
                onClick={() => setTheme("light")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  background:
                    theme === "light" ? "var(--bg-soft)" : "transparent",
                  fontWeight: "bold",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-sun" />
                </svg>{" "}
                Açık
              </button>
              <button
                className={`theme-opt ${theme === "dark" ? "sel" : ""}`}
                onClick={() => setTheme("dark")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  background:
                    theme === "dark" ? "var(--bg-soft)" : "transparent",
                  fontWeight: "bold",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-moon" />
                </svg>{" "}
                Koyu
              </button>
              <button
                className={`theme-opt ${theme === "system" ? "sel" : ""}`}
                onClick={() => setTheme("system")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  background:
                    theme === "system" ? "var(--bg-soft)" : "transparent",
                  fontWeight: "bold",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-monitor" />
                </svg>{" "}
                Sistem
              </button>
            </div>
          </div>

          {/* 4. Premium Kartı[cite: 1] */}
          <div
            className="prem"
            style={{
              background:
                "linear-gradient(135deg, var(--navy-deep), var(--teal))",
              color: "#fff",
              padding: "24px",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="t"
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="20" height="20" style={{ color: "#fbbf24" }}>
                <use href="#i-crown" />
              </svg>{" "}
              Premium Özellikler
            </div>
            <div
              className="d"
              style={{ fontSize: "13px", opacity: 0.9, margin: "6px 0 16px" }}
            >
              Daha fazlası için yükselt!
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px",
                fontSize: "13.5px",
              }}
            >
              <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                <svg width="16" height="16" style={{ color: "#34d399" }}>
                  <use href="#i-check-c" />
                </svg>{" "}
                Sınırsız odak seansı
              </li>
              <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                <svg width="16" height="16" style={{ color: "#34d399" }}>
                  <use href="#i-check-c" />
                </svg>{" "}
                Detaylı istatistik raporları
              </li>
              <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                <svg width="16" height="16" style={{ color: "#34d399" }}>
                  <use href="#i-check-c" />
                </svg>{" "}
                Özel ambiyans sesleri
              </li>
              <li style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                <svg width="16" height="16" style={{ color: "#34d399" }}>
                  <use href="#i-check-c" />
                </svg>{" "}
                Veri yedekleme ve geri yükleme
              </li>
            </ul>
            <button
              className="btn-prem"
              style={{
                background: "#fbbf24",
                color: "#000",
                fontWeight: "bold",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Premium'a Geç
            </button>
            <img
              src="assets/img/premium_lighthouse.png"
              alt=""
              style={{
                position: "absolute",
                right: "-10px",
                bottom: "0",
                height: "120px",
                opacity: 0.2,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;
