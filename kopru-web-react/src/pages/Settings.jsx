import { useState, useEffect } from "react";
import { useApp } from "../state/AppContext.jsx";
import Modal from "../components/Modal.jsx";
import { Cam } from "../utils/camera.js";
import { Storage } from "../utils/storage.js";
import { setCamValue } from "../utils/config.js";

/* Ayar anahtarı toggle'ı — render dışında tanımlı ortak bileşen */
function Toggle({ k, s, upd, toast, def = true }) {
  return (
    <input type="checkbox" className="toggle" checked={s[k] !== undefined ? !!s[k] : def}
      onChange={(e) => { upd(k, e.target.checked); toast(e.target.checked ? "Açıldı" : "Kapatıldı"); }} />
  );
}

export default function Settings() {
  const { get, rev, bump, applyTheme, toast, C, logout, quoteIdx } = useApp();
  void rev;
  const [tab, setTab] = useState("genel");
  const [confirmClear, setConfirmClear] = useState(false);
  const [prem, setPrem] = useState(false);
  const [cams, setCams] = useState([]);

  const s = get("settings", {});
  const upd = (key, val) => { Storage.update("settings", (x) => { x[key] = val; return x; }, {}); bump(); };

  useEffect(() => { Cam.listDevices().then(setCams); }, []);

  const sens = s.sens !== undefined ? s.sens : 50;
  const sensLbl = sens < 34 ? "Düşük" : sens < 67 ? "Orta" : "Yüksek";

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type: "application/json" }));
    a.download = "kopru-" + Storage.user.replace(/[^a-z0-9]/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Verilerin dışa aktarıldı 📦");
  };

  const tg = { s, upd, toast };

  return (
    <section className="page" id="page-settings">
      <div className="tabs">
        {[["genel", "Genel"], ["odak", "Odak Modu"], ["bildirim", "Bildirimler"], ["gorunum", "Görünüm"], ["hesap", "Hesap"], ["veri", "Veri Yönetimi"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="grid2">
        <div>
          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-gear" /></svg> Genel Tercihler</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-globe" /></svg></div>
              <div className="b"><div className="t">Dil</div><div className="d">Uygulama dilini seç.</div></div>
              <div className="select"><select value={s.lang || "Türkçe"} onChange={(e) => { upd("lang", e.target.value); toast(e.target.value + " seçildi"); }}>
                <option>Türkçe</option><option>English</option></select></div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-clock" /></svg></div>
              <div className="b"><div className="t">Zaman Formatı</div><div className="d">Saat ve tarih gösterim biçimini seç.</div></div>
              <div className="select"><select value={s.timeFmt || "24 Saat"} onChange={(e) => upd("timeFmt", e.target.value)}>
                <option>24 Saat</option><option>12 Saat</option></select></div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-volume" /></svg></div>
              <div className="b"><div className="t">Ses Efektleri</div><div className="d">Alarm ve uygulama seslerini aç veya kapat.</div></div>
              <Toggle k="sfx" {...tg} />
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-waves" /></svg></div>
              <div className="b"><div className="t">Arka Plan Ambiyansı</div><div className="d">Odak modunda arka plan deniz seslerini aç veya kapat.</div></div>
              <Toggle k="ambient" {...tg} />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-camera" /></svg> Kamera ve Odak Takibi</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-camera" /></svg></div>
              <div className="b"><div className="t">Kamera</div><div className="d">Odak takibi için kullanılacak kamerayı seç.</div></div>
              <div className="select">
                <select value={s.camId || ""} onChange={async (e) => { upd("camId", e.target.value); await Cam.setDevice(e.target.value); toast("Kamera değiştirildi"); }}>
                  <option value="">Varsayılan Kamera</option>
                  {cams.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || "Kamera " + (i + 1)}</option>)}
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-eye" /></svg></div>
              <div className="b"><div className="t">Göz Kapanma Hassasiyeti</div><div className="d">EAR eşiğini ayarlar — yüksek hassasiyet kapanmayı daha erken algılar.</div></div>
              <input type="range" className="slider" min="0" max="100" value={sens}
                onChange={(e) => { const v = +e.target.value; upd("sens", v); setCamValue("EAR_ESIK", 0.14 + (v / 100) * 0.12); }} />
              <span style={{ fontSize: "12.5px", fontWeight: 700, width: 44, textAlign: "right" }}>{sensLbl}</span>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-alert" /></svg></div>
              <div className="b"><div className="t">Uyarı Eşiği</div><div className="d">Kaç saniye göz kapalı kalırsa alarm verilsin?</div></div>
              <div className="select">
                <select value={s.thresh || "2"} onChange={(e) => { upd("thresh", e.target.value); setCamValue("KAPALI_SURE_ESIGI", parseFloat(e.target.value)); toast("Uyarı eşiği: " + e.target.value + " sn"); }}>
                  <option value="1">1 saniye</option><option value="2">2 saniye</option>
                  <option value="3">3 saniye</option><option value="5">5 saniye</option>
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-user" /></svg></div>
              <div className="b"><div className="t">Yüz Kaybı Eşiği</div><div className="d">Yüz kaç saniye görünmezse alarm verilsin?</div></div>
              <div className="select">
                <select value={s.faceThresh || "4"} onChange={(e) => { upd("faceThresh", e.target.value); setCamValue("YUZ_YOK_ESIGI", parseFloat(e.target.value)); toast("Yüz kaybı eşiği: " + e.target.value + " sn"); }}>
                  <option value="3">3 saniye</option><option value="4">4 saniye</option>
                  <option value="6">6 saniye</option><option value="10">10 saniye</option>
                </select>
              </div>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-monitor" /></svg></div>
              <div className="b"><div className="t">Kamera Önizlemesi</div><div className="d">Kapatılırsa takip sürer ama görüntü gizlenir.</div></div>
              <Toggle k="preview" {...tg} />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h"><svg width="18" height="18"><use href="#i-cloud" /></svg> Veri ve Senkronizasyon</div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-cloud" /></svg></div>
              <div className="b"><div className="t">Bulut Senkronizasyonu</div><div className="d">Verilerini buluta yedekle (backend bağlanınca aktif olur).</div></div>
              <Toggle k="sync" def={false} {...tg} />
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-download" /></svg></div>
              <div className="b"><div className="t">Verileri Dışa Aktar</div><div className="d">Tüm verilerini JSON olarak dışa aktar (yedek / paylaşım).</div></div>
              <button className="btn-outline" onClick={exportData}>
                <svg width="15" height="15"><use href="#i-download" /></svg> Dışa Aktar
              </button>
            </div>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-trash" /></svg></div>
              <div className="b"><div className="t">Verileri Temizle</div><div className="d">Odak süreleri, görevler, balıklar ve tüm istatistikleri kalıcı olarak sil.</div></div>
              <button className="btn-danger-o" onClick={() => setConfirmClear(true)}>
                <svg width="15" height="15"><use href="#i-trash" /></svg> Temizle
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card set-group">
            <div className="set-h" style={{ borderBottom: "none", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="18" height="18"><use href="#i-bell" /></svg> Odak Hatırlatıcıları
              </span>
              <Toggle k="reminders" {...tg} />
            </div>
            <div style={{ padding: "0 22px 6px", color: "var(--muted)", fontSize: "12.5px", marginTop: "-4px" }}>
              Belirlediğin aralıklarla odaklanman için hatırlatıcılar al.
            </div>
            <div className="set-row" style={{ marginTop: "8px" }}>
              <div className="b"><div className="t">Hatırlatıcı Aralığı</div></div>
              <div className="select"><select value={s.remInt || "25 dakika"} onChange={(e) => upd("remInt", e.target.value)}>
                <option>15 dakika</option><option>25 dakika</option><option>50 dakika</option></select></div>
            </div>
            <div className="set-row">
              <div className="b"><div className="t">Kısa Mola Süresi</div></div>
              <div className="select"><select value={s.shortBreak || "5 dakika"} onChange={(e) => upd("shortBreak", e.target.value)}>
                <option>5 dakika</option><option>10 dakika</option></select></div>
            </div>
            <div className="set-row">
              <div className="b"><div className="t">Uzun Mola Süresi</div></div>
              <div className="select"><select value={s.longBreak || "15 dakika"} onChange={(e) => upd("longBreak", e.target.value)}>
                <option>10 dakika</option><option>15 dakika</option><option>20 dakika</option></select></div>
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h" style={{ borderBottom: "none", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="18" height="18"><use href="#i-star" /></svg> Motivasyon Mesajları
              </span>
              <Toggle k="motiv" {...tg} />
            </div>
            <div style={{ padding: "0 22px", color: "var(--muted)", fontSize: "12.5px", marginTop: "-4px" }}>
              Mesajlar belirli aralıklarla kendiliğinden değişir.
            </div>
            <div className="quote-box">
              <svg width="26" height="26"><use href="#i-quote" /></svg>
              <div className="q">{C.MOTIVASYON[quoteIdx]}</div>
              <img src="assets/img/quote_boat.png" alt="" />
            </div>
          </div>

          <div className="card set-group">
            <div className="set-h">
              <svg width="18" height="18"><use href="#i-moon" /></svg> Tema
              <span style={{ fontWeight: 500, color: "var(--muted)", fontSize: "12px", marginLeft: "auto" }}>Uygulama temasını seç.</span>
            </div>
            <div className="themes">
              {[["light", "i-sun", "Açık"], ["dark", "i-moon", "Koyu"], ["system", "i-monitor", "Sistem"]].map(([k, ic, l]) => (
                <button key={k} className={"theme-opt" + ((s.theme || "light") === k ? " sel" : "")}
                  onClick={() => { applyTheme(k); toast("Tema: " + l); }}>
                  <svg width="22" height="22"><use href={`#${ic}`} /></svg> {l}
                </button>
              ))}
            </div>
          </div>

          <div className="prem">
            <div className="t"><svg width="19" height="19"><use href="#i-crown" /></svg> Premium Özellikler</div>
            <div className="d">Daha fazlası için yükselt!</div>
            <ul>
              {["Sınırsız odak seansı", "Detaylı istatistik raporları", "Özel ambiyans sesleri", "Veri yedekleme ve geri yükleme"].map((t) => (
                <li key={t}><svg width="15" height="15"><use href="#i-check-c" /></svg> {t}</li>
              ))}
            </ul>
            <button className="btn-prem" onClick={() => setPrem(true)}>Premium'a Geç</button>
            <img src="assets/img/premium_lighthouse.png" alt="" />
          </div>

          <div className="card set-group" style={{ marginTop: "24px" }}>
            <div className="set-row">
              <div className="set-ic"><svg width="17" height="17"><use href="#i-user" /></svg></div>
              <div className="b"><div className="t">Oturumu Kapat</div><div className="d">{Storage.user}</div></div>
              <button className="btn-outline" onClick={logout}>Çıkış Yap</button>
            </div>
          </div>
        </div>
      </div>

      {confirmClear && (
        <Modal title="Verileri Temizle" onClose={() => setConfirmClear(false)}>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
            Emin misin, Kaptan? <b>{Storage.user}</b> hesabındaki odak süreleri, geçmiş görevler,
            balık koleksiyonu, grafikler ve tüm istatistikler <b>kalıcı olarak</b> silinecek. Bu işlem geri alınamaz.
          </p>
          <div className="actions">
            <button className="btn-outline" onClick={() => setConfirmClear(false)}>Vazgeç</button>
            <button className="btn-danger-o" onClick={() => {
              Storage.clearAll();
              setConfirmClear(false);
              bump();
              toast("Tüm verilerin temizlendi. Temiz bir sayfa, yeni bir rota ⚓");
            }}>
              <svg width="15" height="15"><use href="#i-trash" /></svg> Evet, Hepsini Sil
            </button>
          </div>
        </Modal>
      )}

      {prem && (
        <Modal title="Premium'a Geç" onClose={() => setPrem(false)}>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "14px" }}>
            Sınırsız seans, detaylı raporlar, özel ambiyans sesleri ve yedekleme — hepsi tek pakette.
          </p>
          <div style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: "26px", marginBottom: "18px" }}>
            ₺49,99<span style={{ fontSize: "14px", color: "var(--muted)" }}> / ay</span>
          </div>
          <div className="actions">
            <button className="btn-outline" onClick={() => setPrem(false)}>Belki sonra</button>
            <button className="btn-red" style={{ padding: "11px 22px", fontSize: "14px" }}
              onClick={() => { setPrem(false); toast("Bu bir demo — ödeme alınmadı, ama ruhun premium Kaptan! 👑"); }}>
              Hemen Yükselt
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
