import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { iso, fmt, fmtMin, weekDays } from "../utils/helpers.js";

function streak(sessions) {
  const days = new Set(sessions.map((s) => s.date));
  let best = 0, cur = 0;
  const d = new Date(); d.setDate(d.getDate() - 365);
  for (let i = 0; i <= 366; i++) { const k = iso(d); cur = days.has(k) ? cur + 1 : 0; best = Math.max(best, cur); d.setDate(d.getDate() + 1); }
  return best;
}

const PRESETS = [
  [25, "Odak", true],
  [15, "Kısa Ara", false],
  [50, "Odak", false],
  [20, "Uzun Ara", false],
];

function Home({ setCurrentPage }) {
  const { get, set, rev, timer, toggleTimer, setDuration, setMode, addXp, toast, C } = useApp();
  void rev;
  const [custom, setCustom] = useState(false);
  const [customMin, setCustomMin] = useState(30);
  const [customType, setCustomType] = useState("focus");

  const sessions = get("sessions", []);
  const fish = get("fish", []);
  const tasks = get("tasks", []);
  const today = iso();
  const todaySes = sessions.filter((s) => s.date === today);
  const fishToday = fish.filter((f) => f.date === today);
  const starts = get("starts", {})[today] || 0;
  const rate = starts ? Math.min(100, Math.round((todaySes.length / starts) * 100)) : todaySes.length ? 100 : 0;
  const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);
  const three = tasks.filter((t) => t.group === "today").slice(0, 3);
  void weekDays;

  const toggleTask = (id, done) => {
    const a = get("tasks", []);
    const t = a.find((x) => x.id === id);
    t.done = done;
    if (done) { t.doneAt = today; addXp(C.XP_GOREV); toast(`"${t.name}" tamamlandı! +${C.XP_GOREV} XP 🎉`); }
    set("tasks", a);
  };

  return (
    <section className="page" id="page-home">
      <div className="home-left">
        {/* === SAYAÇ (Odak Modu ile ortak) === */}
        <div className="hero">
          <div>
            <div className="inner">
              <div className="tag"><svg width="20" height="20"><use href="#i-waves" /></svg> Odak Zamanı</div>
              <div className="clock">{fmt(timer.sec)}</div>
              <div className="select mode-dd">
                <select value={timer.mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="derin">Derin Odak</option>
                  <option value="orta">Orta Odak</option>
                  <option value="hafif">Hafif Odak</option>
                </select>
              </div>
              <br />
              <button className="btn-red" onClick={toggleTimer}>
                <svg width="17" height="17"><use href={timer.running ? "#i-pause" : "#i-play"} /></svg>
                <span>{timer.running ? "Duraklat" : timer.sec < timer.total ? "Devam Et" : "Odak Modunu Başlat"}</span>
              </button>
            </div>

            <div className="presets">
              {PRESETS.map(([min, type, dot]) => (
                <button key={min} className={`preset ${timer.total === min * 60 ? "sel" : ""}`}
                  onClick={() => { setDuration(min, type.includes("Ara")); toast(min + " dk " + type.toLowerCase() + " ayarlandı"); }}>
                  {dot && <span className="reddot"></span>}
                  <div className="a">{min} dk</div>
                  <div className="b">{type}</div>
                </button>
              ))}
              <button className="preset" onClick={() => setCustom(true)}>
                <div className="a" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15"><use href="#i-sliders" /></svg> Özelleştir
                </div>
              </button>
            </div>
          </div>
          <div className="art"><img src="assets/img/hero_sun.png" alt="Gün doğumunda balıkçı teknesi" /></div>
        </div>

        {/* === BİLGİ KARTLARI === */}
        <div className="home-grid">
          <div className="card">
            <div className="card-h">
              <div className="l"><svg width="18" height="18"><use href="#i-check-sq" /></svg> Günün Görevleri</div>
              <button className="link" onClick={() => setCurrentPage("tasks")}>Tümünü Gör</button>
            </div>
            {three.length === 0 && (
              <div style={{ padding: "14px 20px", color: "var(--muted)", fontSize: "13px" }}>Bugün için görev yok.</div>
            )}
            {three.map((t) => (
              <div className="mini-task" key={t.id}>
                <input type="checkbox" className="circle-chk" checked={t.done} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                <div>
                  <div className={"nm" + (t.done ? " done" : "")}>{t.name}</div>
                  <div className="mt">Odak {t.dur} dk</div>
                </div>
              </div>
            ))}
            <button className="add-mini" onClick={() => setCurrentPage("tasks")}>
              <svg width="15" height="15"><use href="#i-plus" /></svg> Yeni görev ekle
            </button>
          </div>

          <div className="card">
            <div className="card-h">
              <div className="l"><svg width="18" height="18"><use href="#i-fish" /></svg> Yakalamalarım</div>
              <button className="link" onClick={() => setCurrentPage("catches")}>Tümünü Gör</button>
            </div>
            <div className="fish-big">
              <div className="cir">
                {fish[0]
                  ? <img src={`assets/fish/${fish[0].file}`} alt="" />
                  : <svg width="34" height="34" style={{ color: "var(--teal)" }}><use href="#i-fish" /></svg>}
              </div>
              <div>
                <div className="n">{fishToday.length}</div>
                <div className="d">Bugünkü yakalaman</div>
              </div>
            </div>
            <div className="two-stats">
              <div><div className="k">Toplam Balık</div><div className="v">{fish.length}</div></div>
              <div><div className="k">En Büyük Seri</div><div className="v">{streak(sessions)} gün</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div className="l"><svg width="18" height="18"><use href="#i-chart" /></svg> İstatistikler</div>
              <button className="link" onClick={() => setCurrentPage("stats")}>Bu Hafta</button>
            </div>
            <div className="donut-wrap">
              <svg className="donut" width="120" height="120">
                <circle className="bgc" cx="60" cy="60" r="50" strokeWidth="11" />
                <circle className="fgc" cx="60" cy="60" r="50" strokeWidth="11"
                  strokeDasharray="314.16" strokeDashoffset={String(314.16 * (1 - rate / 100))} />
              </svg>
              <div className="donut-c"><div className="p">%{rate}</div><div className="s">Odaklanma<br />Oranın</div></div>
            </div>
            <div className="two-stats">
              <div><div className="k">Toplam Odak</div><div className="v">{fmtMin(totalMin)}</div></div>
              <div><div className="k">Tamamlanan Görev</div><div className="v">{tasks.filter((t) => t.done).length}</div></div>
            </div>
          </div>
        </div>

        <div className="banner" style={{ marginTop: "24px" }}>
          <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
          <div>
            <div className="t">Köprünü kur</div>
            <div className="d">Odaklan, yakala, ilerle.<br />Küçük adımlar büyük rotalar çizer.</div>
          </div>
          <img className="art" src="assets/img/lighthouse_banner.png" alt="" />
        </div>
      </div>

      <div className="side-photo">
        <img src="assets/img/side_photo.png" alt="Denizde balıkçı teknesi" />
      </div>

      {custom && (
        <Modal title="Süreyi Özelleştir" onClose={() => setCustom(false)}>
          <label className="f-label">Süre (dakika)</label>
          <input className="f-input" type="number" min="1" max="180" value={customMin}
            onChange={(e) => setCustomMin(e.target.value)} />
          <label className="f-label">Tür</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={customType} onChange={(e) => setCustomType(e.target.value)}>
              <option value="focus">Odak</option>
              <option value="break">Ara</option>
            </select>
          </div>
          <div className="actions">
            <button className="btn-outline" onClick={() => setCustom(false)}>Vazgeç</button>
            <button className="btn-navy" onClick={() => {
              const m = Math.max(1, Math.min(180, parseInt(customMin) || 25));
              setDuration(m, customType === "break");
              setCustom(false);
              toast(m + " dk ayarlandı");
            }}>Uygula</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default Home;
