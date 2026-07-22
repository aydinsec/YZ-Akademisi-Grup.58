import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { iso, fmtMin } from "../utils/helpers.js";

const CAT_META = {
  Akademik: ["#e8f2f6", "#1d5068", "i-book"],
  Kişisel: ["#e4f5ee", "#1fa97a", "i-user"],
  Sağlık: ["#fdecea", "#d63b2f", "i-heart"],
  Diğer: ["#eef3f5", "#71909f", "i-dots"],
};

export default function Tasks() {
  const { get, set, addXp, toast, rev, t, C } = useApp();
  void rev;
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [menuFor, setMenuFor] = useState(null);

  const tasks = get("tasks", []);
  const sessions = get("sessions", []);
  const todaySes = sessions.filter((s) => s.date === iso());

  const save = (arr) => set("tasks", arr);
  const toggleDone = (id, done) => {
    const a = [...tasks];
    const tk = a.find((x) => x.id === id);
    tk.done = done;
    if (done) { tk.doneAt = iso(); addXp(C.XP_GOREV); toast(`"${tk.name}" ✓ +${C.XP_GOREV} XP 🎉`); }
    save(a);
  };
  const removeTask = (id) => { save(tasks.filter((tk) => tk.id !== id)); };
  const openEdit = (tk) => {
    setForm(tk ? { ...tk } : { name: "", cat: "Akademik", prio: "orta", dur: 25, group: "today" });
    setEditing(tk ? tk.id : "new");
  };
  const submitEdit = () => {
    if (!form.name || !form.name.trim()) return;
    if (editing === "new") {
      save([...tasks, { ...form, id: Date.now(), done: false, createdAt: iso(), dur: parseInt(form.dur) || 25 }]);
    } else {
      save(tasks.map((tk) => (tk.id === editing ? { ...tk, ...form, dur: parseInt(form.dur) || 25 } : tk)));
    }
    setEditing(null);
  };

  const list = tasks.filter((tk) =>
    filter === "today" ? tk.group === "today" : filter === "upcoming" ? tk.group === "upcoming" : filter === "done" ? tk.done : true
  );
  const hideDone = !showDone && filter !== "done";
  const todayList = list.filter((tk) => tk.group === "today" && (!hideDone || !tk.done));
  const upcList = list.filter((tk) => tk.group === "upcoming" && (!hideDone || !tk.done));
  const doneCount = tasks.filter((tk) => tk.group === "today" && tk.done).length;
  const totalToday = tasks.filter((tk) => tk.group === "today").length;
  const cats = { Akademik: 0, Kişisel: 0, Sağlık: 0, Diğer: 0 };
  tasks.forEach((tk) => { if (!tk.done) cats[tk.cat] = (cats[tk.cat] || 0) + 1; });

  const Row = ({ tk }) => {
    const meta = CAT_META[tk.cat] || CAT_META["Diğer"];
    return (
      <div className="task-row">
        <input type="checkbox" className="circle-chk" checked={tk.done} onChange={(e) => toggleDone(tk.id, e.target.checked)} />
        <div className="task-ic" style={{ background: meta[0], color: meta[1] }}>
          <svg width="20" height="20"><use href={`#${meta[2]}`} /></svg>
        </div>
        <div className="task-body">
          <div className={"nm" + (tk.done ? " done" : "")}>{tk.name} <span className="cat-chip">{t(tk.cat)}</span></div>
          <div className="task-meta">
            <span><svg width="13" height="13"><use href="#i-cal" /></svg> {tk.group === "today" ? t("Bugün") : t("Yaklaşan")}</span>
            <span><svg width="13" height="13"><use href="#i-clock" /></svg> {tk.dur} dk</span>
          </div>
        </div>
        <span className={"prio " + tk.prio}>{tk.prio === "yuksek" ? t("Yüksek") : tk.prio === "dusuk" ? t("Düşük") : t("Orta")}</span>
        <button className="dots-btn" onClick={() => setMenuFor(menuFor === tk.id ? null : tk.id)}>
          <svg width="17" height="17"><use href="#i-dots" /></svg>
        </button>
        {menuFor === tk.id && (
          <div className="ctx-menu" style={{ position: "absolute", right: 40, marginTop: 60 }}>
            <button onClick={() => { setMenuFor(null); openEdit(tk); }}>
              <svg width="15" height="15"><use href="#i-pencil" /></svg> {t("Düzenle")}
            </button>
            <button className="danger" onClick={() => { setMenuFor(null); removeTask(tk.id); }}>
              <svg width="15" height="15"><use href="#i-trash" /></svg> {t("Sil")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="page" id="page-tasks">
      <div>
        <div className="tabs">
          {[["list", "Görevlerim"], ["sessions", "Odak Seansları"], ["habits", "Alışkanlıklar"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>
          ))}
        </div>

        {tab === "list" ? (
          <div className="card">
            <div className="task-toolbar">
              {[["all", "Tümü"], ["today", "Bugün"], ["upcoming", "Yaklaşan"], ["done", "Tamamlandı"]].map(([k, l]) => (
                <button key={k} className={"pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{t(l)}</button>
              ))}
              <button className="btn-navy" onClick={() => openEdit(null)}>
                <svg width="15" height="15"><use href="#i-plus" /></svg> {t("Yeni Görev Ekle")}
              </button>
            </div>

            {filter === "done" ? (
              <>
                <div className="tgroup-h">{t("Tamamlanan Görevler")} <span className="cnt">{list.length}</span></div>
                {list.length === 0 && <div style={{ padding: "8px 24px 20px", color: "var(--muted)" }}>{t("Henüz tamamlanan görev yok.")}</div>}
                {list.map((tk) => <Row tk={tk} key={tk.id} />)}
              </>
            ) : (
              <>
                {filter !== "upcoming" && (
                  <>
                    <div className="tgroup-h">{t("Bugünkü Görevler")} <span className="cnt">{totalToday}</span></div>
                    {todayList.length === 0 && <div style={{ padding: "4px 24px 14px", color: "var(--muted)" }}>{t("Bugün için görev yok — bir tane ekle!")}</div>}
                    {todayList.map((tk) => <Row tk={tk} key={tk.id} />)}
                  </>
                )}
                {filter !== "today" && upcList.length > 0 && (
                  <>
                    <div className="tgroup-h">{t("Yaklaşan Görevler")} <span className="cnt">{tasks.filter((tk) => tk.group === "upcoming").length}</span></div>
                    {upcList.map((tk) => <Row tk={tk} key={tk.id} />)}
                  </>
                )}
              </>
            )}

            <button className="show-done" onClick={() => setShowDone(!showDone)}>
              {showDone ? t("Tamamlananları Gizle") : t("Tamamlananları Görüntüle")}
              <svg width="15" height="15" style={{ transform: showDone ? "rotate(180deg)" : "" }}><use href="#i-chev-d" /></svg>
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: "17px", color: "var(--text)", marginBottom: "8px" }}>
              {tab === "sessions" ? t("Odak Seansları") : t("Alışkanlıklar")}
            </div>
            <div>
              {tab === "sessions"
                ? `${t("Bugün")}: ${todaySes.length} (${fmtMin(todaySes.reduce((a, s) => a + s.minutes, 0))}). ${t("Günlük hedefin 5 seans.")}`
                : t("Her gün en az 1 seans yaparak odak serini koru!")}
            </div>
          </div>
        )}

        <div className="banner" style={{ marginTop: "24px" }}>
          <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
          <div>
            <div className="t">{t("Planla. Odaklan. Tamamla.")}</div>
            <div className="d">{t("Disiplinli küçük adımlar, büyük sonuçlar doğurur.")}</div>
          </div>
          <img className="art" src="assets/img/waves_banner.png" alt="" />
        </div>
      </div>

      <div style={{ paddingTop: "58px" }}>
        <div className="card">
          <div className="card-h"><div className="l">{t("Görev Özeti")}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: "26px", padding: "16px 22px 22px" }}>
            <div className="donut-wrap" style={{ padding: 0 }}>
              <svg className="donut" width="140" height="140">
                <circle className="bgc" cx="70" cy="70" r="59" strokeWidth="11" />
                <circle className="fgc" cx="70" cy="70" r="59" strokeWidth="11"
                  strokeDasharray="370.7" strokeDashoffset={String(370.7 * (1 - (totalToday ? doneCount / totalToday : 0)))} />
              </svg>
              <div className="donut-c"><div className="p">{totalToday}</div><div className="s">{t("Toplam")}</div></div>
            </div>
            <div className="sum-legend">
              <div className="r"><span className="d" style={{ background: "var(--green)" }}></span> <b>{doneCount}</b>&nbsp;{t("Tamamlandı")}</div>
              <div className="r"><span className="d" style={{ background: "var(--navy-deep)" }}></span> <b>{totalToday - doneCount}</b>&nbsp;{t("Kalan")}</div>
              <div className="r"><span className="d" style={{ background: "var(--red)" }}></span> <b>0</b>&nbsp;{t("Geciken")}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">{t("Kategorilere Göre")}</div></div>
          <div style={{ padding: "8px 0 10px" }}>
            {Object.entries(cats).map(([c, n]) => {
              const [bg, fg, ic] = CAT_META[c];
              return (
                <div className="cat-row" key={c}>
                  <div className="cat-ic" style={{ background: bg, color: fg }}>
                    <svg width="15" height="15"><use href={`#${ic}`} /></svg>
                  </div>
                  {t(c)}<span className="n">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tip-card" style={{ marginTop: "20px" }}>
          <div className="t">{t("Odak İpucu")}</div>
          <div className="d">{t("Büyük hedeflere küçük adımlarla ulaşılır. Bugünkü 25 dakikan, yarınki seni inşa eder.")}</div>
          <img src="assets/img/lighthouse_small.png" alt="" />
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing === "new" ? t("Yeni Görev Ekle") : t("Görevi Düzenle")} onClose={() => setEditing(null)}>
          <label className="f-label">{t("Görev adı")}</label>
          <input className="f-input" value={form.name} autoFocus
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="f-label">{t("Kategori")}</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
              {Object.keys(CAT_META).map((c) => <option key={c} value={c}>{t(c)}</option>)}
            </select>
          </div>
          <label className="f-label">{t("Öncelik")}</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.prio} onChange={(e) => setForm({ ...form, prio: e.target.value })}>
              <option value="dusuk">{t("Düşük")}</option><option value="orta">{t("Orta")}</option><option value="yuksek">{t("Yüksek")}</option>
            </select>
          </div>
          <label className="f-label">{t("Süre (dk)")}</label>
          <input className="f-input" type="number" min="5" max="240" value={form.dur}
            onChange={(e) => setForm({ ...form, dur: e.target.value })} />
          <label className="f-label">{t("Zaman")}</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
              <option value="today">{t("Bugün")}</option><option value="upcoming">{t("Yaklaşan")}</option>
            </select>
          </div>
          <div className="actions">
            <button className="btn-outline" onClick={() => setEditing(null)}>{t("Vazgeç")}</button>
            <button className="btn-navy" onClick={submitEdit}>{editing === "new" ? t("Ekle") : t("Kaydet")}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
