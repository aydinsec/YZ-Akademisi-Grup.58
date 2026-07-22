import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import { MODE_META } from "../utils/config.js";
import { iso, fmtMin, weekDays, delta, GUNLER } from "../utils/helpers.js";

function streak(sessions) {
  const days = new Set(sessions.map((s) => s.date));
  let best = 0, cur = 0;
  const d = new Date(); d.setDate(d.getDate() - 365);
  for (let i = 0; i <= 366; i++) { const k = iso(d); cur = days.has(k) ? cur + 1 : 0; best = Math.max(best, cur); d.setDate(d.getDate() + 1); }
  return best;
}

export default function Stats() {
  const { get, profile, rev, toast } = useApp();
  void rev;
  const [range, setRange] = useState(0); // 0 bu hafta, -1 geçen hafta
  const [unit, setUnit] = useState("saat");
  const [tab, setTab] = useState("genel");

  const sessions = get("sessions", []);
  const tasks = get("tasks", []);
  const fish = get("fish", []);
  const starts = get("starts", {});
  const wk = weekDays(range), prevWk = weekDays(range - 1);
  const inWk = sessions.filter((s) => wk.includes(s.date));
  const inPrev = sessions.filter((s) => prevWk.includes(s.date));
  const min = inWk.reduce((a, s) => a + s.minutes, 0);
  const pmin = inPrev.reduce((a, s) => a + s.minutes, 0);
  const doneT = tasks.filter((t) => t.done && t.doneAt && wk.includes(t.doneAt)).length;
  const pDoneT = tasks.filter((t) => t.done && t.doneAt && prevWk.includes(t.doneAt)).length;

  /* çubuk grafik verisi */
  const barData = wk.map((d, i) => {
    const list = sessions.filter((s) => s.date === d);
    return [GUNLER[i], unit === "saat" ? list.reduce((a, s) => a + s.minutes, 0) / 60 : list.length];
  });
  const rawMax = Math.max(...barData.map((d) => d[1]), unit === "saat" ? 1 : 4);
  const max = Math.max(1, Math.ceil(rawMax));
  const avg = barData.reduce((a, d) => a + d[1], 0) / 7;

  /* tür dağılımı */
  const byMode = { derin: 0, orta: 0, hafif: 0 };
  inWk.forEach((s) => { byMode[s.mode] = (byMode[s.mode] || 0) + s.minutes; });
  const tot = byMode.derin + byMode.orta + byMode.hafif;
  const R = 58, CIR = 2 * Math.PI * R;
  let acc = -90;
  const segs = Object.entries(MODE_META).map(([k, [, , col]]) => {
    const frac = tot ? byMode[k] / tot : 0;
    const seg = frac > 0 ? { col, dash: (frac * CIR).toFixed(1) + " " + CIR.toFixed(1), rot: acc } : null;
    acc += frac * 360;
    return seg;
  }).filter(Boolean);

  /* başarı çizgisi */
  const pts = wk.map((d, i) => {
    const done = sessions.filter((s) => s.date === d).length;
    const st = starts[d] || 0;
    const rate = st ? Math.min(1, done / st) : done ? 1 : 0;
    return [40 + i * 62, 180 - rate * 168];
  });

  /* ısı haritası */
  const buckets = [[0, 6], [6, 12], [12, 18], [18, 24]];
  const lvls = buckets.map(([a, b]) => wk.map((d) => sessions.filter((s) => s.date === d && s.hour >= a && s.hour < b).reduce((x, s) => x + s.minutes, 0)));
  const maxCell = Math.max(1, ...lvls.flat());

  const dlReport = () => {
    const r = [
      "KÖPRÜ — Haftalık Odak Raporu", "Kaptan: " + profile().name, "",
      "Toplam Odak Süresi: " + fmtMin(min),
      "Tamamlanan Seans: " + inWk.length,
      "Tamamlanan Görev: " + doneT,
      "En Uzun Seri: " + streak(sessions) + " gün",
      "Yakalanan Balık: " + fish.length, "",
      "Günlük Dağılım:",
      ...wk.map((d, i) => "  " + GUNLER[i] + " (" + d + "): " + fmtMin(sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0))),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([r], { type: "text/plain;charset=utf-8" }));
    a.download = "kopru-haftalik-rapor.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Rapor indirildi 📄");
  };

  return (
    <section className="page" id="page-stats">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div className="tabs" style={{ flex: 1, marginBottom: "24px" }}>
          {[["genel", "Genel Bakış"], ["sure", "Odak Süresi"], ["seans", "Seanslar"], ["aliskanlik", "Alışkanlıklar"], ["basari", "Başarılar"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="select" style={{ marginBottom: "14px" }}>
          <select value={range} onChange={(e) => setRange(+e.target.value)}>
            <option value={0}>Bu Hafta</option>
            <option value={-1}>Geçen Hafta</option>
          </select>
        </div>
      </div>

      <div className="stat-cards">
        <div className="card stat-card">
          <div className="top"><span className="ico" style={{ background: "var(--blue-soft)", color: "var(--teal)" }}><svg width="19" height="19"><use href="#i-clock" /></svg></span> Toplam Odak Süresi</div>
          <div className="v">{fmtMin(min)}</div><div className="delta">{delta(min, pmin)}</div>
        </div>
        <div className="card stat-card">
          <div className="top"><span className="ico" style={{ background: "var(--green-soft)", color: "var(--green)" }}><svg width="19" height="19"><use href="#i-target" /></svg></span> Tamamlanan Seans</div>
          <div className="v">{inWk.length}</div><div className="delta">{delta(inWk.length, inPrev.length)}</div>
        </div>
        <div className="card stat-card">
          <div className="top"><span className="ico" style={{ background: "var(--blue-soft)", color: "var(--teal)" }}><svg width="19" height="19"><use href="#i-check-c" /></svg></span> Tamamlanan Görev</div>
          <div className="v">{doneT}</div><div className="delta">{delta(doneT, pDoneT)}</div>
        </div>
        <div className="card stat-card">
          <div className="top"><span className="ico" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}><svg width="19" height="19"><use href="#i-flame" /></svg></span> En Uzun Seri</div>
          <div className="v">{streak(sessions)} gün</div><div className="delta">{streak(sessions) ? "↗ Devam et!" : ""}</div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="card">
            <div className="card-h">
              <div className="l">Günlük Odak Süresi</div>
              <div className="select">
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="saat">Süre (saat)</option>
                  <option value="seans">Seans sayısı</option>
                </select>
              </div>
            </div>
            <div className="chart-pad">
              <div className="bars">
                <div className="gridlines">
                  {[0, 1, 2, 3, 4].map((i) => {
                    const val = max - (max / 4) * i;
                    return (
                      <div className="gl" key={i} style={{ top: i * 25 + "%" }}>
                        <span>{unit === "saat" ? (val % 1 ? val.toFixed(1) : val) + " sa" : Math.round(val)}</span>
                      </div>
                    );
                  })}
                </div>
                {avg > 0 && (
                  <div className="avg-line" style={{ bottom: 22 + (avg / max) * 200 + "px" }}>
                    <span>{unit === "saat" ? "Ortalama " + fmtMin(avg * 60) : "Ortalama " + avg.toFixed(1)}</span>
                  </div>
                )}
                {barData.map(([l, v]) => (
                  <div className="bar-col" key={l}>
                    <div className="b" style={{ height: Math.max(3, Math.round((v / max) * 200)) + "px" }}>
                      <span className="tip">{unit === "saat" ? fmtMin(v * 60) : v + " seans"}</span>
                    </div>
                    <div className="lbl">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px", marginTop: "20px" }}>
            <div className="card">
              <div className="card-h"><div className="l">Odak Türlerine Göre Dağılım</div></div>
              <div style={{ padding: "16px 22px 22px" }}>
                {Object.entries(MODE_META).map(([k, [lbl, col]]) => {
                  const p = tot ? Math.round((byMode[k] / tot) * 100) : 0;
                  return (
                    <div className="hbar" key={k}>
                      <div className="t"><span>{lbl}</span><b>{p}%</b></div>
                      <div className="track"><i style={{ width: p + "%", background: col }}></i></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><div className="l">Günlere Göre Başarı Oranı</div></div>
              <div className="linechart">
                <svg viewBox="0 0 420 190" width="100%">
                  <g fontSize="10.5" fill="var(--muted2)">
                    <text x="4" y="16">100%</text><text x="12" y="58">75%</text><text x="12" y="100">50%</text><text x="12" y="142">25%</text><text x="18" y="184">0%</text>
                  </g>
                  <g stroke="var(--line)" strokeDasharray="3 4">
                    {[12, 54, 96, 138, 180].map((y) => <line key={y} x1="40" y1={y} x2="412" y2={y} />)}
                  </g>
                  <polyline fill="none" stroke="#1d5068" strokeWidth="2.5" strokeLinejoin="round"
                    points={pts.map((p) => p.join(",")).join(" ")} />
                  {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#1d5068" />)}
                  <g fontSize="10.5" fill="var(--muted)" textAnchor="middle">
                    {pts.map((p, i) => <text key={i} x={p[0]} y="188">{GUNLER[i]}</text>)}
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-h"><div className="l">Odak Dağılımı</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: "22px", padding: "16px 22px 22px" }}>
              <div className="donut-wrap" style={{ padding: 0 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {segs.length === 0 && <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />}
                  {segs.map((s, i) => (
                    <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={s.col} strokeWidth="12"
                      strokeDasharray={s.dash} transform={`rotate(${s.rot} 70 70)`} />
                  ))}
                </svg>
                <div className="donut-c">
                  <div className="p" style={{ fontSize: "19px" }}>{fmtMin(tot)}</div>
                  <div className="s">Toplam</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {Object.entries(MODE_META).map(([k, [lbl, , col]]) => {
                  const p = tot ? Math.round((byMode[k] / tot) * 100) : 0;
                  return (
                    <div className="legend-r" key={k}>
                      <span className="sq" style={{ background: col }}></span> {lbl}
                      <span className="pc">{p}%</span><span className="tm">{fmtMin(byMode[k])}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-h"><div className="l">Saatlere Göre Odaklanma</div></div>
            <div className="heat">
              <div></div>
              {GUNLER.map((g) => <div className="cl" key={g}>{g}</div>)}
              {buckets.map(([a], ri) => (
                [<div className="rl" key={"r" + ri}>{String(a).padStart(2, "0")}:00</div>,
                ...lvls[ri].map((v, ci) => (
                  <div key={ri + "-" + ci} title={fmtMin(v)}
                    className={"cell" + (v ? " l" + Math.min(4, Math.ceil((v / maxCell) * 4)) : "")}></div>
                ))]
              ))}
            </div>
            <div className="heat-legend">
              Düşük <i style={{ background: "var(--line-soft)" }}></i><i style={{ background: "#d7e7ed" }}></i>
              <i style={{ background: "#a9cbd8" }}></i><i style={{ background: "#5f97ac" }}></i>
              <i style={{ background: "#1d5068" }}></i> Yüksek
            </div>
          </div>

          <div className="praise" style={{ marginTop: "20px" }}>
            <div className="t">
              {min > 0 ? `Harika gidiyorsun, ${profile().name}!` : "Rotan açık, Kaptan!"}{" "}
              <svg width="17" height="17" style={{ color: "var(--red)" }}><use href="#i-anchor" /></svg>
            </div>
            <div className="d">
              {min > 0 ? `Bu hafta ${fmtMin(min)} odaklandın. Rüzgar arkanda!` : "Odak seanslarını tamamladıkça istatistiklerin burada birikecek."}
            </div>
            <button className="btn-outline" onClick={dlReport}>
              <svg width="16" height="16"><use href="#i-download" /></svg> Detaylı Raporu İndir
            </button>
            <img src="assets/img/lighthouse_big.png" alt="" />
          </div>
        </div>
      </div>

      <div className="banner" style={{ marginTop: "24px" }}>
        <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
        <div>
          <div className="t">İpucu</div>
          <div className="d">Düzenli odak seansları, uzun vadede büyük sonuçlar getirir. Küçük adımlar, büyük rotalar çizer.</div>
        </div>
        <img className="art" src="assets/img/waves_banner.png" alt="" />
      </div>
    </section>
  );
}
