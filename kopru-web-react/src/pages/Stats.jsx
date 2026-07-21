import { useState } from "react";

function Stats() {
  const [activeTab, setActiveTab] = useState("genel");

  return (
    <section className="page" id="page-stats">
      {/* Üst Sekmeler ve Zaman Filtresi */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div className="tabs" style={{ flex: 1, margin: 0 }}>
          <button
            className={activeTab === "genel" ? "active" : ""}
            onClick={() => setActiveTab("genel")}
          >
            Genel Bakış
          </button>
          <button
            className={activeTab === "sure" ? "active" : ""}
            onClick={() => setActiveTab("sure")}
          >
            Odak Süresi
          </button>
          <button
            className={activeTab === "seans" ? "active" : ""}
            onClick={() => setActiveTab("seans")}
          >
            Seanslar
          </button>
          <button
            className={activeTab === "aliskanlik" ? "active" : ""}
            onClick={() => setActiveTab("aliskanlik")}
          >
            Alışkanlıklar
          </button>
          <button
            className={activeTab === "basari" ? "active" : ""}
            onClick={() => setActiveTab("basari")}
          >
            Başarılar
          </button>
        </div>
        <div className="select">
          <select>
            <option>Bu Hafta</option>
            <option>Geçen Hafta</option>
          </select>
        </div>
      </div>

      {/* 4'lü Üst İstatistik Kartları */}
      <div
        className="stat-cards"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card stat-card" style={{ padding: "16px" }}>
          <div
            className="top"
            style={{ color: "var(--muted)", fontSize: "13px" }}
          >
            <span
              className="ico"
              style={{
                background: "var(--blue-soft)",
                color: "var(--teal)",
                padding: "6px",
                borderRadius: "8px",
                marginRight: "8px",
              }}
            >
              <svg width="18" height="18">
                <use href="#i-clock" />
              </svg>
            </span>{" "}
            Toplam Odak
          </div>
          <div
            className="v"
            style={{ fontSize: "22px", fontWeight: "bold", margin: "8px 0" }}
          >
            125dk
          </div>
          <div
            className="delta"
            style={{ fontSize: "12px", color: "var(--green)" }}
          >
            ▲ %12 bu hafta
          </div>
        </div>
        <div className="card stat-card" style={{ padding: "16px" }}>
          <div
            className="top"
            style={{ color: "var(--muted)", fontSize: "13px" }}
          >
            <span
              className="ico"
              style={{
                background: "var(--green-soft)",
                color: "var(--green)",
                padding: "6px",
                borderRadius: "8px",
                marginRight: "8px",
              }}
            >
              <svg width="18" height="18">
                <use href="#i-target" />
              </svg>
            </span>{" "}
            Tamamlanan Seans
          </div>
          <div
            className="v"
            style={{ fontSize: "22px", fontWeight: "bold", margin: "8px 0" }}
          >
            5
          </div>
          <div
            className="delta"
            style={{ fontSize: "12px", color: "var(--green)" }}
          >
            ▲ 2 seans
          </div>
        </div>
        <div className="card stat-card" style={{ padding: "16px" }}>
          <div
            className="top"
            style={{ color: "var(--muted)", fontSize: "13px" }}
          >
            <span
              className="ico"
              style={{
                background: "var(--blue-soft)",
                color: "var(--teal)",
                padding: "6px",
                borderRadius: "8px",
                marginRight: "8px",
              }}
            >
              <svg width="18" height="18">
                <use href="#i-check-c" />
              </svg>
            </span>{" "}
            Görevler
          </div>
          <div
            className="v"
            style={{ fontSize: "22px", fontWeight: "bold", margin: "8px 0" }}
          >
            3
          </div>
          <div
            className="delta"
            style={{ fontSize: "12px", color: "var(--muted)" }}
          >
            Sabit
          </div>
        </div>
        <div className="card stat-card" style={{ padding: "16px" }}>
          <div
            className="top"
            style={{ color: "var(--muted)", fontSize: "13px" }}
          >
            <span
              className="ico"
              style={{
                background: "var(--orange-soft)",
                color: "var(--orange)",
                padding: "6px",
                borderRadius: "8px",
                marginRight: "8px",
              }}
            >
              <svg width="18" height="18">
                <use href="#i-flame" />
              </svg>
            </span>{" "}
            En Uzun Seri
          </div>
          <div
            className="v"
            style={{ fontSize: "22px", fontWeight: "bold", margin: "8px 0" }}
          >
            2 gün
          </div>
          <div
            className="delta"
            style={{ fontSize: "12px", color: "var(--orange)" }}
          >
            🔥 Harika!
          </div>
        </div>
      </div>

      {/* Orta Grafikler Alanı[cite: 1] */}
      <div
        className="grid2"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "24px",
        }}
      >
        <div>
          {/* Bar Chart Simülasyonu */}
          <div className="card">
            <div className="card-h">
              <div className="l">Günlük Odak Süresi</div>
              <div className="select">
                <select>
                  <option>Süre (saat)</option>
                  <option>Seans sayısı</option>
                </select>
              </div>
            </div>
            <div
              style={{
                padding: "30px 20px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-around",
                height: "180px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(
                (gun, idx) => (
                  <div
                    key={gun}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: `${[40, 70, 20, 90, 50, 10, 30][idx]}px`,
                        background:
                          idx === 3 ? "var(--teal)" : "var(--bg-soft)",
                        borderRadius: "6px",
                      }}
                    ></div>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {gun}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div className="card" style={{ padding: "20px" }}>
              <div
                className="card-h"
                style={{ padding: 0, marginBottom: "12px" }}
              >
                <div className="l">Odak Türleri</div>
              </div>
              <div style={{ fontSize: "13px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "8px 0",
                  }}
                >
                  <span>Derin Odak</span>
                  <b>%70</b>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "8px 0",
                  }}
                >
                  <span>Orta Odak</span>
                  <b>%20</b>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "8px 0",
                  }}
                >
                  <span>Hafif Odak</span>
                  <b>%10</b>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <div
                className="card-h"
                style={{ padding: 0, marginBottom: "12px" }}
              >
                <div className="l">Başarı Oranı</div>
              </div>
              <div style={{ textAlign: "center", paddingTop: "10px" }}>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "var(--green)",
                  }}
                >
                  %85
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    margin: "4px 0 0",
                  }}
                >
                  Hedeflenen seans bitirme
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Odak Dağılımı ve Motive Edici Övgü Kartı[cite: 1] */}
        <div>
          <div className="card">
            <div className="card-h">
              <div className="l">Odak Dağılımı</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "22px",
                padding: "20px",
              }}
            >
              <svg width="120" height="120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth="15"
                  strokeDasharray="200 314"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--orange)"
                  strokeWidth="15"
                  strokeDasharray="80 314"
                  strokeDashoffset="-200"
                />
              </svg>
              <div style={{ fontSize: "13px" }}>
                <div style={{ margin: "6px 0" }}>
                  <b style={{ color: "var(--teal)" }}>●</b> İş / Yazılım (%65)
                </div>
                <div style={{ margin: "6px 0" }}>
                  <b style={{ color: "var(--orange)" }}>●</b> Kişisel (%35)
                </div>
              </div>
            </div>
          </div>

          {/* Övgü Kartı[cite: 1] */}
          <div
            className="praise"
            style={{
              marginTop: "20px",
              background: "var(--bg-soft)",
              padding: "24px",
              borderRadius: "16px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="t"
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "var(--text)",
              }}
            >
              Rotan açık, Kaptan! ⚓
            </div>
            <div
              className="d"
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                margin: "8px 0 16px",
              }}
            >
              Odak seanslarını tamamladıkça istatistiklerin burada birikiyor.
              Harika bir disiplin!
            </div>
            <button className="btn-outline">
              <svg width="16" height="16">
                <use href="#i-download" />
              </svg>{" "}
              Detaylı Raporu İndir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Stats;
