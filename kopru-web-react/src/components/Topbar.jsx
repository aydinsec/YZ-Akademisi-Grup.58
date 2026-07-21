// import React from "react";

function Topbar({ currentPage }) {
  const getPageInfo = () => {
    switch (currentPage) {
      case "home":
        return {
          title: "Günaydın, Kaptan",
          sub: "Bugün odaklan, ilerlemeni denize bırak.",
        };
      case "focus":
        return {
          title: "Odak Modu",
          sub: "Dikkatini topla ve seansı tamamla.",
        };
      case "tasks":
        return {
          title: "Görevler",
          sub: "Hedeflerini planla, adım adım ilerle.",
        };
      case "stats":
        return {
          title: "İstatistikler",
          sub: "Odaklanma geçmişini ve rotanı incele.",
        };
      case "catches":
        return {
          title: "Yakalamalarım",
          sub: "Denizden çıkardığın balık koleksiyonun.",
        };
      case "settings":
        return { title: "Ayarlar", sub: "Uygulama tercihlerini özelleştir." };
      default:
        return { title: "KÖPRÜ", sub: "Odaklan. İlerle. Köprü kur." };
    }
  };

  const { title, sub } = getPageInfo();

  return (
    <header className="topbar">
      <div className="titles">
        <h1>
          <span>{title}</span>{" "}
          <svg className="anchor" width="22" height="22">
            <use href="#i-anchor" />
          </svg>
        </h1>
        <div className="sub">{sub}</div>
      </div>

      <div className="top-actions">
        {/* Bildirim Butonu */}
        <button className="iconbtn" aria-label="Bildirimler">
          <svg width="19" height="19">
            <use href="#i-bell" />
          </svg>
          <span className="dot hidden"></span>
        </button>

        {/* Tema Değiştir Butonu */}
        <button className="iconbtn" aria-label="Tema değiştir">
          <svg width="19" height="19">
            <use href="#i-moon" />
          </svg>
        </button>

        <div className="top-sep"></div>

        {/* Oturum Süresi Çipi */}
        <div className="session-chip">
          <svg width="21" height="21">
            <use href="#i-clock" />
          </svg>
          <div>
            <div className="lbl">OTURUM SÜRESİ</div>
            <div className="time">00:00:00</div>
          </div>
          <button aria-label="Duraklat">
            <svg width="14" height="14">
              <use href="#i-pause" />
            </svg>
          </button>
        </div>
      </div>

      <img className="top-boat" src="assets/img/boat_topright.png" alt="" />
    </header>
  );
}

export default Topbar;
