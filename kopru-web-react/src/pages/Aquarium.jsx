/* ============================================================
   KÖPRÜ — Akvaryum
   Odak seanslarında kazanılan balıklar burada yüzer.
   Her balığın yörüngesi (derinlik, hız, yön, boyut) kimliğinden
   türetilir; böylece her balık hep kendi rotasında yüzer.
   ============================================================ */
import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import { RAR_LBL } from "../utils/config.js";
import { fmtMin, trDate, iso } from "../utils/helpers.js";

/* Nadirliğe göre görsel ayar: boyut çarpanı ve halka rengi */
const TIER_STYLE = {
  yaygin: { size: 64, ring: "rgba(255,255,255,.55)", glow: "rgba(255,255,255,.25)" },
  orta: { size: 74, ring: "rgba(232,183,109,.85)", glow: "rgba(232,183,109,.35)" },
  nadir: { size: 84, ring: "rgba(139,124,224,.9)", glow: "rgba(139,124,224,.45)" },
  efsanevi: { size: 96, ring: "rgba(255,190,80,1)", glow: "rgba(255,170,60,.6)" },
};

/* id'den sabit sözde-rastgele sayı (0-1) — balık her açılışta aynı rotada yüzsün */
function seeded(id, salt) {
  const x = Math.sin(id * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

export default function Aquarium() {
  const { get, rev, t } = useApp();
  void rev;
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);

  const fish = get("fish", []);
  const sessions = get("sessions", []);
  const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);
  const byTier = { yaygin: 0, orta: 0, nadir: 0, efsanevi: 0 };
  fish.forEach((f) => { byTier[f.tier] = (byTier[f.tier] || 0) + 1; });

  return (
    <section className="page" id="page-aquarium">
      <div className={"aq-tank" + (paused ? " paused" : "")}>
        <img className="aq-bg" src="assets/img/aquarium_bg.jpg" alt="" />
        <div className="aq-glass" />

        {/* Yüzen balıklar */}
        <div className="aq-swim">
          {fish.map((f, i) => {
            const st = TIER_STYLE[f.tier] || TIER_STYLE.yaygin;
            const top = 12 + seeded(f.id, 1) * 62;          // %12 - %74 derinlik
            const dur = 26 + seeded(f.id, 2) * 26;           // 26-52 sn tur süresi
            const delay = -seeded(f.id, 3) * dur;            // rastgele başlangıç
            const bob = 3 + seeded(f.id, 4) * 5;             // dalgalanma yüksekliği
            const scale = 0.85 + seeded(f.id, 5) * 0.3;
            const reverse = seeded(f.id, 6) > 0.5;           // sağa/sola
            return (
              <button
                key={f.id}
                className={"aq-fish" + (reverse ? " rev" : "")}
                style={{
                  top: top + "%",
                  width: st.size * scale + "px",
                  height: st.size * scale + "px",
                  animationDuration: dur + "s",
                  animationDelay: delay + "s",
                  zIndex: 3 + (i % 4),
                  "--ring": st.ring,
                  "--glow": st.glow,
                  "--bob": bob + "px",
                  "--bobdur": (3 + seeded(f.id, 7) * 3).toFixed(1) + "s",
                }}
                onClick={() => setSelected(f)}
                title={f.name || t("İsimsiz")}
              >
                <span className="aq-fish-in">
                  <img src={`assets/fish/${f.file}`} alt={f.name || "Balık"} loading="lazy" />
                </span>
                {f.name && <span className="aq-name">{f.name}</span>}
              </button>
            );
          })}
        </div>

        {/* Boş akvaryum */}
        {fish.length === 0 && (
          <div className="aq-empty">
            <svg width="44" height="44"><use href="#i-fish" /></svg>
            <div className="t">{t("Akvaryumun henüz boş")}</div>
            <div className="d">{t("Bir odak seansını tamamla; denizden gelen ilk balığın burada yüzmeye başlasın.")}</div>
          </div>
        )}

        {/* Üst bilgi şeridi */}
        <div className="aq-hud">
          <div className="aq-hud-l">
            <span className="aq-chip"><svg width="14" height="14"><use href="#i-fish" /></svg> {fish.length} {t("balık")}</span>
            <span className="aq-chip"><svg width="14" height="14"><use href="#i-clock" /></svg> {fmtMin(totalMin)}</span>
          </div>
          <button className="aq-chip aq-btn" onClick={() => setPaused(!paused)} title={paused ? t("Devam Et") : t("Duraklat")}>
            <svg width="14" height="14"><use href={paused ? "#i-play" : "#i-pause"} /></svg>
          </button>
        </div>

        {/* Nadirlik sayacı */}
        <div className="aq-legend">
          {Object.entries(byTier).map(([k, n]) => (
            <span key={k} className={"aq-leg " + k}><i /> {t(RAR_LBL[k])} <b>{n}</b></span>
          ))}
        </div>

        {/* Seçilen balığın kartı */}
        {selected && (
          <div className="aq-card" onClick={() => setSelected(null)}>
            <img src={`assets/fish/${selected.file}`} alt="" />
            <div className="aq-card-b">
              <div className="nm">{selected.name || <span className="noname">{t("İsimsiz")}</span>}</div>
              <div className={"rar " + selected.tier}><i></i> {t(RAR_LBL[selected.tier])}</div>
              <div className="meta">
                <span><svg width="13" height="13"><use href="#i-clock" /></svg> {fmtMin(selected.minutes)}</span>
                <span><svg width="13" height="13"><use href="#i-cal" /></svg> {trDate(selected.date)}</span>
              </div>
            </div>
            <button className="dots-btn" aria-label={t("Kapat")}><svg width="15" height="15"><use href="#i-x" /></svg></button>
          </div>
        )}
      </div>

      <div className="banner" style={{ marginTop: "24px" }}>
        <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
        <div>
          <div className="t">{t("Koleksiyonun büyüdükçe akvaryum şenlenir")}</div>
          <div className="d">
            {t("Bugün")}: {fish.filter((f) => f.date === iso()).length} {t("balık")} ·{" "}
            {t("Uzun seanslar daha nadir balıklar getirir.")}
          </div>
        </div>
        <img className="art" src="assets/img/waves_banner.png" alt="" />
      </div>
    </section>
  );
}
