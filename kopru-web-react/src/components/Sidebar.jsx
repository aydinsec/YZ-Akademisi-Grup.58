import { useApp } from "../state/AppContext.jsx";

const NAV = [
  ["home", "i-home", "Ana Sayfa"],
  ["focus", "i-target", "Odak Modu"],
  ["tasks", "i-check-sq", "Görevler"],
  ["stats", "i-chart", "İstatistikler"],
  ["catches", "i-fish", "Yakalamalarım"],
  ["aquarium", "i-aquarium", "Akvaryum"],
  ["settings", "i-gear", "Ayarlar"],
];

function Sidebar({ currentPage, setCurrentPage }) {
  const { profile, rev, t } = useApp();
  void rev;
  const p = profile();
  const pct = Math.round((p.xp / p.xpMax) * 100) + "%";

  return (
    <aside className="sidebar">
      <div className="side-logo">
        <img src="assets/img/logo.png" alt="KÖPRÜ" />
        <span>KÖPRÜ</span>
      </div>

      <nav className="nav">
        {NAV.map(([key, icon, label]) => (
          <button key={key} onClick={() => setCurrentPage(key)} className={currentPage === key ? "active" : ""}>
            <svg width="20" height="20"><use href={`#${icon}`} /></svg> {t(label)}
          </button>
        ))}
      </nav>

      <div className="side-sea">
        <img src="assets/img/sidebar_boat.png" alt="" />
        <div className="side-profile" title={t("Profilim")} onClick={() => setCurrentPage("profile")}>
          <div className="top">
            <img className="av" src={p.avatar || "assets/img/avatar.png"} alt="Avatar" />
            <div>
              <div className="hello">{t("Merhaba,")}</div>
              <div className="name">
                <span>{p.name}</span>{" "}
                <svg width="14" height="14"><use href="#i-anchor" /></svg>
              </div>
            </div>
          </div>
          <div className="xpbar"><i style={{ width: pct }}></i></div>
          <div className="xptext">
            <span>{t("Seviye")} {p.level}</span> &nbsp;·&nbsp; <span>{p.xp} / {p.xpMax} XP</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
