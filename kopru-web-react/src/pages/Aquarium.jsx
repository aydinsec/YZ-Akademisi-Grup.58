/* ============================================================
   KÖPRÜ — Akvaryum
   Odak seanslarında kazanılan balıklar burada yüzer.
   Yüzme alanı tankın iç sınırlarıdır: her balık kendi şeridinde
   (rastgele ama sabit derinlik/hız/yön) gidip gelir, cama çarpınca döner.
   ============================================================ */
import { useState, useMemo } from "react";
import { useApp } from "../state/AppContext.jsx";
import { RAR_LBL } from "../utils/config.js";
import { fmtMin, trDate, iso, fishSrc } from "../utils/helpers.js";

/* Nadirliğe göre balık boyutu (tank yüksekliğinin yüzdesi olarak taban) */
const TIER_SIZE = { yaygin: 74, orta: 88, nadir: 104, efsanevi: 124 };

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

  /* Yörüngeler: balıkları derinlik şeritlerine dağıt (üst üste binmesinler) */
  const yuzucu = useMemo(() => {
    const n = fish.length || 1;
    const serit = 74 / n;                       /* tankın %6-%80 aralığı */
    return fish.map((f, i) => {
      const jitter = seeded(f.id, 1);
      const size = (TIER_SIZE[f.tier] || 80) * (0.85 + seeded(f.id, 5) * 0.3);
      const dur = 18 + seeded(f.id, 2) * 20;         /* 18-38 sn: bir uçtan bir uca */
      return {
        f,
        size,
        gen: size * 1.7,                             /* yaklaşık balık genişliği */
        top: 6 + i * serit + jitter * serit * 0.65,  /* şerit içinde küçük kayma */
        dur,
        delay: -(seeded(f.id, 3) * dur * 2),         /* gidiş-dönüş periyoduyla senkron */
        bob: 4 + seeded(f.id, 4) * 7,                /* dikey salınım */
        bobDur: (2.6 + seeded(f.id, 7) * 2.6).toFixed(1),
        sag: seeded(f.id, 6) > 0.5,                  /* başlangıç yönü */
      };
    });
  }, [fish]);

  return (
    <section className="page" id="page-aquarium">
      <div className={"aq-tank" + (paused ? " paused" : "")}>
        <img className="aq-bg" src="assets/img/aquarium_bg.jpg" alt="" />

        {/* Yüzme alanı — tankın camları arasında kalan bölge */}
        <div className="aq-swim">
          {yuzucu.map(({ f, size, gen, top, dur, delay, bob, bobDur, sag }, i) => (
            <div
              key={f.id}
              className={"aq-lane" + (sag ? " sag" : "")}
              style={{
                top: top + "%",
                width: `calc(100% - ${gen}px)`,
                animationDuration: dur + "s",
                animationDelay: delay + "s",
                zIndex: 3 + (i % 5),
              }}
            >
              <button
                className="aq-fish"
                style={{ height: size + "px", "--bob": bob + "px", "--bobdur": bobDur + "s" }}
                onClick={() => setSelected(f)}
                title={f.name || t("İsimsiz")}
              >
                <img src={fishSrc(f.file)} alt={f.name || "Balık"} loading="lazy"
                  style={{ animationDuration: dur * 2 + "s", animationDelay: delay + "s" }} />
                {f.name && <span className="aq-name">{f.name}</span>}
              </button>
            </div>
          ))}
        </div>

        {/* Baloncuklar — canlılık için */}
        <div className="aq-bubbles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{
              left: (6 + ((i * 37) % 88)) + "%",
              width: (5 + (i % 4) * 3) + "px",
              animationDuration: (7 + (i % 5) * 2.5) + "s",
              animationDelay: (-i * 1.4) + "s",
            }} />
          ))}
        </div>

        {fish.length === 0 && (
          <div className="aq-empty">
            <svg width="44" height="44"><use href="#i-fish" /></svg>
            <div className="t">{t("Akvaryumun henüz boş")}</div>
            <div className="d">{t("Bir odak seansını tamamla; denizden gelen ilk balığın burada yüzmeye başlasın.")}</div>
          </div>
        )}

        <div className="aq-hud">
          <div className="aq-hud-l">
            <span className="aq-chip"><svg width="14" height="14"><use href="#i-fish" /></svg> {fish.length} {t("balık")}</span>
            <span className="aq-chip"><svg width="14" height="14"><use href="#i-clock" /></svg> {fmtMin(totalMin)}</span>
          </div>
          <button className="aq-chip aq-btn" onClick={() => setPaused(!paused)} title={paused ? t("Devam Et") : t("Duraklat")}>
            <svg width="14" height="14"><use href={paused ? "#i-play" : "#i-pause"} /></svg>
          </button>
        </div>

        <div className="aq-legend">
          {Object.entries(byTier).map(([k, n]) => (
            <span key={k} className={"aq-leg " + k}><i /> {t(RAR_LBL[k])} <b>{n}</b></span>
          ))}
        </div>

        {selected && (
          <div className="aq-card" onClick={() => setSelected(null)}>
            <img src={fishSrc(selected.file)} alt="" />
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
