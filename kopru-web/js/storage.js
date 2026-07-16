"use strict";
/* ============================================================
   KÖPRÜ — Veri Katmanı (kullanıcıya özel)
   Şu an localStorage kullanır; her kullanıcının verisi kendi
   anahtarında saklanır: "kopru:<kullanıcı>:<koleksiyon>"

   VERİTABANINA GEÇİŞ:
   Aşağıdaki Storage nesnesi tek adaptördür. Bir REST API'ye
   bağlamak için yalnızca _read/_write fonksiyonlarını fetch()
   çağrılarıyla değiştirmen yeterli — uygulamanın geri kalanı
   Storage.get/set/update dışında hiçbir şey bilmez.

   Örnek:
     async _read(col){ return (await fetch(`/api/${this.user}/${col}`)).json(); }
     async _write(col,val){ await fetch(`/api/${this.user}/${col}`,
       {method:"PUT", headers:{"Content-Type":"application/json"},
        body:JSON.stringify(val)}); }

   Koleksiyonlar:
     profile   {name, level, xp, xpMax, joined}
     tasks     [{id,name,cat,prio,dur,group,date,done,createdAt}]
     fish      [{id,name,file,tier,minutes,date,isNew}]
     sessions  [{start,minutes,mode,completed,hour,date}]
     warnings  [{time,reason}]
     settings  {theme,sens,thresh,camId,preview,sfx,ambient,...}
   ============================================================ */
window.Storage = {
  user: null,

  /* ---- kullanıcı oturumu ---- */
  login(email, remember) {
    this.user = (email || "misafir").toLowerCase().trim();
    if (remember) localStorage.setItem("kopru:currentUser", this.user);
    return this.user;
  },
  logout() { localStorage.removeItem("kopru:currentUser"); this.user = null; },
  rememberedUser() { return localStorage.getItem("kopru:currentUser"); },

  /* ---- düşük seviye (DB'ye geçerken sadece burayı değiştir) ---- */
  _key(col) { return `kopru:${this.user}:${col}`; },
  _read(col, fallback) {
    try {
      const raw = localStorage.getItem(this._key(col));
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  _write(col, val) { localStorage.setItem(this._key(col), JSON.stringify(val)); },

  /* ---- genel API ---- */
  get(col, fallback) { return this._read(col, fallback); },
  set(col, val) { this._write(col, val); return val; },
  update(col, fn, fallback) { const v = fn(this._read(col, fallback)); this._write(col, v); return v; },
  push(col, item) { return this.update(col, a => { a.push(item); return a; }, []); },

  /* ---- tüm verileri temizle (Ayarlar > Verileri Temizle) ---- */
  clearAll() {
    const on = `kopru:${this.user}:`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(on))
      .forEach(k => localStorage.removeItem(k));
  },

  /* ---- dışa aktarma (paylaşım / yedek) ---- */
  exportAll() {
    const on = `kopru:${this.user}:`, out = { kullanici: this.user, tarih: new Date().toISOString() };
    Object.keys(localStorage).filter(k => k.startsWith(on)).forEach(k => {
      try { out[k.slice(on.length)] = JSON.parse(localStorage.getItem(k)); } catch {}
    });
    return out;
  }
};
