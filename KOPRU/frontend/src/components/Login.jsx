import { useState, useEffect, useRef } from "react";
import { useApp } from "../state/AppContext.jsx";
import { GOOGLE_CLIENT_ID } from "../utils/config.js";

/* Google Identity Services betiğini bir kez yükler */
function gisYukle() {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (!gisYukle._p) {
    gisYukle._p = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }
  return gisYukle._p;
}

export default function Login() {
  const { login, loginWithGoogle, toast, t, lang } = useApp();
  const [reg, setReg] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pass: "", remember: false });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const googleRef = useRef(null);
  const rememberRef = useRef(form.remember);
  rememberRef.current = form.remember;

  /* Google butonu — istemci kimliği tanımlıysa gerçek GIS butonu çizilir */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let iptal = false;
    gisYukle().then((ok) => {
      if (!ok || iptal || !googleRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (yanit) => {
            setBusy(true);
            try {
              await loginWithGoogle(yanit.credential, rememberRef.current);
            } catch (e) {
              setErr({ email: e.message || t("Google girişi başarısız") });
            } finally {
              setBusy(false);
            }
          },
        });
        googleRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 360,
          locale: lang === "en" ? "en" : "tr",
        });
      } catch {
        /* GIS başlatılamadıysa buton gizli kalır */
      }
    });
    return () => { iptal = true; };
  }, [loginWithGoogle, t, lang]);

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (reg && !form.name.trim()) x.name = t("Lütfen adını gir.");
    if (!form.email.trim()) x.email = t("E-posta adresi gerekli.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) x.email = t("Geçerli bir e-posta adresi gir.");
    if (!form.pass) x.pass = t("Şifre gerekli.");
    else if (form.pass.length < 6) x.pass = t("Şifre en az 6 karakter olmalı.");
    setErr(x);
    if (Object.keys(x).length) return;

    setBusy(true);
    try {
      await login(form.email.trim(), form.pass, form.remember, reg ? form.name.trim() : null);
    } catch (e2) {
      setErr({ email: e2.message || t("Bir şeyler ters gitti, tekrar dene.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="loginScreen">
      {/* Arka plan videosu */}
      <video className="login-video" autoPlay muted loop playsInline src="assets/video/login_bg.mp4" />
      <div className="login-video-dim" />

      <div className="login-card">
        <div className="login-logo"><img src="assets/img/logo.png" alt="KÖPRÜ logo" /><span>KÖPRÜ</span></div>
        <div className="login-anchor"><svg width="20" height="20"><use href="#i-anchor" /></svg></div>
        <h1>{t("Odaklan. İlerle. Köprü kur.")}</h1>
        <p className="login-sub">{t("Her odak seansı, seni hedeflerine bir adım daha yaklaştırır.")}</p>

        <div className="login-tabs">
          <button type="button" className={!reg ? "active" : ""} onClick={() => setReg(false)}>{t("Giriş Yap")}</button>
          <button type="button" className={reg ? "active" : ""} onClick={() => setReg(true)}>{t("Kayıt Ol")}</button>
        </div>

        <form onSubmit={submit} noValidate>
          {reg && (
            <>
              <div className={"field" + (err.name ? " err" : "")}>
                <svg width="19" height="19"><use href="#i-user" /></svg>
                <input type="text" placeholder={t("Adınız ve soyadınız")} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field-msg">{err.name || ""}</div>
            </>
          )}
          <div className={"field" + (err.email ? " err" : "")}>
            <svg width="19" height="19"><use href="#i-user" /></svg>
            <input type="email" placeholder={t("E-posta adresiniz")} autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field-msg">{err.email || ""}</div>
          <div className={"field" + (err.pass ? " err" : "")}>
            <svg width="19" height="19"><use href="#i-lock" /></svg>
            <input type={showPass ? "text" : "password"} placeholder={t("Şifreniz")} autoComplete="current-password"
              value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
            <button type="button" className="eye" onClick={() => setShowPass(!showPass)} aria-label="Şifreyi göster/gizle">
              <svg width="19" height="19"><use href={showPass ? "#i-eye" : "#i-eye-off"} /></svg>
            </button>
          </div>
          <div className="field-msg">{err.pass || ""}</div>

          <div className="login-row">
            <label>
              <input type="checkbox" className="chk" checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })} /> {t("Beni hatırla")}
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); toast(t("Sıfırlama bağlantısı e-postana gönderildi (demo)")); }}>
              {t("Şifremi unuttum?")}
            </a>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? t("Bir saniye...") : reg ? t("Kayıt Ol") : t("Giriş Yap")}
            <svg width="18" height="18" style={{ transform: "rotate(-90deg)" }}><use href="#i-chev-d" /></svg>
          </button>
        </form>

        <div className="login-or">{t("veya")}</div>

        {GOOGLE_CLIENT_ID ? (
          /* Gerçek Google girişi (Identity Services) */
          <div className="google-host" ref={googleRef} />
        ) : (
          /* İstemci kimliği tanımlı değil → demo hesabıyla hızlı giriş */
          <button type="button" className="btn-google" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await login("google-kullanicisi@kopru.app", "demo-google-123", form.remember, "Google Kullanıcısı");
            } catch {
              try { await login("google-kullanicisi@kopru.app", "demo-google-123", form.remember, null); }
              catch (e3) { setErr({ email: e3.message }); }
            } finally { setBusy(false); }
          }}>
            <svg width="19" height="19" viewBox="0 0 24 24"><use href="#i-google" /></svg> {t("Google ile devam et")}
          </button>
        )}
        <p className="login-foot">
          {reg ? t("Zaten hesabın var mı?") + " " : t("Hesabın yok mu?") + " "}
          <a onClick={() => setReg(!reg)}>{reg ? t("Giriş yap") : t("Kayıt ol")}</a>
        </p>
      </div>
    </div>
  );
}
