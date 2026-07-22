import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import { fmt, fmtH } from "../utils/helpers.js";

const PAGES = {
  home: [null, "Bugün odaklan, ilerlemeni denize bırak."],
  focus: ["Odak Modu", "Dikkatini rotana ver, ilerlemen seni bekliyor."],
  tasks: ["Görevler", "Görevlerini planla, odaklan ve tamamla."],
  stats: ["İstatistikler", "Odaklanma yolculuğunu verilerle keşfet."],
  catches: ["Yakalamalarım", "Odaklandıkça denizin sana sundukları çoğalır."],
  settings: ["Ayarlar", "Deneyimini kişiselleştir, odak yolculuğunu özelleştir."],
  profile: ["Profilim", "Yolculuğunu görüntüle ve kişisel ayarlarını yönet."],
};
const NOTIF_ICONS = {
  alert: ["var(--red-soft)", "var(--red)", "i-alert"],
  fish: ["var(--green-soft)", "var(--green)", "i-fish"],
  flame: ["var(--orange-soft)", "var(--orange)", "i-flame"],
};

function Topbar({ currentPage }) {
  const { profile, get, rev, timer, toggleTimer, sessionSec, sessionPaused, setSessionPaused, applyTheme, toast } = useApp();
  void rev;
  const [notifOpen, setNotifOpen] = useState(false);
  const [seen, setSeen] = useState(0);

  const p = profile();
  const h = new Date().getHours();
  const greeting = (h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar") + ", " + p.name;
  const [title, sub] = PAGES[currentPage] || ["KÖPRÜ", "Odaklan. İlerle. Köprü kur."];
  const notifs = get("notifs", []);
  const focusActive = timer.running || timer.sec < timer.total;
  const dark = document.body.classList.contains("dark");

  const when = (ts) => {
    const dk = Math.round((Date.now() - ts) / 60000);
    return dk < 1 ? "Şimdi" : dk < 60 ? dk + " dk önce" : Math.round(dk / 60) + " sa önce";
  };

  return (
    <header className="topbar">
      <div className="titles">
        <h1>
          <span>{title || greeting}</span>{" "}
          <svg className="anchor" width="22" height="22"><use href="#i-anchor" /></svg>
        </h1>
        <div className="sub">{sub}</div>
      </div>

      <div className="top-actions">
        <button className="iconbtn" aria-label="Bildirimler"
          onClick={() => { setNotifOpen(!notifOpen); setSeen(notifs.length); }}>
          <svg width="19" height="19"><use href="#i-bell" /></svg>
          {notifs.length > seen && <span className="dot"></span>}
        </button>

        <button className="iconbtn" aria-label="Tema değiştir"
          onClick={() => { applyTheme(dark ? "light" : "dark"); toast("Tema: " + (dark ? "Açık" : "Koyu")); }}>
          <svg width="19" height="19"><use href={dark ? "#i-sun" : "#i-moon"} /></svg>
        </button>

        <div className="top-sep"></div>

        <div className="session-chip">
          <svg width="21" height="21"><use href="#i-clock" /></svg>
          <div>
            <div className="lbl">{focusActive ? (timer.isBreak ? "ARA SÜRESİ" : "ODAK SÜRESİ") : "OTURUM SÜRESİ"}</div>
            <div className="time">{focusActive ? fmt(timer.sec) : fmtH(sessionSec)}</div>
          </div>
          <button aria-label="Duraklat" onClick={() => {
            if (focusActive) toggleTimer();
            else { setSessionPaused(!sessionPaused); toast(sessionPaused ? "Oturum sayacı devam ediyor" : "Oturum sayacı duraklatıldı"); }
          }}>
            <svg width="14" height="14">
              <use href={(focusActive ? timer.running : !sessionPaused) ? "#i-pause" : "#i-play"} />
            </svg>
          </button>
        </div>
      </div>

      {currentPage !== "home" && <img className="top-boat" src="assets/img/boat_topright.png" alt="" />}

      {notifOpen && (
        <div className="notif-menu">
          <h4>Bildirimler</h4>
          <div>
            {notifs.length === 0 && <div className="notif-empty">Henüz bildirim yok.</div>}
            {notifs.map((n, i) => {
              const [bg, fg, ic] = NOTIF_ICONS[n.icon] || NOTIF_ICONS.flame;
              return (
                <div className="notif-item" key={i}>
                  <div className="ic" style={{ background: bg, color: fg }}>
                    <svg width="17" height="17"><use href={`#${ic}`} /></svg>
                  </div>
                  <div>
                    <div className="t">{n.t}</div>
                    <div className="d">{n.d} · {when(n.ts)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

export default Topbar;
