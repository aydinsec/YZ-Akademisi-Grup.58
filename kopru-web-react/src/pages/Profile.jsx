import { useState, useRef } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { Storage } from "../utils/storage.js";
import { MODE_META } from "../utils/config.js";
import { iso, fmtMin, trDate, readAvatar } from "../utils/helpers.js";

function streak(sessions) {
  const days = new Set(sessions.map((s) => s.date));
  let best = 0, cur = 0;
  const d = new Date(); d.setDate(d.getDate() - 365);
  for (let i = 0; i <= 366; i++) { const k = iso(d); cur = days.has(k) ? cur + 1 : 0; best = Math.max(best, cur); d.setDate(d.getDate() + 1); }
  return best;
}

export default function Profile({ setCurrentPage }) {
  const { get, set, profile, setAvatar, rev, toast, quoteIdx, motivasyon, t, C } = useApp();
  void rev;
  const [editOpen, setEditOpen] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const fileRef = useRef(null);

  const p = profile();
  const sessions = get("sessions", []);
  const fish = get("fish", []);
  const totMin = sessions.reduce((a, s) => a + s.minutes, 0);
  const saat = totMin / 60;
  const title = saat >= 20 ? "Usta Kaptan" : saat >= 10 ? "Derin Odakçı" : saat >= 5 ? "Denizci" : saat >= 1 ? "Tayfa" : "Çaylak Denizci";
  const pct = Math.round((p.xp / p.xpMax) * 100) + "%";

  const byMode = { derin: 0, orta: 0, hafif: 0 };
  sessions.forEach((s) => { byMode[s.mode] = (byMode[s.mode] || 0) + s.minutes; });
  const tot = byMode.derin + byMode.orta + byMode.hafif;
  const modeIcons = { derin: "i-moon", orta: "i-target", hafif: "i-waves" };

  const badges = [
    { t: "İlk Seans", d: "İlk odak seansını tamamla.", ic: "i-anchor", col: "#1d5068", ok: sessions.length >= 1 },
    { t: "5 Balıkçı", d: "5 balık yakala.", ic: "i-fish", col: "#5f97ac", ok: fish.length >= 5 },
    { t: "Derin Odakçı", d: "10 saatten fazla odaklan.", ic: "i-coral", col: "#3f8f6f", ok: totMin >= 600 },
    { t: "Yolcu Değil Kaptansın", d: "7 gün üst üste odaklan.", ic: "i-lighthouse", col: "#e8912d", ok: streak(sessions) >= 7 },
    { t: "Usta Kaptan", d: "20 seans tamamla.", ic: "i-crown", col: "#8b7fd1", ok: sessions.length >= 20 },
  ];

  /* Profil fotoğrafı seçimi — dosya seç, küçült, kaydet */
  const pickAvatar = () => fileRef.current && fileRef.current.click();
  const onAvatarFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const dataUrl = await readAvatar(f);
      setAvatar(dataUrl);
      toast(t("Profil fotoğrafı güncellendi 📷"));
    } catch {
      toast("Fotoğraf okunamadı, başka bir dosya dene.");
    }
  };

  const saveName = () => {
    if (!nameVal.trim()) { toast(t("İsim boş olamaz")); return; }
    const pp = profile();
    pp.name = nameVal.trim();
    set("profile", pp);
    setEditOpen(false);
    toast(t("Profil güncellendi"));
  };

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type: "application/json" }));
    a.download = "kopru-" + Storage.user.replace(/[^a-z0-9]/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t("Verilerin dışa aktarıldı 📦"));
  };

  return (
    <section className="page" id="page-profile">
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onAvatarFile} />

      <div className="card prof-head">
        <div className="prof-id">
          <div className="prof-av">
            <img src={p.avatar || "assets/img/avatar.png"} alt="Profil fotoğrafı" />
            <button aria-label={t("Profil fotoğrafını değiştir")} title={t("Profil fotoğrafını değiştir")} onClick={pickAvatar}>
              <svg width="18" height="18"><use href="#i-camera" /></svg>
            </button>
          </div>
          <div>
            <div className="prof-name">
              <span>{p.name}</span>{" "}
              <button onClick={() => { setNameVal(p.name); setEditOpen(true); }} aria-label={t("Profil Bilgilerini Düzenle")}>
                <svg width="17" height="17"><use href="#i-pencil" /></svg>
              </button>
            </div>
            <div className="prof-sub">{t("Odak yolculuğunda ilerlemeye devam et.")}</div>
            <div className="lvl-row">
              <span className="lv">{t("Seviye")} {p.level}</span>
              <div className="bar"><i style={{ width: pct }}></i></div>
              <span className="xp">{p.xp} / {p.xpMax} XP</span>
            </div>
            <div className="title-chip">
              <div className="ic"><svg width="18" height="18"><use href="#i-anchor" /></svg></div>
              <div><div className="t">{t(title)}</div><div className="d">{t("Odaklandıkça unvanın yükselir.")}</div></div>
            </div>
          </div>
        </div>
        <div className="prof-facts">
          <div className="fact"><span className="k">{t("Üye olma tarihi")}</span><span className="v">{trDate(p.joined)}</span></div>
          <div className="fact"><span className="k">{t("Toplam odak süresi")}</span><span className="v">{fmtMin(totMin)}</span></div>
          <div className="fact"><span className="k">{t("Tamamlanan seans")}</span><span className="v">{sessions.filter((s) => s.completed !== false).length}</span></div>
          <div className="fact">
            <span className="k">{t("Yakalanan balık")}</span>
            <span className="v">{fish.length}
              <button className="link" style={{ display: "flex" }} onClick={() => setCurrentPage("catches")}>
                <svg width="15" height="15" style={{ color: "var(--muted2)" }}><use href="#i-chev-r" /></svg>
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="card">
            <div className="card-h"><div className="l">{t("Odak Yolculuğun")}</div></div>
            <div className="journey">
              <div className="jitem">
                <div className="ico" style={{ background: "var(--blue-soft)", color: "var(--teal)" }}><svg width="18" height="18"><use href="#i-clock" /></svg></div>
                <div><div className="k">{t("Toplam Odak Süresi")}</div><div className="v">{fmtMin(totMin)}</div></div>
              </div>
              <div className="jitem">
                <div className="ico" style={{ background: "var(--green-soft)", color: "var(--green)" }}><svg width="18" height="18"><use href="#i-target" /></svg></div>
                <div><div className="k">{t("Tamamlanan Seans")}</div><div className="v">{sessions.length}</div></div>
              </div>
              <div className="jitem">
                <div className="ico" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}><svg width="18" height="18"><use href="#i-flame" /></svg></div>
                <div><div className="k">{t("En Uzun Seri")}</div><div className="v">{streak(sessions)} {t("gün")}</div></div>
              </div>
              <div className="jitem">
                <div className="ico" style={{ background: "var(--blue-soft)", color: "var(--teal)" }}><svg width="18" height="18"><use href="#i-waves" /></svg></div>
                <div><div className="k">{t("Ortalama Seans")}</div><div className="v">{sessions.length ? fmtMin(totMin / sessions.length) : "0dk"}</div></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <div className="card-h">
              <div className="l">{t("Başarılarım")}</div>
              <button className="link" onClick={() => toast(badges.filter((b) => b.ok).length + " / " + badges.length + " 🏅")}>{t("Tümünü Gör")}</button>
            </div>
            <div className="badges">
              {badges.map((b) => (
                <div className={"badge" + (b.ok ? "" : " locked")} key={b.t} title={b.ok ? t("Kazanıldı!") : t("Henüz kilitli")}>
                  <div className="hexa" style={{ background: b.col }}><svg width="22" height="22"><use href={`#${b.ic}`} /></svg></div>
                  <div className="t">{t(b.t)}</div>
                  <div className="d">{t(b.d)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="remember">
            <div className="t">{t("Unutma, Kaptan")}</div>
            <div className="d">{motivasyon((quoteIdx + 3) % C.MOTIVASYON.length)}</div>
            <img src="assets/img/lighthouse_big.png" alt="" />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-h"><div className="l">{t("İstatistik Özeti")}</div></div>
            <div style={{ padding: "8px 0 16px" }}>
              {Object.entries(MODE_META).map(([k, [lbl, , col]]) => {
                const p2 = tot ? Math.round((byMode[k] / tot) * 100) : 0;
                return (
                  <div className="stat-mini" key={k}>
                    <div className="ic" style={{ background: "var(--blue-soft)", color: col }}>
                      <svg width="16" height="16"><use href={`#${modeIcons[k]}`} /></svg>
                    </div>
                    {t(lbl)}
                    <div className="bar"><i style={{ width: p2 + "%", background: col }}></i></div>
                    <span className="pc">{p2}% ({fmtMin(byMode[k])})</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <div className="card-h"><div className="l">{t("Hızlı İşlemler")}</div></div>
            <div style={{ padding: "4px 0 8px" }}>
              <div className="qa-row" onClick={() => { setNameVal(p.name); setEditOpen(true); }}>
                <div className="ic"><svg width="17" height="17"><use href="#i-user" /></svg></div>
                <div><div className="t">{t("Profil Bilgilerini Düzenle")}</div><div className="d">{t("Görünen adını güncelle.")}</div></div>
                <svg className="ch" width="17" height="17"><use href="#i-chev-r" /></svg>
              </div>
              <div className="qa-row" onClick={pickAvatar}>
                <div className="ic"><svg width="17" height="17"><use href="#i-camera" /></svg></div>
                <div><div className="t">{t("Profil fotoğrafını değiştir")}</div><div className="d">JPG / PNG</div></div>
                <svg className="ch" width="17" height="17"><use href="#i-chev-r" /></svg>
              </div>
              <div className="qa-row" onClick={() => setCurrentPage("settings")}>
                <div className="ic"><svg width="17" height="17"><use href="#i-bell" /></svg></div>
                <div><div className="t">{t("Bildirim Tercihleri")}</div><div className="d">{t("Bildirim ayarlarını özelleştir.")}</div></div>
                <svg className="ch" width="17" height="17"><use href="#i-chev-r" /></svg>
              </div>
              <div className="qa-row" onClick={exportData}>
                <div className="ic"><svg width="17" height="17"><use href="#i-download" /></svg></div>
                <div><div className="t">{t("Verilerini İndir")}</div><div className="d">{t("Tüm verilerini dışa aktar.")}</div></div>
                <svg className="ch" width="17" height="17"><use href="#i-chev-r" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <Modal title={t("Profil Bilgilerini Düzenle")} onClose={() => setEditOpen(false)}>
          <label className="f-label">{t("Görünen ad")}</label>
          <input className="f-input" value={nameVal} autoFocus onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); }} />
          <label className="f-label">{t("E-posta (hesap anahtarı)")}</label>
          <input className="f-input" value={Storage.user || ""} disabled />
          <div className="actions">
            <button className="btn-outline" onClick={() => setEditOpen(false)}>{t("Vazgeç")}</button>
            <button className="btn-navy" onClick={saveName}>{t("Kaydet")}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
