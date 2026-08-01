import { useState, useMemo } from "react";
import { useApp } from "../state/AppContext.jsx";
import { RAR_LBL } from "../utils/config.js";
import { fmtMin, trDate, iso, fishSrc } from "../utils/helpers.js";

const TIER_SIZE = { yaygin: 74, orta: 88, nadir: 104, efsanevi: 124 };

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
  fish.forEach((f) => {
    byTier[f.tier] = (byTier[f.tier] || 0) + 1;
  });

  const yuzucu = useMemo(() => {
    const yuzenler = fish.filter((f) => f.movement !== "still");
    const sabitler = fish.filter((f) => f.movement === "still");
    const n = yuzenler.length || 1;
    const serit = 70 / n;
    const yuzenSonuc = yuzenler.map((f, i) => {
      const jitter = seeded(f.id, 1);
      const size = (TIER_SIZE[f.tier] || 80) * (0.85 + seeded(f.id, 5) * 0.3);
      const dur = 18 + seeded(f.id, 2) * 20;
      return {
        f,
        size,
        gen: size * 1.7,
        top: 6 + i * serit + jitter * serit * 0.65,
        dur,
        delay: -(seeded(f.id, 3) * dur),
        bob: 4 + seeded(f.id, 4) * 7,
        bobDur: (2.6 + seeded(f.id, 7) * 2.6).toFixed(1),
        sag: seeded(f.id, 6) > 0.5,
        still: false,
      };
    });
    const sabitSonuc = sabitler.map((f, i) => ({
      f,
      size: (TIER_SIZE[f.tier] || 80) * 0.5,
      gen: 0,
      top: 80 + (i % 3) * 4,
      left: 6 + seeded(f.id, 8) * 82,
      dur: 1,
      delay: 0,
      bob: 2,
      bobDur: (3.5 + seeded(f.id, 7) * 2).toFixed(1),
      sag: seeded(f.id, 6) > 0.5,
      still: true,
    }));
    return [...yuzenSonuc, ...sabitSonuc];
  }, [fish]);

  return (
    <section className="page" id="page-aquarium">
      <style>{`
        .aq-swim { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; }
        .aq-lane { position: absolute; left: 0; }
        .aq-fish { position: absolute; display: flex; flex-direction: column; align-items: center; background: transparent; border: none; cursor: pointer; left: 0; }
        
        .aq-lane:not(.still) .aq-fish {
          animation: swim-x var(--dur) linear var(--delay) infinite alternate, bob-y var(--bobdur) ease-in-out infinite alternate;
        }
        .aq-lane.sag:not(.still) .aq-fish { animation-direction: alternate-reverse, alternate; }
        
        @keyframes swim-x { 0% { left: 0%; } 100% { left: 100%; } }
        @keyframes bob-y { 0% { transform: translateY(calc(var(--bob) * -1)); } 100% { transform: translateY(var(--bob)); } }
        
        .aq-lane:not(.still) img { 
          animation: flip-x calc(var(--dur) * 2) steps(1) var(--delay) infinite; 
        }
        .aq-lane.sag:not(.still) img { animation-direction: reverse; }
        
        @keyframes flip-x { 
          0%, 100% { transform: scaleX(1); } 
          50%      { transform: scaleX(-1); }  
        }
        
        .aq-lane.still .aq-fish { animation: bob-y var(--bobdur) ease-in-out infinite alternate; }
        .aq-tank.paused .aq-fish, .aq-tank.paused .aq-fish img { animation-play-state: paused !important; }
      `}</style>

      <div className={"aq-tank" + (paused ? " paused" : "")}>
        <img className="aq-bg" src="assets/img/aquarium_bg.jpg" alt="" />

        <div className="aq-swim">
          {yuzucu.map(
            (
              { f, size, gen, top, left, dur, delay, bob, bobDur, sag, still },
              i,
            ) => (
              <div
                key={f.id}
                className={
                  "aq-lane" + (sag ? " sag" : "") + (still ? " still" : "")
                }
                style={{
                  top: top + "%",
                  ...(still
                    ? { left: left + "%", width: "auto" }
                    : { width: `calc(100% - ${gen}px)` }),
                  "--dur": dur + "s",
                  "--delay": delay + "s",
                  zIndex: 3 + (i % 5),
                }}
              >
                <button
                  className="aq-fish"
                  style={{
                    height: size + "px",
                    "--bob": bob + "px",
                    "--bobdur": bobDur + "s",
                  }}
                  onClick={() => setSelected(f)}
                  title={f.name || t("İsimsiz")}
                >
                  <img
                    src={fishSrc(f.file)}
                    alt={f.name || "Balık"}
                    loading="lazy"
                  />
                  {f.name && <span className="aq-name">{f.name}</span>}
                </button>
              </div>
            ),
          )}
        </div>

        <div className="aq-bubbles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: 6 + ((i * 37) % 88) + "%",
                width: 5 + (i % 4) * 3 + "px",
                animationDuration: 7 + (i % 5) * 2.5 + "s",
                animationDelay: -i * 1.4 + "s",
              }}
            />
          ))}
        </div>

        {fish.length === 0 && (
          <div className="aq-empty">
            <svg width="44" height="44">
              <use href="#i-fish" />
            </svg>
            <div className="t">{t("Akvaryumun henüz boş")}</div>
            <div className="d">
              {t(
                "Bir odak seansını tamamla; denizden gelen ilk balığın burada yüzmeye başlasın.",
              )}
            </div>
          </div>
        )}

        <div className="aq-hud">
          <div className="aq-hud-l">
            <span className="aq-chip">
              <svg width="14" height="14">
                <use href="#i-fish" />
              </svg>{" "}
              {fish.length} {t("balık")}
            </span>
            <span className="aq-chip">
              <svg width="14" height="14">
                <use href="#i-clock" />
              </svg>{" "}
              {fmtMin(totalMin)}
            </span>
          </div>
          <button
            className="aq-chip aq-btn"
            onClick={() => setPaused(!paused)}
            title={paused ? t("Devam Et") : t("Duraklat")}
          >
            <svg width="14" height="14">
              <use href={paused ? "#i-play" : "#i-pause"} />
            </svg>
          </button>
        </div>

        <div className="aq-legend">
          {Object.entries(byTier).map(([k, n]) => (
            <span key={k} className={"aq-leg " + k}>
              <i /> {t(RAR_LBL[k])} <b>{n}</b>
            </span>
          ))}
        </div>

        {selected && (
          <div className="aq-card" onClick={() => setSelected(null)}>
            <img src={fishSrc(selected.file)} alt="" />
            <div className="aq-card-b">
              <div className="nm">
                {selected.name || (
                  <span className="noname">{t("İsimsiz")}</span>
                )}
              </div>
              <div className={"rar " + selected.tier}>
                <i></i> {t(RAR_LBL[selected.tier])}
              </div>
              <div className="meta">
                <span>
                  <svg width="13" height="13">
                    <use href="#i-clock" />
                  </svg>{" "}
                  {fmtMin(selected.minutes)}
                </span>
                <span>
                  <svg width="13" height="13">
                    <use href="#i-cal" />
                  </svg>{" "}
                  {trDate(selected.date)}
                </span>
              </div>
            </div>
            <button className="dots-btn" aria-label={t("Kapat")}>
              <svg width="15" height="15">
                <use href="#i-x" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="banner" style={{ marginTop: "24px" }}>
        <div className="ic">
          <svg width="24" height="24">
            <use href="#i-anchor" />
          </svg>
        </div>
        <div>
          <div className="t">
            {t("Koleksiyonun büyüdükçe akvaryum şenlenir")}
          </div>
          <div className="d">
            {t("Bugün")}: {fish.filter((f) => f.date === iso()).length}{" "}
            {t("balık")} · {t("Uzun seanslar daha nadir balıklar getirir.")}
          </div>
        </div>
        <img className="art" src="assets/img/waves_banner.png" alt="" />
      </div>
    </section>
  );
}
