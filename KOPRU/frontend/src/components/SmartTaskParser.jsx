/* ============================================================
   Akıllı Görev Ayrıştırıcı — Görevler sayfasındaki YZ paneli
   Serbest metni kategori/süre/öncelikli görevlere çevirir,
   önizlemede düzenlemene izin verir, onaylayınca listeye ekler.
   ============================================================ */
import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import { parseTasks, ORNEK_METIN } from "../utils/taskAI.js";
import { iso } from "../utils/helpers.js";

const CATS = ["Akademik", "Kişisel", "Sağlık", "Diğer"];

export default function SmartTaskParser({ onAdded }) {
  const { get, set, toast, t } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(null);
  const [engine, setEngine] = useState("local");
  const [warn, setWarn] = useState("");

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setWarn("");
    try {
      const res = await parseTasks(text, get("settings", {}));
      setItems(res.items);
      setEngine(res.engine);
      if (res.error) setWarn(t("Yapay zeka servisine ulaşılamadı, yerel ayrıştırıcı kullanıldı.") + " (" + res.error + ")");
      if (!res.items.length) setWarn(t("Metinden görev çıkarılamadı. Daha açık yazmayı dene."));
    } catch (e) {
      setWarn(String(e.message || e));
    }
    setBusy(false);
  };

  const upd = (i, key, val) => setItems((a) => a.map((x, k) => (k === i ? { ...x, [key]: val } : x)));
  const remove = (i) => setItems((a) => a.filter((_, k) => k !== i));

  const addAll = () => {
    const now = Date.now();
    const yeni = items.map((x, i) => ({
      ...x,
      id: now + i,
      done: false,
      createdAt: iso(),
      dur: parseInt(x.dur, 10) || 25,
    }));
    set("tasks", [...get("tasks", []), ...yeni]);
    toast(yeni.length + " " + t("görev eklendi") + " ⚓");
    setItems(null);
    setText("");
    setOpen(false);
    if (onAdded) onAdded();
  };

  const totalMin = items ? items.reduce((a, x) => a + (parseInt(x.dur, 10) || 0), 0) : 0;

  if (!open) {
    return (
      <button className="ai-open" onClick={() => setOpen(true)}>
        <span className="ai-badge">
          <svg width="15" height="15"><use href="#i-sparkles" /></svg> {t("YZ")}
        </span>
        <span className="ai-open-t">{t("Aklındakileri yaz, görevlere böleyim")}</span>
        <svg width="16" height="16" className="ai-open-c"><use href="#i-chev-d" /></svg>
      </button>
    );
  }

  return (
    <div className="card ai-panel">
      <div className="card-h">
        <div className="l">
          <span className="ai-badge"><svg width="15" height="15"><use href="#i-sparkles" /></svg> {t("YZ")}</span>
          {t("Akıllı Görev Ayrıştırıcı")}
        </div>
        <button className="dots-btn" onClick={() => { setOpen(false); setItems(null); }} aria-label={t("Kapat")}>
          <svg width="16" height="16"><use href="#i-x" /></svg>
        </button>
      </div>

      <div className="ai-body">
        <p className="ai-hint">{t("Gününü serbestçe yaz — cümleleri ayırıp kategori, öncelik ve süre atayayım.")}</p>
        <textarea
          className="ai-textarea"
          rows={4}
          value={text}
          placeholder={ORNEK_METIN}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
        />
        <div className="ai-actions">
          <button className="link" onClick={() => setText(ORNEK_METIN)}>{t("Örnek metni dene")}</button>
          <div style={{ flex: 1 }} />
          <button className="btn-navy" onClick={run} disabled={busy || !text.trim()}>
            {busy
              ? <><span className="ai-spin" /> {t("Ayrıştırılıyor…")}</>
              : <><svg width="15" height="15"><use href="#i-sparkles" /></svg> {t("Görevlere Ayır")}</>}
          </button>
        </div>

        {warn && <div className="ai-warn"><svg width="15" height="15"><use href="#i-alert" /></svg> {warn}</div>}

        {items && items.length > 0 && (
          <div className="ai-result">
            <div className="ai-result-h">
              <b>{items.length}</b> {t("görev bulundu")} · {t("toplam")} {Math.floor(totalMin / 60) ? Math.floor(totalMin / 60) + "sa " : ""}{totalMin % 60}dk
              <span className={"ai-engine " + engine}>{engine === "llm" ? t("YZ modeli") : t("yerel ayrıştırıcı")}</span>
            </div>

            {items.map((x, i) => (
              <div className="ai-row" key={i}>
                <input className="ai-name" value={x.name} onChange={(e) => upd(i, "name", e.target.value)} />
                <div className="select ai-sel">
                  <select value={x.cat} onChange={(e) => upd(i, "cat", e.target.value)}>
                    {CATS.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                  </select>
                </div>
                <div className="select ai-sel">
                  <select value={x.prio} onChange={(e) => upd(i, "prio", e.target.value)}>
                    <option value="dusuk">{t("Düşük")}</option>
                    <option value="orta">{t("Orta")}</option>
                    <option value="yuksek">{t("Yüksek")}</option>
                  </select>
                </div>
                <input className="ai-dur" type="number" min="5" max="240" step="5" value={x.dur}
                  onChange={(e) => upd(i, "dur", e.target.value)} />
                <span className="ai-dk">dk</span>
                <div className="select ai-sel">
                  <select value={x.group} onChange={(e) => upd(i, "group", e.target.value)}>
                    <option value="today">{t("Bugün")}</option>
                    <option value="upcoming">{t("Yaklaşan")}</option>
                  </select>
                </div>
                <button className="dots-btn" onClick={() => remove(i)} aria-label={t("Sil")}>
                  <svg width="15" height="15"><use href="#i-trash" /></svg>
                </button>
              </div>
            ))}

            <div className="ai-footer">
              <button className="btn-outline" onClick={() => setItems(null)}>{t("Vazgeç")}</button>
              <button className="btn-red" onClick={addAll}>
                <svg width="16" height="16"><use href="#i-check" /></svg> {t("Hepsini Ekle")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
