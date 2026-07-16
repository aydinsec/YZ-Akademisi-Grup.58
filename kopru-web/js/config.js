"use strict";
/* ============================================================
   KÖPRÜ — Yapılandırma
   Bu değerler köprü/realtime_uyari.py içindeki "Ayarlar"
   bloğunun birebir karşılığıdır. Ayarlar sayfasındaki
   kontroller bu değerleri çalışma anında günceller.
   ============================================================ */
window.KOPRU_CONFIG = {
  /* --- Odak takibi (realtime_uyari.py) --- */
  KAPALI_SURE_ESIGI: 2.0,   // sn — göz kapalı bu süreden uzunsa alarm (Ayarlar > Uyarı Eşiği)
  YUZ_YOK_ESIGI:     4.0,   // sn — yüz bu süreden uzun görünmezse alarm
  EAR_ESIK:          0.20,  // EAR eşiği (Ayarlar > Göz Kapanma Hassasiyeti)
  YATIK_ACI:         30.0,  // derece — göz çizgisi bu açıdan yatıksa "baş yatık"
  EAR_ESIK_YATIK_CARPAN: 1.15, // baş yatıkken eşik toleransı (py: düşürülmüş eşikler)
  ALARM_SES: "assets/audio/alarm.mp3",

  // MediaPipe FaceLandmarker (py'deki LANDMARKER_URL ile aynı model)
  LANDMARKER_URL: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  TASKS_VISION_CDN: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14",

  // Göz landmark indeksleri (py: SOL_EAR / SAG_EAR / SOL_GOZ / SAG_GOZ)
  SOL_EAR: [33, 133, 160, 144, 158, 153],
  SAG_EAR: [362, 263, 385, 380, 387, 373],
  SOL_GOZ: [33, 133, 160, 159, 158, 144, 145, 153],
  SAG_GOZ: [362, 263, 387, 386, 385, 373, 374, 380],

  /* --- Oyunlaştırma --- */
  XP_SEANS: 50,             // tamamlanan odak seansı
  XP_GOREV: 20,             // tamamlanan görev
  // Seans süresine göre balık nadirliği (dk)
  NADIRLIK_ESIKLERI: [
    { min: 60, tier: "efsanevi" },
    { min: 40, tier: "nadir"    },
    { min: 20, tier: "orta"     },
    { min: 0,  tier: "yaygin"   }
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
    "Pusulan dikkatinse,\nrotan hep doğrudur."
  ]
};
