/* ============================================================
   KÖPRÜ — Akıllı Görev Ayrıştırıcı
   Serbest yazılmış bir metni ("bugün 15000 veri etiketlenecek,
   kargoyu götürmem lazım, tez yazımını tamamlayacağım...")
   kategori + öncelik + süre tahminli görev listesine çevirir.

   İki motor:
   1) parseLocal()  — tarayıcıda çalışan kural tabanlı ayrıştırıcı
                      (internet/anahtar gerektirmez, her zaman çalışır)
   2) parseWithLLM() — Ayarlar'da API anahtarı varsa gerçek LLM;
                      hata olursa otomatik olarak yerel motora düşer

   Çıktı biçimi (uygulamanın görev şemasıyla birebir):
     { name, cat, prio, dur, group }
   ============================================================ */

/* ---------- 1. Cümle/madde bölme ---------- */
/* Noktalama, satır sonu, madde işaretleri ve "... lazım/gerek" gibi
   bitişlerden sonra gelen bağlaçlardan böler. */
const EYLEM = /\b(?:yap|al|oku|yaz|ayarla|hazırla|tamamla|öde|gönder|ara|git|uğra|temizle|düzenle|çöz|incele|bitir|kur|planla|gözden|kontrol|teslim|hallet|bak|çek|ver|başla)\w*\b/i;

function splitByVe(s) {
  const parts = s.split(/\s+ve\s+/i);
  if (parts.length < 2) return [s];
  const out = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const kelime = p.trim().split(/\s+/).length;
    /* sağ taraf 3+ kelimelik bir eylem cümlesiyse ayrı görev, değilse birleştir */
    if (kelime >= 3 && EYLEM.test(p)) out.push(p);
    else out[out.length - 1] += " ve " + p;
  }
  return out;
}

function splitItems(text) {
  const parts = text
    .replace(/\r/g, "")
    /* madde işaretleri ve numaralandırma */
    .replace(/^[\s]*[-•*–—]\s*/gm, "\n")
    .replace(/^\s*\d+[.)]\s*/gm, "\n")
    /* satır sonu, nokta/noktalı virgül ve virgülden böl */
    .split(/\n+|[;.!?]+|,/)
    /* "bir de / ayrıca / sonra / ardından" bağlaçlarından da böl */
    .flatMap((s) => s.split(/\s+(?:bir de|birde|ayrıca|ardından|daha sonra|sonra da|sonra)\s+/i))
    /* "ve" ile bölme: yalnızca sağ taraf en az 3 kelimelik bir eylemse.
       Böylece "A yap ve danışmanla toplantı ayarla" bölünür,
       "ekmek ve süt al" gibi nesne listeleri bölünmez. */
    .flatMap((s) => splitByVe(s))
    .map((s) => s.trim())
    .filter(Boolean);

  /* Çok kısa parçalar (tek kelimelik ekler) önceki maddeye yapıştırılır */
  const out = [];
  for (const p of parts) {
    const wordCount = p.split(/\s+/).length;
    if (wordCount < 2 && out.length) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out.filter((s) => s.length > 2);
}

/* ---------- 2. Sözlükler ---------- */
const CATEGORY_RULES = [
  {
    cat: "Akademik",
    words: ["tez", "ödev", "makale", "literatür", "kaynak taraması", "sunum", "slayt", "rapor", "ders", "sınav", "quiz", "final", "vize", "not tut", "çalış", "konu anlatım", "test çöz", "soru çöz", "araştırma", "makale oku", "veri etiketle", "etiketle", "veri seti", "model eğit", "kod yaz", "kod", "refactor", "debug", "hata ayıkla", "algoritma", "analiz", "grafik", "makine öğrenmesi", "yapay zeka", "proje", "döküman", "dokümantasyon", "sprint", "toplantı notu", "malzeme listesi", "parça listesi", "drone", "devre", "prototip", "test yaz"],
  },
  {
    cat: "Sağlık",
    words: ["eczane", "ilaç", "doktor", "randevu", "hastane", "diş", "check-up", "kontrol muayene", "spor", "koş", "yürüyüş", "egzersiz", "antrenman", "yoga", "pilates", "diyet", "su iç", "uyku", "tahlil", "aşı", "fizyoterapi", "psikolog", "terapi"],
  },
  {
    cat: "Kişisel",
    words: ["kargo", "market", "alışveriş", "fatura", "banka", "temizlik", "bulaşık", "çamaşır", "ütü", "yemek", "market listesi", "araba", "servis", "kuaför", "berber", "arkadaş", "aile", "anne", "baba", "doğum günü", "hediye", "ziyaret", "tamir", "kira", "ödeme", "kütüphane", "kitap oku", "temizle", "topla", "düzenle", "postane", "kuru temizleme"],
  },
];

/* Sürede etkili anahtar kelimeler: [regex, dakika] */
const DURATION_HINTS = [
  { re: /\b(tez|makale yaz|literatür|araştırma raporu)\b/i, min: 90 },
  { re: /\b(sunum|slayt|deck)\b/i, min: 60 },
  { re: /\b(rapor|doküman|dokümantasyon)\b/i, min: 60 },
  { re: /\b(etiketle|veri seti|veri temizle)\b/i, min: 60 },
  { re: /\b(model eğit|eğitim başlat|fine.?tun)\b/i, min: 90 },
  { re: /\b(kod yaz|geliştir|implement|refactor|hata ayıkla|debug)\b/i, min: 75 },
  { re: /\b(analiz|grafik|görselleştir)\b/i, min: 50 },
  { re: /\b(oku|incele|gözden geçir)\b/i, min: 40 },
  { re: /\b(liste hazırla|liste çıkar|malzeme listesi|planla)\b/i, min: 30 },
  { re: /\b(mail|e.?posta|yaz(ış)?ma|mesaj at|ara(mak)?|telefon)\b/i, min: 15 },
  { re: /\b(toplantı|görüşme|call)\b/i, min: 45 },
  { re: /\b(kargo|postane|eczane|market|alışveriş|fatura|banka)\b/i, min: 25 },
  { re: /\b(temizlik|topla|düzenle|bulaşık|çamaşır)\b/i, min: 35 },
  { re: /\b(spor|koş|yürüyüş|antrenman|egzersiz|yoga)\b/i, min: 45 },
  { re: /\b(doktor|randevu|hastane|tahlil)\b/i, min: 60 },
  { re: /\b(ders çalış|konu anlat|test çöz|soru çöz)\b/i, min: 50 },
];

/* Öncelik ipuçları */
const PRIO_HIGH = /\b(acil|bugün|hemen|son gün|deadline|teslim|yetiştir|kesin|mutlaka|ilk iş|önemli|unutma)\b/i;
const PRIO_LOW = /\b(müsait olursa|zamanım kalırsa|fırsat bulursam|bir ara|acele yok|istersem|opsiyonel)\b/i;

/* Zaman ipuçları */
const UPCOMING = /\b(yarın|haftaya|gelecek hafta|önümüzdeki|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|ayın \d+|\d+\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık))\b/i;

/* Temizlenecek dolgu ifadeleri */
const FILLERS = [
  /^\s*(bugün|yarın|akşam|sabah|öğleden sonra|gece|bu hafta|haftaya|hemen)\s+/i,
  /\s*\b(lazım|gerek(iyor)?|olsun|istiyorum|planlıyorum|niyetim var|unutma|unutmayayım)\b\.?\s*$/i,
  /\s*\b(bugün|yarın|akşam|sabah|bu hafta|haftaya)\b\.?\s*$/i,
  /^\s*(ayrıca|bir de|birde|sonra|ardından|ve)\s+/i,
];

/* ---------- 3. Yardımcılar ---------- */
function detectCategory(s) {
  const low = s.toLocaleLowerCase("tr");
  let best = { cat: "Diğer", score: 0 };
  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const w of rule.words) if (low.includes(w)) score += w.includes(" ") ? 2 : 1;
    if (score > best.score) best = { cat: rule.cat, score };
  }
  return best.cat;
}

function detectDuration(s) {
  const low = s.toLocaleLowerCase("tr");

  /* a) Kullanıcı süreyi açıkça yazmışsa onu kullan: "2 saat", "45 dk" */
  const explicit = low.match(/(\d+(?:[.,]\d+)?)\s*(saat|sa\b|dakika|dk\b|dak\b)/);
  if (explicit) {
    const n = parseFloat(explicit[1].replace(",", "."));
    const mins = /sa/.test(explicit[2]) ? n * 60 : n;
    return Math.max(5, Math.min(240, Math.round(mins / 5) * 5));
  }

  /* b) Anahtar kelimeye göre temel süre */
  let base = 30;
  for (const h of DURATION_HINTS) if (h.re.test(low)) { base = h.min; break; }

  /* c) Büyük sayı geçiyorsa iş yükü ağırdır (ör. "15000 veri etiketlenecek") */
  const bigNum = low.match(/\b(\d{3,})\b/);
  if (bigNum) {
    const n = parseInt(bigNum[1], 10);
    if (n >= 10000) base = Math.max(base, 120);
    else if (n >= 1000) base = Math.max(base, 90);
    else if (n >= 100) base = Math.max(base, 60);
  }

  /* d) Cümle uzunluğu küçük bir düzeltme */
  const words = low.split(/\s+/).length;
  if (words >= 12) base += 15;
  if (words <= 3 && base > 25) base -= 10;

  return Math.max(10, Math.min(240, Math.round(base / 5) * 5));
}

function detectPriority(s) {
  if (PRIO_LOW.test(s)) return "dusuk";
  if (PRIO_HIGH.test(s)) return "yuksek";
  return "orta";
}

function cleanName(s) {
  let out = s.trim();
  for (const f of FILLERS) out = out.replace(f, "");
  out = out.replace(/\s{2,}/g, " ").replace(/[,;:]+$/, "").trim();
  /* Baş harfi büyüt */
  if (out) out = out[0].toLocaleUpperCase("tr") + out.slice(1);
  /* Çok uzunsa kısalt */
  if (out.length > 80) out = out.slice(0, 77).trim() + "…";
  return out;
}

/* ---------- 4. Yerel motor ---------- */
export function parseLocal(text) {
  if (!text || !text.trim()) return [];
  const items = splitItems(text);
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const name = cleanName(raw);
    if (!name || name.length < 3) continue;
    const key = name.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      cat: detectCategory(raw),
      prio: detectPriority(raw),
      dur: detectDuration(raw),
      group: UPCOMING.test(raw) ? "upcoming" : "today",
    });
  }
  return out;
}

/* ---------- 5. LLM motoru (opsiyonel) ---------- */
const SYSTEM_PROMPT = `Sen bir üretkenlik asistanısın. Kullanıcının serbest yazdığı Türkçe not metnini görevlere ayırırsın.
Kurallar:
- Her iş için ayrı bir görev üret.
- "cat" yalnızca şunlardan biri olabilir: "Akademik", "Kişisel", "Sağlık", "Diğer".
- "prio" yalnızca: "yuksek", "orta", "dusuk". Acil/bugün/teslim vurgusu varsa yuksek.
- "dur": görevin gerçekçi odak süresi, DAKİKA cinsinden tam sayı (10-240 arası, 5'in katı).
  İş yükü büyükse (örn. binlerce veri) süreyi yüksek tut.
- "group": bugün yapılacaksa "today", ileri bir tarih belirtiliyorsa "upcoming".
- "name": kısa ve emir kipine yakın bir başlık (en fazla 80 karakter), dolgu sözcükleri ("lazım", "gerek") atılır.
YALNIZCA şu biçimde geçerli JSON dizisi döndür, başka hiçbir metin yazma:
[{"name":"...","cat":"...","prio":"...","dur":45,"group":"today"}]`;

function coerce(list) {
  const cats = ["Akademik", "Kişisel", "Sağlık", "Diğer"];
  const prios = ["yuksek", "orta", "dusuk"];
  return (Array.isArray(list) ? list : [])
    .filter((x) => x && typeof x.name === "string" && x.name.trim())
    .map((x) => ({
      name: x.name.trim().slice(0, 80),
      cat: cats.includes(x.cat) ? x.cat : "Diğer",
      prio: prios.includes(x.prio) ? x.prio : "orta",
      dur: Math.max(10, Math.min(240, Math.round((parseInt(x.dur, 10) || 30) / 5) * 5)),
      group: x.group === "upcoming" ? "upcoming" : "today",
    }));
}

function extractJson(txt) {
  const m = txt.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("JSON bulunamadı");
  return JSON.parse(m[0]);
}

async function callAnthropic(key, model, text) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!r.ok) throw new Error("Anthropic API " + r.status);
  const data = await r.json();
  return extractJson(data.content.map((c) => c.text || "").join(""));
}

async function callOpenAI(key, model, text) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + key },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });
  if (!r.ok) throw new Error("OpenAI API " + r.status);
  const data = await r.json();
  return extractJson(data.choices[0].message.content);
}

/**
 * Metni görevlere ayırır.
 * @returns {Promise<{items: Array, engine: "llm"|"local", error?: string}>}
 */
export async function parseTasks(text, settings = {}) {
  const key = (settings.aiKey || "").trim();
  const provider = settings.aiProvider || "anthropic";
  if (key) {
    try {
      const raw = provider === "openai"
        ? await callOpenAI(key, settings.aiModel, text)
        : await callAnthropic(key, settings.aiModel, text);
      const items = coerce(raw);
      if (items.length) return { items, engine: "llm" };
      throw new Error("Boş sonuç");
    } catch (e) {
      /* LLM başarısız → yerel motora düş */
      return { items: parseLocal(text), engine: "local", error: e.message };
    }
  }
  return { items: parseLocal(text), engine: "local" };
}

export const ORNEK_METIN =
  "15000 veri etiketlenecek bugün. Kargoyu götürmem lazım, tez yazımını tamamlayacağım, eczaneye uğrayıp ilaç almam gerek bir de drone parça malzeme listesi hazırlanacak";
