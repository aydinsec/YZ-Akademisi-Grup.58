// import React from "react";

function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="sidebar">
      <div className="side-logo">
        <img src="assets/img/logo.png" alt="KÖPRÜ" />
        <span>KÖPRÜ</span>
      </div>

      <nav className="nav">
        <button
          onClick={() => setCurrentPage("home")}
          className={currentPage === "home" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-home" />
          </svg>{" "}
          Ana Sayfa
        </button>

        <button
          onClick={() => setCurrentPage("focus")}
          className={currentPage === "focus" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-target" />
          </svg>{" "}
          Odak Modu
        </button>

        <button
          onClick={() => setCurrentPage("tasks")}
          className={currentPage === "tasks" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-check-sq" />
          </svg>{" "}
          Görevler
        </button>

        <button
          onClick={() => setCurrentPage("stats")}
          className={currentPage === "stats" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-chart" />
          </svg>{" "}
          İstatistikler
        </button>

        <button
          onClick={() => setCurrentPage("catches")}
          className={currentPage === "catches" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-fish" />
          </svg>{" "}
          Yakalamalarım
        </button>

        <button
          onClick={() => setCurrentPage("settings")}
          className={currentPage === "settings" ? "active" : ""}
        >
          <svg width="20" height="20">
            <use href="#i-gear" />
          </svg>{" "}
          Ayarlar
        </button>
      </nav>

      <div className="side-sea">
        <img src="assets/img/sidebar_boat.png" alt="" />
        <div className="side-profile" title="Profilim">
          <div className="top">
            <img className="av" src="assets/img/avatar.png" alt="Avatar" />
            <div>
              <div className="hello">Merhaba,</div>
              <div className="name">
                <span>Kaptan</span>{" "}
                <svg width="14" height="14">
                  <use href="#i-anchor" />
                </svg>
              </div>
            </div>
          </div>
          <div className="xpbar">
            <i></i>
          </div>
          <div className="xptext">
            <span>Seviye 1</span> &nbsp;·&nbsp; <span>0 / 1000 XP</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
