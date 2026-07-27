import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { RAR_LBL } from "../utils/config.js";
import { iso, fmtMin, trDate, weekDays } from "../utils/helpers.js";

function streak(sessions) {
  const days = new Set(sessions.map((s) => s.date));
  let best = 0, cur = 0;
  const d = new Date(); d.setDate(d.getDate() - 365);
  for (let i = 0; i <= 366; i++) { const k = iso(d); cur = days.has(k) ? cur + 1 : 0; best = Math.max(best, cur); d.setDate(d.getDate() + 1); }
  return best;
}

export default function Catches() {
  const { get, set, toast, rev, t } = useApp();
  void rev;
  const [tab, setTab] = useState("all");
  const [filter, setFilter] = useState("all");
  const [rar, setRar] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("date");
  const [naming, setNaming] = useState(null);
  const [nameVal, setNameVal] = useState("");
  const [menuFor, setMenuFor] = useState(null);

  const fish = get("fish", []);
  const sessions = get("sessions", []);
  const catalog = window.FISH_CATALOG || [];
  const totMin = sessions.reduce((a, s) => a + s.minutes, 0);
  const wk = weekDays(0);

  const rename = () => {
    const a = get("fish", []);
    const f = a.find((x) => x.id === naming);
    if (f) { f.name = nameVal.trim(); f.isNew = false; set("fish", a); toast(f.name ? `"${f.name}" güncellendi 🐟` : "Balık kaydedildi"); }
    setNaming(null);
  };
  const release = (id) => { set("fish", fish.filter((x) => x.id !== id)); toast("Balık denize geri bırakıldı 🌊"); };

  let list = [...fish];
  if (tab === "rare") list = list.filter((f) => f.tier === "nadir" || f.tier === "efsanevi");
  if (filter === "today") list = list.filter((f) => f.date === iso());
  if (filter === "week") list = list.filter((f) => wk.includes(f.date));
  if (filter === "month") list = list.filter((f) => f.date.slice(0, 7) === iso().slice(0, 7));
  if (rar !== "all") list = list.filter((f) => f.tier === rar);
  if (q) list = list.filter((f) => (f.name || "isimsiz").toLowerCase().includes(q.toLowerCase()));
  if (sort === "name") list.sort((a, b) => (a.name || "zzz").localeCompare(b.name || "zzz", "tr"));
  else if (sort === "dur") list.sort((a, b) => b.minutes - a.minutes);
  else list.sort((a, b) => b.id - a.id);

  const caughtFiles = new Set(fish.map((f) => f.file));

  return (
    <section className="page" id="page-catches">
      <div className="card catch-hero">
        <div className="catch-sum">
          <h3 className="qs">{t("Yakalama Özeti")}</h3>
          <div className="catch-stats">
            <div className="catch-stat">
              <div className="ico"><svg width="18" height="18"><use href="#i-fish" /></svg></div>
              <div><div className="k">{t("Toplam Balık")}</div><div className="v">{fish.length}</div><div className="d">{fish.length ? t("Harika!") : ""}</div></div>
            </div>
            <div className="catch-stat">
              <div className="ico"><svg width="18" height="18"><use href="#i-clock" /></svg></div>
              <div><div className="k">{t("Toplam Odak Süresi")}</div><div className="v">{fmtMin(totMin)}</div></div>
            </div>
            <div className="catch-stat">
              <div className="ico"><svg width="18" height="18"><use href="#i-star" /></svg></div>
              <div><div className="k">{t("En Uzun Seri")}</div><div className="v">{streak(sessions)} {t("gün")}</div></div>
            </div>
            <div className="catch-stat">
              <div className="ico"><svg width="18" height="18"><use href="#i-waves" /></svg></div>
              <div><div className="k">{t("Ortalama Seans")}</div><div className="v">{sessions.length ? fmtMin(totMin / sessions.length) : "0dk"}</div></div>
            </div>
          </div>
        </div>
        <img className="ph" src="assets/img/catch_photo.png" alt="Gün batımında tekne" />
      </div>

      <div className="tabs">
        {[["all", "Balıklarım"], ["col", "Koleksiyon"], ["rare", "Nadir Balıklar"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>
        ))}
      </div>

      {tab !== "col" && (
        <div className="catch-toolbar">
          {[["all", "Tümü"], ["today", "Bugün"], ["week", "Bu Hafta"], ["month", "Bu Ay"]].map(([k, l]) => (
            <button key={k} className={"pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{t(l)}</button>
          ))}
          <div className="select">
            <select value={rar} onChange={(e) => setRar(e.target.value)}>
              <option value="all">{t("Tümü")}</option><option value="yaygin">{t("Yaygın")}</option>
              <option value="orta">{t("Orta")}</option><option value="nadir">{t("Nadir")}</option><option value="efsanevi">{t("Efsanevi")}</option>
            </select>
          </div>
          <div style={{ flex: 1 }}></div>
          <div className="searchbox">
            <svg width="16" height="16"><use href="#i-search" /></svg>
            <input placeholder={t("Ara...")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="select">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">{t("Tarihe Göre")}</option><option value="name">{t("İsme Göre")}</option><option value="dur">{t("Süreye Göre")}</option>
            </select>
          </div>
        </div>
      )}

      <div className="fish-grid">
        {tab === "col" ? (
          catalog.map((cf) => {
            const has = caughtFiles.has(cf.file);
            const mine = fish.filter((f) => f.file === cf.file);
            return (
              <div className="card fish-card" key={cf.file} style={has ? {} : { opacity: 0.45, filter: "grayscale(1)" }}>
                <div className="img"><img src={`assets/fish/${cf.file}`} alt="" loading="lazy" /></div>
                <div className="nm">{has ? (mine[0].name || <span className="noname">{t("İsimsiz")}</span>) : "???"}</div>
                <div className={"rar " + cf.tier}><i></i> {t(RAR_LBL[cf.tier])}{has && mine.length > 1 ? " · ×" + mine.length : ""}</div>
                <div className="meta"><span>{has ? t("Yakalandı") : t("Henüz yakalanmadı")}</span></div>
              </div>
            );
          })
        ) : list.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            {t("Burada balık yok. Bir odak seansı tamamla, denizden ilk balığın gelsin! 🎣")}
          </div>
        ) : (
          list.map((f) => (
            <div className="card fish-card" key={f.id}>
              {f.isNew && <span className="new-badge">{t("Yeni!")}</span>}
              <button className="dots-btn" onClick={() => setMenuFor(menuFor === f.id ? null : f.id)}>
                <svg width="17" height="17"><use href="#i-dots-v" /></svg>
              </button>
              {menuFor === f.id && (
                <div className="ctx-menu" style={{ position: "absolute", right: 10, top: 42 }}>
                  <button onClick={() => { setMenuFor(null); setNameVal(f.name); setNaming(f.id); }}>
                    <svg width="15" height="15"><use href="#i-pencil" /></svg> {t("İsim ver / değiştir")}
                  </button>
                  <button className="danger" onClick={() => { setMenuFor(null); release(f.id); }}>
                    <svg width="15" height="15"><use href="#i-trash" /></svg> {t("Serbest bırak")}
                  </button>
                </div>
              )}
              <div className="img"><img src={`assets/fish/${f.file}`} alt={f.name || "Balık"} loading="lazy" /></div>
              <div className="nm">
                {f.name || <span className="noname">{t("İsimsiz")}</span>}{" "}
                <button onClick={() => { setNameVal(f.name); setNaming(f.id); }} aria-label="İsim ver">
                  <svg width="14" height="14"><use href="#i-pencil" /></svg>
                </button>
              </div>
              <div className={"rar " + f.tier}><i></i> {t(RAR_LBL[f.tier])}</div>
              <div className="meta">
                <span><svg width="13" height="13"><use href="#i-clock" /></svg> {fmtMin(f.minutes)}</span>
                <span><svg width="13" height="13"><use href="#i-cal" /></svg> {trDate(f.date)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="banner" style={{ marginTop: "24px" }}>
        <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
        <div>
          <div className="t">{t("Daha fazlasını yakalamaya hazır mısın?")}</div>
          <div className="d">{t("Her tamamlanan odak seansı denizden yeni bir balık getirir. Süre uzadıkça balık nadirleşir!")}</div>
        </div>
        <img className="art" src="assets/img/waves_banner.png" alt="" />
      </div>

      {naming !== null && (
        <Modal title={t("Balığa İsim Ver")} onClose={() => setNaming(null)}>
          {(() => { const f = fish.find((x) => x.id === naming); return f ? (
            <div className="fish-name-preview"><img src={`assets/fish/${f.file}`} alt="Balık" /></div>
          ) : null; })()}
          <label className="f-label">{t("Balık adı")}</label>
          <input className="f-input" value={nameVal} autoFocus
            onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") rename(); }} />
          <div className="actions">
            <button className="btn-outline" onClick={() => setNaming(null)}>{t("Vazgeç")}</button>
            <button className="btn-navy" onClick={rename}>{t("Kaydet")}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
