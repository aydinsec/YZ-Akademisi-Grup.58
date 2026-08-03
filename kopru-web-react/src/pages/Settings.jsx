import { useState, useEffect } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { Cam } from "../utils/camera.js";
import { Storage } from "../utils/storage.js";
import { setCamValue } from "../utils/config.js";

/* Ayar anahtarı toggle'ı — render dışında tanımlı ortak bileşen */
function Toggle({ k, s, upd, def = true }) {
  return (
    <input type="checkbox" className="toggle" checked={s[k] !== undefined ? !!s[k] : def}
      onChange={(e) => upd(k, e.target.checked)} />
  );
}

export default function Settings() {
  const { get, rev, bump, applyTheme, toast, logout, quoteIdx, motivasyon, t, lang, setLang } = useApp();
  void rev;
  const [tab, setTab] = useState("genel");
  const [confirmClear, setConfirmClear] = useState(false);
  const [prem, setPrem] = useState(false);
  const [cams, setCams] = useState([]);

  const s = get("settings", {});
  const upd = (key, val) => { Storage.update("settings", (x) => { x[key] = val; return x; }, {}); bump(); };

  useEffect(() => { Cam.listDevices().then(setCams); }, []);

  const sens = s.sens !== undefined ? s.sens : 50;
  const sensLbl = sens < 34 ? t("Düşük") : sens < 67 ? t("Orta") : t("Yüksek");

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type: "application/json" }));
    a.download = "kopru-" + Storage.user.replace(/[^a-z0-9]/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t("Verilerin dışa aktarıldı 📦"));
  };

  const tg = { s, upd };

  return (
    <section className="page" id="page-settings">
      <div className="tabs">
        {[["genel", "Genel"], ["odak", "Odak Modu"], ["bildirim", "Bildirimler"], ["gorunum", "Görünüm"], ["hesap", "Hesap"], ["veri", "Veri Yönetimi"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>
        ))}
      </div>

      <div className="grid2">
        <div>
          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-gear" /></svg> {t("Genel Tercihler")}</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-globe" /></svg></div>
              <div className="b"><div className="t">{t("Dil")}</div><div className="d">{t("Uygulama dilini seç.")}</div></div>
              <div className="select">
                <select value={lang} onChange={(e) => { setLang(e.target.value); toast(e.target.value === "en" ? "Language: English" : "Dil: Türkçe"); }}>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-clock" /></svg></div>
              <div className="b"><div className="t">{t("Zaman Formatı")}</div><div className="d">{t("Saat ve tarih gösterim biçimini seç.")}</div></div>
              <div className="select"><select value={s.timeFmt || "24"} onChange={(e) => upd("timeFmt", e.target.value)}>
                <option value="24">{t("24 Saat")}</option><option value="12">{t("12 Saat")}</option></select></div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-volume" /></svg></div>
              <div className="b"><div className="t">{t("Ses Efektleri")}</div><div className="d">{t("Alarm ve uygulama seslerini aç veya kapat.")}</div></div>
              <Toggle k="sfx" {...tg} />
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-waves" /></svg></div>
              <div className="b"><div className="t">{t("Arka Plan Ambiyansı")}</div><div className="d">{t("Odak modunda arka plan deniz seslerini aç veya kapat.")}</div></div>
              <Toggle k="ambient" {...tg} />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-camera" /></svg> {t("Kamera ve Odak Takibi")}</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-camera" /></svg></div>
              <div className="b"><div className="t">{t("Kamera")}</div><div className="d">{t("Odak takibi için kullanılacak kamerayı seç.")}</div></div>
              <div className="select">
                <select value={s.camId || ""} onChange={async (e) => { upd("camId", e.target.value); await Cam.setDevice(e.target.value); }}>
                  <option value="">{t("Varsayılan Kamera")}</option>
                  {cams.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t("Kamera") + " " + (i + 1)}</option>)}
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-eye" /></svg></div>
              <div className="b"><div className="t">{t("Göz Kapanma Hassasiyeti")}</div><div className="d">{t("EAR eşiğini ayarlar — yüksek hassasiyet kapanmayı daha erken algılar.")}</div></div>
              <input type="range" className="slider" min="0" max="100" value={sens}
                onChange={(e) => { const v = +e.target.value; upd("sens", v); setCamValue("EAR_ESIK", 0.14 + (v / 100) * 0.12); }} />
              <span style={{ fontSize: "12.5px", fontWeight: 700, width: 44, textAlign: "right" }}>{sensLbl}</span>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-alert" /></svg></div>
              <div className="b"><div className="t">{t("Uyarı Eşiği")}</div><div className="d">{t("Kaç saniye göz kapalı kalırsa alarm verilsin?")}</div></div>
              <div className="select">
                <select value={s.thresh || "2"} onChange={(e) => { upd("thresh", e.target.value); setCamValue("KAPALI_SURE_ESIGI", parseFloat(e.target.value)); }}>
                  {[1, 2, 3, 5].map((v) => <option key={v} value={v}>{v} {t("saniye")}</option>)}
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-user" /></svg></div>
              <div className="b"><div className="t">{t("Yüz Kaybı Eşiği")}</div><div className="d">{t("Yüz kaç saniye görünmezse alarm verilsin?")}</div></div>
              <div className="select">
                <select value={s.faceThresh || "4"} onChange={(e) => { upd("faceThresh", e.target.value); setCamValue("YUZ_YOK_ESIGI", parseFloat(e.target.value)); }}>
                  {[3, 4, 6, 10].map((v) => <option key={v} value={v}>{v} {t("saniye")}</option>)}
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-monitor" /></svg></div>
              <div className="b"><div className="t">{t("Kamera Önizlemesi")}</div><div className="d">{t("Kapatılırsa takip sürer ama görüntü gizlenir.")}</div></div>
              <Toggle k="preview" {...tg} />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-sparkles" /></svg> {t("Yapay Zeka (Görev Ayrıştırıcı)")}</div>
            <div style={{ padding: "10px 22px 0", color: "var(--muted)", fontSize: "12.5px" }}>
              {t("Görevler sayfasındaki ayrıştırıcı varsayılan olarak cihazında çalışır. Bir API anahtarı girersen daha güçlü bir dil modeli kullanılır; hata olursa otomatik olarak yerel motora döner.")}
            </div>
            <div className="set-row" style={{ marginTop: "8px" }}>
              <div className="set-ic"><svg width="17" height="17"><use href="#i-globe" /></svg></div>
              <div className="b"><div className="t">{t("Sağlayıcı")}</div><div className="d">{t("Anahtarın hangi servise ait?")}</div></div>
              <div className="select">
                <select value={s.aiProvider || "anthropic"} onChange={(e) => upd("aiProvider", e.target.value)}>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-lock" /></svg></div>
              <div className="b">
                <div className="t">{t("API Anahtarı")}</div>
                <div className="d">{t("Boş bırakılırsa yerel ayrıştırıcı kullanılır. Anahtar yalnızca bu tarayıcıda saklanır.")}</div>
              </div>
              <input className="f-input" style={{ maxWidth: 200 }} type="password" placeholder={t("(boş = yerel motor)")}
                value={s.aiKey || ""} onChange={(e) => upd("aiKey", e.target.value)} />
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-sliders" /></svg></div>
              <div className="b"><div className="t">{t("Model")}</div><div className="d">{t("Boş bırakılırsa varsayılan model kullanılır.")}</div></div>
              <input className="f-input" style={{ maxWidth: 200 }} placeholder={(s.aiProvider || "anthropic") === "openai" ? "gpt-4o-mini" : "claude-sonnet-5"}
                value={s.aiModel || ""} onChange={(e) => upd("aiModel", e.target.value)} />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-cloud" /></svg> {t("Veri ve Senkronizasyon")}</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-cloud" /></svg></div>
              <div className="b"><div className="t">{t("Bulut Senkronizasyonu")}</div><div className="d">{t("Verilerini buluta yedekle (backend bağlanınca aktif olur).")}</div></div>
              <Toggle k="sync" def={false} {...tg} />
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-download" /></svg></div>
              <div className="b"><div className="t">{t("Verileri Dışa Aktar")}</div><div className="d">{t("Tüm verilerini JSON olarak dışa aktar (yedek / paylaşım).")}</div></div>
              <button className="btn-outline" onClick={exportData}>
                <svg width="15" height="15"><use href="#i-download" /></svg> {t("Dışa Aktar")}
              </button>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-trash" /></svg></div>
              <div className="b"><div className="t">{t("Verileri Temizle")}</div><div className="d">{t("Odak süreleri, görevler, balıklar ve tüm istatistikleri kalıcı olarak sil.")}</div></div>
              <button className="btn-danger-o" onClick={() => setConfirmClear(true)}>
                <svg width="15" height="15"><use href="#i-trash" /></svg> {t("Temizle")}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card set-group">
            <div className="set-h" style={{ borderBottom: "none", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="18" height="18"><use href="#i-bell" /></svg> {t("Odak Hatırlatıcıları")}
              </span>
              <Toggle k="reminders" {...tg} />
            </div>
            <div style={{ padding: "0 22px 6px", color: "var(--muted)", fontSize: "12.5px", marginTop: "-4px" }}>
              {t("Belirlediğin aralıklarla odaklanman için hatırlatıcılar al.")}
            </div>
            <div className="set-row" style={{ marginTop: "8px" }}>
              <div className="b"><div className="t">{t("Hatırlatıcı Aralığı")}</div></div>
              <div className="select"><select value={s.remInt || "25"} onChange={(e) => upd("remInt", e.target.value)}>
                {[15, 25, 50].map((v) => <option key={v} value={v}>{v} {t("dakika")}</option>)}</select></div>
            </div>
            <div className="set-row">
              <div className="b"><div className="t">{t("Kısa Mola Süresi")}</div></div>
              <div className="select"><select value={s.shortBreak || "5"} onChange={(e) => upd("shortBreak", e.target.value)}>
                {[5, 10].map((v) => <option key={v} value={v}>{v} {t("dakika")}</option>)}</select></div>
            </div>
            <div className="set-row">
              <div className="b"><div className="t">{t("Uzun Mola Süresi")}</div></div>
              <div className="select"><select value={s.longBreak || "15"} onChange={(e) => upd("longBreak", e.target.value)}>
                {[10, 15, 20].map((v) => <option key={v} value={v}>{v} {t("dakika")}</option>)}</select></div>
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h" style={{ borderBottom: "none", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="18" height="18"><use href="#i-star" /></svg> {t("Motivasyon Mesajları")}
              </span>
              <Toggle k="motiv" {...tg} />
            </div>
            <div style={{ padding: "0 22px", color: "var(--muted)", fontSize: "12.5px", marginTop: "-4px" }}>
              {t("Mesajlar belirli aralıklarla kendiliğinden değişir.")}
            </div>
            <div className="quote-box">
              <svg width="26" height="26"><use href="#i-quote" /></svg>
              <div className="q">{motivasyon(quoteIdx)}</div>
              <img src="assets/img/quote_boat.png" alt="" />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h">
              <svg width="18" height="18"><use href="#i-moon" /></svg> {t("Tema")}
              <span style={{ fontWeight: 500, color: "var(--muted)", fontSize: "12px", marginLeft: "auto" }}>{t("Uygulama temasını seç.")}</span>
            </div>
            <div className="themes">
              {[["light", "i-sun", "Açık"], ["dark", "i-moon", "Koyu"], ["system", "i-monitor", "Sistem"]].map(([k, ic, l]) => (
                <button key={k} className={"theme-opt" + ((s.theme || "light") === k ? " sel" : "")}
                  onClick={() => applyTheme(k)}>
                  <svg width="22" height="22"><use href={`#${ic}`} /></svg> {t(l)}
                </button>
              ))}
            </div>
          </div>

          <div className="prem">
            <div className="t"><svg width="19" height="19"><use href="#i-crown" /></svg> {t("Premium Özellikler")}</div>
            <div className="d">{t("Daha fazlası için yükselt!")}</div>
            <ul>
              {["Sınırsız odak seansı", "Detaylı istatistik raporları", "Özel ambiyans sesleri", "Veri yedekleme ve geri yükleme"].map((x) => (
                <li key={x}><svg width="15" height="15"><use href="#i-check-c" /></svg> {t(x)}</li>
              ))}
            </ul>
            <button className="btn-prem" onClick={() => setPrem(true)}>{t("Premium'a Geç")}</button>
            <img src="assets/img/premium_lighthouse.png" alt="" />
          </div>

          <div className="card set-group" style={{ marginTop: "24px" }}>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-user" /></svg></div>
              <div className="b"><div className="t">{t("Oturumu Kapat")}</div><div className="d">{Storage.user}</div></div>
              <button className="btn-outline" onClick={logout}>{t("Çıkış Yap")}</button>
            </div>
          </div>
        </div>
      </div>

      {confirmClear && (
        <Modal title={t("Verileri Temizle")} onClose={() => setConfirmClear(false)}>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
            <b>{t("Emin misin, Kaptan?")}</b> {Storage.user} — {t("Odak süreleri, görevler, balıklar ve tüm istatistikleri kalıcı olarak sil.")}
          </p>
          <div className="actions">
            <button className="btn-outline" onClick={() => setConfirmClear(false)}>{t("Vazgeç")}</button>
            <button className="btn-danger-o" onClick={() => {
              Storage.clearAll();
              setConfirmClear(false);
              bump();
              toast("⚓");
            }}>
              <svg width="15" height="15"><use href="#i-trash" /></svg> {t("Evet, Hepsini Sil")}
            </button>
          </div>
        </Modal>
      )}

      {prem && (
        <Modal title={t("Premium'a Geç")} onClose={() => setPrem(false)}>
          <div style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: "26px", marginBottom: "18px" }}>
            ₺49,99<span style={{ fontSize: "14px", color: "var(--muted)" }}> / {lang === "en" ? "mo" : "ay"}</span>
          </div>
          <div className="actions">
            <button className="btn-outline" onClick={() => setPrem(false)}>{t("Belki sonra")}</button>
            <button className="btn-red" style={{ padding: "11px 22px", fontSize: "14px" }}
              onClick={() => { setPrem(false); toast("👑"); }}>
              {t("Hemen Yükselt")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
