/* ============================================================
   KÖPRÜ — Yapılandırma
   köprü/realtime_uyari.py içindeki "Ayarlar" bloğunun karşılığı.
   Ayarlar sayfası bu değerleri çalışma anında günceller.
   ============================================================ */
/* Backend API adresi. Prod'a çıkarken bunu gerçek sunucu adresiyle değiştir. */
export const API_BASE = "http://localhost:8000";

export const KOPRU_CONFIG = {
  /* --- Odak takibi (realtime_uyari.py) --- */
  KAPALI_SURE_ESIGI: 2.0,
  YUZ_YOK_ESIGI: 4.0,
  EAR_ESIK: 0.20,
  YATIK_ACI: 30.0,
  EAR_ESIK_YATIK_CARPAN: 1.15,
  ALARM_SES: "assets/audio/alarm.mp3",

  LANDMARKER_URL: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  TASKS_VISION_CDN: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14",

  SOL_EAR: [33, 133, 160, 144, 158, 153],
  SAG_EAR: [362, 263, 385, 380, 387, 373],
  SOL_GOZ: [33, 133, 160, 159, 158, 144, 145, 153],
  SAG_GOZ: [362, 263, 387, 386, 385, 373, 374, 380],

  /* --- Oyunlaştırma --- */
  XP_SEANS: 50,
  XP_GOREV: 20,
  NADIRLIK_ESIKLERI: [
    { min: 60, tier: "efsanevi" },
    { min: 40, tier: "nadir" },
    { min: 20, tier: "orta" },
    { min: 0, tier: "yaygin" },
  ],

  /* --- Odak ipuçları (otomatik döner) --- */
  IPUCU_ARALIGI_SN: 12,
  IPUCLARI: [
    "Bildirimlerini kapat",
    "Tek bir işe odaklan",
    "Küçük adımlar, büyük ilerleme",
    "Derin nefes al, devam et",
    "Masanda su bulundur",
    "Masanı topla, zihnini topla",
    "Dikkat dağıtan düşünceleri not et",
    "Molalarda esneme yap",
  ],

  /* --- Motivasyon mesajları (otomatik döner) --- */
  MOTIVASYON_ARALIGI_SN: 30,
  MOTIVASYON: [
    "Derin sulara dalmadan\nbüyük balıklar yakalanmaz.",
    "Rüzgarı değiştiremezsin ama\nyelkenlerini ayarlayabilirsin.",
    "Sakin deniz, usta denizci yetiştirmez.",
    "Küçük adımlar, büyük rotalar çizer.",
    "Bugünkü 25 dakikan,\nyarınki seni inşa eder.",
    "Dalga geçmeni bekleme,\nkürek çekmeyi öğren.",
    "Her seans, köprüne bir tahta daha ekler.",
    "Pusulan dikkatinse,\nrotan hep doğrudur.",
  ],
};

export const RAR_LBL = { nadir: "Nadir", yaygin: "Yaygın", orta: "Orta", efsanevi: "Efsanevi" };
export const MODE_META = {
  derin: ["Derin Odak", "var(--navy-deep)", "#0d2f40"],
  orta: ["Orta Odak", "#6fb1b9", "#6fb1b9"],
  hafif: ["Hafif Odak", "var(--purple)", "#8b7fd1"],
};

/* Kamera eşiklerini çalışma anında güncelle (Ayarlar sayfası kullanır) */
export function setCamValue(key, value) {
  KOPRU_CONFIG[key] = value;
}

/* eski koda uyumluluk */
if (typeof window !== "undefined") window.KOPRU_CONFIG = KOPRU_CONFIG;
export default KOPRU_CONFIG;
