/* KÖPRÜ — ortak yardımcılar (tarih/format) */
export const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function iso(d) {
  const x = d || new Date();
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
}
export function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
export function fmtH(s) {
  return String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor((s % 3600) / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
export function fmtMin(m) {
  m = Math.round(m);
  return m >= 60 ? Math.floor(m / 60) + "sa " + (m % 60 ? (m % 60) + "dk" : "") : m + "dk";
}
export function trDate(isoStr) {
  try {
    return new Date(isoStr + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return isoStr;
  }
}
/* Pzt..Paz ISO listesi (offset: 0 bu hafta, -1 geçen hafta) */
export function weekDays(offset = 0) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return iso(d);
  });
}
/* Profil fotoğrafını 256px'e küçültüp dataURL döndürür (localStorage'a sığması için) */
export function readAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 256;
      const c = document.createElement("canvas");
      c.width = S; c.height = S;
      const ctx = c.getContext("2d");
      const r = Math.max(S / img.width, S / img.height);
      const w = img.width * r, h = img.height * r;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function delta(cur, prev) {
  if (!prev) return cur ? "↗ Yeni!" : "";
  const p = Math.round(((cur - prev) / prev) * 100);
  return (p >= 0 ? "↗ %" + p : "↘ %" + Math.abs(p)) + " geçen haftaya göre";
}
