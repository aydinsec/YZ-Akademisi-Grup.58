/* ============================================================
   KÖPRÜ — Veri Katmanı (kullanıcıya özel)
   localStorage kullanır; her kullanıcının verisi kendi
   anahtarında saklanır: "kopru:<kullanıcı>:<koleksiyon>"

   VERİTABANINA GEÇİŞ: yalnızca _read/_write fonksiyonlarını
   fetch() çağrılarıyla değiştirin — uygulamanın geri kalanı
   Storage.get/set/update/push dışında hiçbir şey bilmez.

   Koleksiyonlar:
     profile   {name, level, xp, xpMax, joined}
     tasks     [{id,name,cat,prio,dur,group,done,doneAt,createdAt}]
     fish      [{id,name,file,tier,minutes,date,isNew}]
     sessions  [{date,minutes,mode,hour,completed,ts}]
     warnings  [{time,reason}]
     settings  {theme,sens,thresh,faceThresh,camId,preview,sfx,ambient,...}
     notifs    [{icon,t,d,ts}]
     starts    {"YYYY-MM-DD": adet}
   ============================================================ */
export const Storage = {
  user: null,

  login(email, remember) {
    this.user = (email || "misafir").toLowerCase().trim();
    if (remember) localStorage.setItem("kopru:currentUser", this.user);
    return this.user;
  },
  logout() {
    localStorage.removeItem("kopru:currentUser");
    this.user = null;
  },
  rememberedUser() {
    return localStorage.getItem("kopru:currentUser");
  },

  /* ---- düşük seviye (DB'ye geçerken sadece burayı değiştir) ---- */
  _key(col) { return `kopru:${this.user}:${col}`; },
  _read(col, fallback) {
    try {
      const raw = localStorage.getItem(this._key(col));
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  _write(col, val) { localStorage.setItem(this._key(col), JSON.stringify(val)); },

  /* ---- genel API ---- */
  get(col, fallback) { return this._read(col, fallback); },
  set(col, val) { this._write(col, val); return val; },
  update(col, fn, fallback) { const v = fn(this._read(col, fallback)); this._write(col, v); return v; },
  push(col, item) { return this.update(col, (a) => { a.push(item); return a; }, []); },

  clearAll() {
    const on = `kopru:${this.user}:`;
    Object.keys(localStorage).filter((k) => k.startsWith(on)).forEach((k) => localStorage.removeItem(k));
  },

  exportAll() {
    const on = `kopru:${this.user}:`;
    const out = { kullanici: this.user, tarih: new Date().toISOString() };
    Object.keys(localStorage).filter((k) => k.startsWith(on)).forEach((k) => {
      try { out[k.slice(on.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* boş */ }
    });
    return out;
  },
};

if (typeof window !== "undefined") window.Storage = Storage;
export default Storage;
