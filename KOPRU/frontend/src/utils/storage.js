import { API_BASE } from "./config.js";

const LIST_COLLECTIONS = ["tasks", "fish", "sessions", "warnings", "notifs"];
const OBJECT_COLLECTIONS = ["profile", "settings", "starts"];
const AI_KEY_STORAGE = "kopru:aiKey";

export const Storage = {
  user: null,
  token: null,
  cache: {},
  ready: false,

  async _authRequest(path, email, password, name) {
    const body = { email, password };
    if (name) body.name = name;
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "İşlem başarısız");
    return data;
  },

  async login(email, password, remember, registerName) {
    const data = registerName
      ? await this._authRequest("/auth/register", email, password, registerName)
      : await this._authRequest("/auth/login", email, password);

    this.token = data.token;
    this.user = email.toLowerCase().trim();
    if (remember) {
      localStorage.setItem("kopru:token", this.token);
      localStorage.setItem("kopru:currentUser", this.user);
    }
    await this._loadAll();
    return data;
  },

  /* Google Identity Services'ten gelen kimlik jetonuyla giriş */
  async googleLogin(credential, remember) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Google girişi başarısız");

    this.token = data.token;
    this.user = (data.email || "").toLowerCase().trim();
    if (remember) {
      localStorage.setItem("kopru:token", this.token);
      localStorage.setItem("kopru:currentUser", this.user);
    }
    await this._loadAll();
    return data;
  },

  logout() {
    localStorage.removeItem("kopru:token");
    localStorage.removeItem("kopru:currentUser");
    this.user = null;
    this.token = null;
    this.cache = {};
    this.ready = false;
  },

  rememberedUser() {
    return localStorage.getItem("kopru:currentUser");
  },

  async restoreSession() {
    const token = localStorage.getItem("kopru:token");
    const user = localStorage.getItem("kopru:currentUser");
    if (!token || !user) return false;
    this.token = token;
    this.user = user;
    try {
      await this._loadAll();
      return true;
    } catch {
      this.logout();
      return false;
    }
  },

  _headers() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` };
  },

  async _loadAll() {
    const all = [...OBJECT_COLLECTIONS, ...LIST_COLLECTIONS];
    const results = await Promise.all(
      all.map((col) => fetch(`${API_BASE}/${col}`, { headers: this._headers() }))
    );
    if (results.some((r) => r.status === 401)) {
      throw new Error("Oturum geçersiz");
    }
    for (let i = 0; i < all.length; i++) {
      const res = results[i];
      this.cache[all[i]] = res.ok ? await res.json() : OBJECT_COLLECTIONS.includes(all[i]) ? {} : [];
    }
    const localAiKey = localStorage.getItem(AI_KEY_STORAGE);
    if (localAiKey) this.cache.settings = { ...this.cache.settings, aiKey: localAiKey };
    this.ready = true;
  },

  get(col, fallback) {
    const v = this.cache[col];
    if (v === undefined || v === null) return fallback;
    if (Array.isArray(v)) return v.map((item) => (item && typeof item === "object" ? { ...item } : item));
    if (typeof v === "object") return { ...v };
    return v;
  },

  set(col, val) {
    const prev = this.cache[col];
    this.cache[col] = val;

    if (col === "settings") {
      if (val && "aiKey" in val) {
        if (val.aiKey) localStorage.setItem(AI_KEY_STORAGE, val.aiKey);
        else localStorage.removeItem(AI_KEY_STORAGE);
      }
      const { aiKey, ...toSend } = val || {};
      void aiKey;
      this._syncObject(col, toSend);
    } else if (OBJECT_COLLECTIONS.includes(col)) {
      this._syncObject(col, val);
    } else if (LIST_COLLECTIONS.includes(col)) {
      this._syncList(col, Array.isArray(prev) ? prev : [], val);
    }
    return val;
  },

  update(col, fn, fallback) {
    const current = this.get(col, fallback);
    const copy = Array.isArray(current) ? [...current] : { ...current };
    const v = fn(copy);
    return this.set(col, v);
  },

  push(col, item) {
    return this.update(col, (a) => { a.unshift ? a.unshift(item) : a.push(item); return a; }, []);
  },

  /* Sunucuda kayıt oluşturup GERÇEK id ile birlikte döner (awaitable).
     Oluşturulur oluşturulmaz referans alınması gereken kayıtlar (örn. yeni
     yakalanan balık) için kullanılır — geçici bir yerel id üretip sonra
     arka planda değiştirmek yerine, sunucu cevabını bekler. */
  async createItem(col, payload) {
    const res = await fetch(`${API_BASE}/${col}`, {
      method: "POST", headers: this._headers(), body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = new Error("Kayıt oluşturulamadı");
      this._notifyError(col, "eklenemedi", e);
      throw e;
    }
    const created = await res.json();
    const arr = Array.isArray(this.cache[col]) ? this.cache[col] : [];
    arr.unshift(created);
    this.cache[col] = arr;
    return created;
  },

  _notifyError(col, action, e) {
    console.error(`[Storage] ${col} ${action}:`, e);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kopru:sync-error", { detail: { col, action, message: e?.message } }));
    }
  },

  _syncObject(col, val) {
    fetch(`${API_BASE}/${col}`, { method: "PUT", headers: this._headers(), body: JSON.stringify(val) })
      .catch((e) => this._notifyError(col, "kaydedilemedi", e));
  },

  async _syncList(col, oldArr, newArr) {
    const oldMap = new Map(oldArr.map((x) => [x.id, x]));
    const newMap = new Map(newArr.map((x) => [x.id, x]));

    for (const id of oldMap.keys()) {
      if (!newMap.has(id)) {
        fetch(`${API_BASE}/${col}/${id}`, { method: "DELETE", headers: this._headers() })
          .catch((e) => this._notifyError(col, "silinemedi", e));
      }
    }

    for (const [id, item] of newMap) {
      const old = oldMap.get(id);
      const { id: itemId, ...payload } = item;
      void itemId;

      if (!old) {
        try {
          const res = await fetch(`${API_BASE}/${col}`, {
            method: "POST", headers: this._headers(), body: JSON.stringify(payload),
          });
          if (res.ok) {
            const created = await res.json();
            const arr = this.cache[col];
            const idx = arr.findIndex((x) => x.id === id);
            if (idx !== -1) arr[idx] = created;
          }
        } catch (e) { this._notifyError(col, "eklenemedi", e); }
      } else if (JSON.stringify(old) !== JSON.stringify(item)) {
        fetch(`${API_BASE}/${col}/${id}`, {
          method: "PATCH", headers: this._headers(), body: JSON.stringify(payload),
        }).catch((e) => this._notifyError(col, "güncellenemedi", e));
      }
    }
  },

  exportAll() {
    return { kullanici: this.user, tarih: new Date().toISOString(), ...this.cache };
  },
};

if (typeof window !== "undefined") window.Storage = Storage;
export default Storage;
