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
  const { get, set, addXp, toast, rev, C } = useApp();
  void rev;
  const [tab, setTab] = useState("list");
  const [filter, setFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | task
  const [form, setForm] = useState({});
  const [menuFor, setMenuFor] = useState(null);

  const tasks = get("tasks", []);
  const sessions = get("sessions", []);
  const todaySes = sessions.filter((s) => s.date === iso());

  const save = (arr) => set("tasks", arr);
  const toggleDone = (id, done) => {
    const a = [...tasks];
    const t = a.find((x) => x.id === id);
    t.done = done;
    if (done) { t.doneAt = iso(); addXp(C.XP_GOREV); toast(`"${t.name}" tamamlandı! +${C.XP_GOREV} XP 🎉`); }
    save(a);
  };
  const removeTask = (id) => { save(tasks.filter((t) => t.id !== id)); toast("Görev silindi"); };
  const openEdit = (t) => {
    setForm(t ? { ...t } : { name: "", cat: "Akademik", prio: "orta", dur: 25, group: "today" });
    setEditing(t ? t.id : "new");
  };
  const submitEdit = () => {
    if (!form.name || !form.name.trim()) { toast("Görev adı boş olamaz"); return; }
    if (editing === "new") {
      save([...tasks, { ...form, id: Date.now(), done: false, createdAt: iso(), dur: parseInt(form.dur) || 25 }]);
      toast("Görev eklendi ⚓");
    } else {
      save(tasks.map((t) => (t.id === editing ? { ...t, ...form, dur: parseInt(form.dur) || 25 } : t)));
      toast("Görev güncellendi");
    }
    setEditing(null);
  };

  let list = tasks.filter((t) =>
    filter === "today" ? t.group === "today" : filter === "upcoming" ? t.group === "upcoming" : filter === "done" ? t.done : true
  );
  const hideDone = !showDone && filter !== "done";
  const todayList = list.filter((t) => t.group === "today" && (!hideDone || !t.done));
  const upcList = list.filter((t) => t.group === "upcoming" && (!hideDone || !t.done));
  const doneCount = tasks.filter((t) => t.group === "today" && t.done).length;
  const totalToday = tasks.filter((t) => t.group === "today").length;
  const cats = { Akademik: 0, Kişisel: 0, Sağlık: 0, Diğer: 0 };
  tasks.forEach((t) => { if (!t.done) cats[t.cat] = (cats[t.cat] || 0) + 1; });

  const Row = ({ t }) => {
    const meta = CAT_META[t.cat] || CAT_META["Diğer"];
    return (
      <div className="task-row">
        <input type="checkbox" className="circle-chk" checked={t.done} onChange={(e) => toggleDone(t.id, e.target.checked)} />
        <div className="task-ic" style={{ background: meta[0], color: meta[1] }}>
          <svg width="20" height="20"><use href={`#${meta[2]}`} /></svg>
        </div>
        <div className="task-body">
          <div className={"nm" + (t.done ? " done" : "")}>{t.name} <span className="cat-chip">{t.cat}</span></div>
          <div className="task-meta">
            <span><svg width="13" height="13"><use href="#i-cal" /></svg> {t.group === "today" ? "Bugün" : "Yaklaşan"}</span>
            <span><svg width="13" height="13"><use href="#i-clock" /></svg> {t.dur} dk</span>
          </div>
        </div>
        <span className={"prio " + t.prio}>{t.prio === "yuksek" ? "Yüksek" : t.prio === "dusuk" ? "Düşük" : "Orta"}</span>
        <button className="dots-btn" onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}>
          <svg width="17" height="17"><use href="#i-dots" /></svg>
        </button>
        {menuFor === t.id && (
          <div className="ctx-menu" style={{ position: "absolute", right: 40, marginTop: 60 }}>
            <button onClick={() => { setMenuFor(null); openEdit(t); }}>
              <svg width="15" height="15"><use href="#i-pencil" /></svg> Düzenle
            </button>
            <button className="danger" onClick={() => { setMenuFor(null); removeTask(t.id); }}>
              <svg width="15" height="15"><use href="#i-trash" /></svg> Sil
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
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === "list" ? (
          <div className="card">
            <div className="task-toolbar">
              {[["all", "Tümü"], ["today", "Bugün"], ["upcoming", "Yaklaşan"], ["done", "Tamamlandı"]].map(([k, l]) => (
                <button key={k} className={"pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{l}</button>
              ))}
              <button className="btn-navy" onClick={() => openEdit(null)}>
                <svg width="15" height="15"><use href="#i-plus" /></svg> Yeni Görev Ekle
              </button>
            </div>

            {filter === "done" ? (
              <>
                <div className="tgroup-h">Tamamlanan Görevler <span className="cnt">{list.length}</span></div>
                {list.length === 0 && <div style={{ padding: "8px 24px 20px", color: "var(--muted)" }}>Henüz tamamlanan görev yok.</div>}
                {list.map((t) => <Row t={t} key={t.id} />)}
              </>
            ) : (
              <>
                {filter !== "upcoming" && (
                  <>
                    <div className="tgroup-h">Bugünkü Görevler <span className="cnt">{totalToday}</span></div>
                    {todayList.length === 0 && <div style={{ padding: "4px 24px 14px", color: "var(--muted)" }}>Bugün için görev yok — bir tane ekle!</div>}
                    {todayList.map((t) => <Row t={t} key={t.id} />)}
                  </>
                )}
                {filter !== "today" && upcList.length > 0 && (
                  <>
                    <div className="tgroup-h">Yaklaşan Görevler <span className="cnt">{tasks.filter((t) => t.group === "upcoming").length}</span></div>
                    {upcList.map((t) => <Row t={t} key={t.id} />)}
                  </>
                )}
              </>
            )}

            <button className="show-done" onClick={() => setShowDone(!showDone)}>
              {showDone ? "Tamamlananları Gizle" : "Tamamlananları Görüntüle"}
              <svg width="15" height="15" style={{ transform: showDone ? "rotate(180deg)" : "" }}><use href="#i-chev-d" /></svg>
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: "17px", color: "var(--text)", marginBottom: "8px" }}>
              {tab === "sessions" ? "Odak Seansları" : "Alışkanlıklar"}
            </div>
            <div>
              {tab === "sessions"
                ? `Bugün ${todaySes.length} seans tamamladın (${fmtMin(todaySes.reduce((a, s) => a + s.minutes, 0))}). Günlük hedefin 5 seans.`
                : "Her gün en az 1 seans yaparak odak serini koru!"}
            </div>
          </div>
        )}

        <div className="banner" style={{ marginTop: "24px" }}>
          <div className="ic"><svg width="24" height="24"><use href="#i-anchor" /></svg></div>
          <div>
            <div className="t">Planla. Odaklan. Tamamla.</div>
            <div className="d">Disiplinli küçük adımlar, büyük sonuçlar doğurur.</div>
          </div>
          <img className="art" src="assets/img/waves_banner.png" alt="" />
        </div>
      </div>

      <div style={{ paddingTop: "58px" }}>
        <div className="card">
          <div className="card-h"><div className="l">Görev Özeti</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: "26px", padding: "16px 22px 22px" }}>
            <div className="donut-wrap" style={{ padding: 0 }}>
              <svg className="donut" width="140" height="140">
                <circle className="bgc" cx="70" cy="70" r="59" strokeWidth="11" />
                <circle className="fgc" cx="70" cy="70" r="59" strokeWidth="11"
                  strokeDasharray="370.7" strokeDashoffset={String(370.7 * (1 - (totalToday ? doneCount / totalToday : 0)))} />
              </svg>
              <div className="donut-c"><div className="p">{totalToday}</div><div className="s">Toplam</div></div>
            </div>
            <div className="sum-legend">
              <div className="r"><span className="d" style={{ background: "var(--green)" }}></span> <b>{doneCount}</b>&nbsp;Tamamlandı</div>
              <div className="r"><span className="d" style={{ background: "var(--navy-deep)" }}></span> <b>{totalToday - doneCount}</b>&nbsp;Kalan</div>
              <div className="r"><span className="d" style={{ background: "var(--red)" }}></span> <b>0</b>&nbsp;Geciken</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "20px" }}>
          <div className="card-h"><div className="l">Kategorilere Göre</div></div>
          <div style={{ padding: "8px 0 10px" }}>
            {Object.entries(cats).map(([c, n]) => {
              const [bg, fg, ic] = CAT_META[c];
              return (
                <div className="cat-row" key={c}>
                  <div className="cat-ic" style={{ background: bg, color: fg }}>
                    <svg width="15" height="15"><use href={`#${ic}`} /></svg>
                  </div>
                  {c}<span className="n">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tip-card" style={{ marginTop: "20px" }}>
          <div className="t">Odak İpucu</div>
          <div className="d">Büyük hedeflere küçük adımlarla ulaşılır. Bugünkü 25 dakikan, yarınki seni inşa eder.</div>
          <img src="assets/img/lighthouse_small.png" alt="" />
        </div>
      </div>

      {editing !== null && (
        <Modal title={editing === "new" ? "Yeni Görev Ekle" : "Görevi Düzenle"} onClose={() => setEditing(null)}>
          <label className="f-label">Görev adı</label>
          <input className="f-input" value={form.name} placeholder="Ör: Rapor taslağını yaz" autoFocus
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="f-label">Kategori</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
              {Object.keys(CAT_META).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="f-label">Öncelik</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.prio} onChange={(e) => setForm({ ...form, prio: e.target.value })}>
              <option value="dusuk">Düşük</option><option value="orta">Orta</option><option value="yuksek">Yüksek</option>
            </select>
          </div>
          <label className="f-label">Süre (dk)</label>
          <input className="f-input" type="number" min="5" max="240" value={form.dur}
            onChange={(e) => setForm({ ...form, dur: e.target.value })} />
          <label className="f-label">Zaman</label>
          <div className="select" style={{ width: "100%" }}>
            <select className="f-input" style={{ appearance: "none" }} value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
              <option value="today">Bugün</option><option value="upcoming">Yaklaşan</option>
            </select>
          </div>
          <div className="actions">
            <button className="btn-outline" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="btn-navy" onClick={submitEdit}>{editing === "new" ? "Ekle" : "Kaydet"}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
