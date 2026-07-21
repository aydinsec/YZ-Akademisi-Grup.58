import { useState } from "react";

function Catches() {
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState("all");

  // Koleksiyonda gösterilecek örnek balıklar
  const [fishes] = useState([
    {
      id: 1,
      name: "Lüfer",
      type: "Nadir",
      time: "50 dk Odak",
      date: "Bugün",
      icon: "i-fish",
      color: "#3b82f6",
    },
    {
      id: 2,
      name: "Çipura",
      type: "Yaygın",
      time: "25 dk Odak",
      date: "Dün",
      icon: "i-fish",
      color: "#10b981",
    },
    {
      id: 3,
      name: "Kılıç Balığı",
      type: "Efsanevi",
      time: "100 dk Odak",
      date: "3 gün önce",
      icon: "i-fish",
      color: "#f59e0b",
    },
  ]);

  return (
    <section className="page" id="page-catches">
      {/* Üst Hero Banner[cite: 1] */}
      <div
        className="card catch-hero"
        style={{
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, var(--card-bg), var(--bg-soft))",
        }}
      >
        <div className="catch-sum">
          <h3
            style={{
              fontFamily: "Quicksand",
              fontSize: "20px",
              margin: "0 0 16px",
            }}
          >
            Yakalama Özeti
          </h3>
          <div className="catch-stats" style={{ display: "flex", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="ico"
                style={{
                  padding: "8px",
                  background: "var(--blue-soft)",
                  color: "var(--teal)",
                  borderRadius: "8px",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-fish" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Toplam Balık
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {fishes.length}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="ico"
                style={{
                  padding: "8px",
                  background: "var(--green-soft)",
                  color: "var(--green)",
                  borderRadius: "8px",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-clock" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Odak Süresi
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  175dk
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="ico"
                style={{
                  padding: "8px",
                  background: "var(--orange-soft)",
                  color: "var(--orange)",
                  borderRadius: "8px",
                }}
              >
                <svg width="20" height="20">
                  <use href="#i-star" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  En Nadir
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  Efsanevi
                </div>
              </div>
            </div>
          </div>
        </div>
        <img
          className="ph"
          src="assets/img/catch_photo.png"
          alt="Gün batımında tekne"
          style={{ height: "100px", objectFit: "contain" }}
        />
      </div>

      {/* Sekmeler ve Filtre Barı[cite: 1] */}
      <div className="tabs" style={{ marginBottom: "16px" }}>
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          Balıklarım
        </button>
        <button
          className={activeTab === "col" ? "active" : ""}
          onClick={() => setActiveTab("col")}
        >
          Koleksiyon
        </button>
        <button
          className={activeTab === "rare" ? "active" : ""}
          onClick={() => setActiveTab("rare")}
        >
          Nadir Balıklar
        </button>
      </div>

      <div
        className="catch-toolbar"
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          className={`pill ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Tümü
        </button>
        <button
          className={`pill ${filter === "today" ? "active" : ""}`}
          onClick={() => setFilter("today")}
        >
          Bugün
        </button>
        <button
          className={`pill ${filter === "week" ? "active" : ""}`}
          onClick={() => setFilter("week")}
        >
          Bu Hafta
        </button>
        <div className="select" style={{ marginLeft: "auto" }}>
          <select>
            <option value="all">Nadirlik: Tümü</option>
            <option value="yaygin">Yaygın</option>
            <option value="efsanevi">Efsanevi</option>
          </select>
        </div>
        <div
          className="searchbox"
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-soft)",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          <svg
            width="16"
            height="16"
            style={{ color: "var(--muted)", marginRight: "6px" }}
          >
            <use href="#i-search" />
          </svg>
          <input
            placeholder="Balık ara..."
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              color: "var(--text)",
              fontSize: "13px",
            }}
          />
        </div>
      </div>

      {/* Balık Grid (Izgara) Alanı[cite: 1] */}
      <div
        className="fish-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {fishes.map((fish) => (
          <div
            key={fish.id}
            className="card"
            style={{
              padding: "20px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              borderTop: `4px solid ${fish.color}`,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: "var(--bg-soft)",
                color: fish.color,
                fontWeight: "bold",
              }}
            >
              {fish.type}
            </span>
            <div style={{ margin: "16px 0", color: fish.color }}>
              <svg width="48" height="48">
                <use href="#i-fish" />
              </svg>
            </div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                color: "var(--text)",
              }}
            >
              {fish.name}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                marginTop: "4px",
              }}
            >
              {fish.time}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted2)",
                marginTop: "12px",
                borderTop: "1px solid var(--border)",
                paddingTop: "8px",
              }}
            >
              Yakalandı: {fish.date}
            </div>
          </div>
        ))}
      </div>

      {/* Alt Banner[cite: 1] */}
      <div className="banner" style={{ marginTop: "24px" }}>
        <div className="ic">
          <svg width="24" height="24">
            <use href="#i-anchor" />
          </svg>
        </div>
        <div>
          <div className="t">Daha fazlasını yakalamaya hazır mısın?</div>
          <div className="d">
            Her tamamlanan odak seansı denizden yeni bir balık getirir. Süre
            uzadıkça balık nadirleşir!
          </div>
        </div>
        <img className="art" src="assets/img/waves_banner.png" alt="" />
      </div>
    </section>
  );
}

export default Catches;
