import { useState } from "react";
import { useApp } from "../state/AppContext.jsx";

export default function Login() {
  const { login, toast } = useApp();
  const [reg, setReg] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pass: "", remember: false });
  const [err, setErr] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (reg && !form.name.trim()) x.name = "Lütfen adını gir.";
    if (!form.email.trim()) x.email = "E-posta adresi gerekli.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) x.email = "Geçerli bir e-posta adresi gir.";
    if (!form.pass) x.pass = "Şifre gerekli.";
    else if (form.pass.length < 6) x.pass = "Şifre en az 6 karakter olmalı.";
    setErr(x);
    if (Object.keys(x).length) return;
    login(form.email.trim(), form.remember, reg ? form.name.trim() : null);
  };

  return (
    <div id="loginScreen">
      <div className="login-card">
        <div className="login-logo"><img src="assets/img/logo.png" alt="KÖPRÜ logo" /><span>KÖPRÜ</span></div>
        <div className="login-anchor"><svg width="20" height="20"><use href="#i-anchor" /></svg></div>
        <h1>Odaklan. İlerle. Köprü kur.</h1>
        <p className="login-sub">Her odak seansı, seni hedeflerine bir adım daha yaklaştırır.</p>

        <div className="login-tabs">
          <button type="button" className={!reg ? "active" : ""} onClick={() => setReg(false)}>Giriş Yap</button>
          <button type="button" className={reg ? "active" : ""} onClick={() => setReg(true)}>Kayıt Ol</button>
        </div>

        <form onSubmit={submit} noValidate>
          {reg && (
            <>
              <div className={"field" + (err.name ? " err" : "")}>
                <svg width="19" height="19"><use href="#i-user" /></svg>
                <input type="text" placeholder="Adınız ve soyadınız" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field-msg">{err.name || ""}</div>
            </>
          )}
          <div className={"field" + (err.email ? " err" : "")}>
            <svg width="19" height="19"><use href="#i-user" /></svg>
            <input type="email" placeholder="E-posta adresiniz" autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field-msg">{err.email || ""}</div>
          <div className={"field" + (err.pass ? " err" : "")}>
            <svg width="19" height="19"><use href="#i-lock" /></svg>
            <input type={showPass ? "text" : "password"} placeholder="Şifreniz" autoComplete="current-password"
              value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
            <button type="button" className="eye" onClick={() => setShowPass(!showPass)} aria-label="Şifreyi göster/gizle">
              <svg width="19" height="19"><use href={showPass ? "#i-eye" : "#i-eye-off"} /></svg>
            </button>
          </div>
          <div className="field-msg">{err.pass || ""}</div>

          <div className="login-row">
            <label>
              <input type="checkbox" className="chk" checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })} /> Beni hatırla
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); toast("Sıfırlama bağlantısı e-postana gönderildi (demo)"); }}>
              Şifremi unuttum?
            </a>
          </div>

          <button type="submit" className="btn-primary">
            {reg ? "Kayıt Ol" : "Giriş Yap"}
            <svg width="18" height="18" style={{ transform: "rotate(-90deg)" }}><use href="#i-chev-d" /></svg>
          </button>
        </form>

        <div className="login-or">veya</div>
        <button type="button" className="btn-google" onClick={() => login("google-kullanicisi@kopru.app", form.remember, null)}>
          <svg width="19" height="19" viewBox="0 0 24 24"><use href="#i-google" /></svg> Google ile devam et
        </button>
        <p className="login-foot">
          {reg ? "Zaten hesabın var mı? " : "Hesabın yok mu? "}
          <a onClick={() => setReg(!reg)}>{reg ? "Giriş yap" : "Kayıt ol"}</a>
        </p>
      </div>
    </div>
  );
}
