/* ============================================================
   KÖPRÜ — Odak Takip Motoru (tarayıcı portu)
   Kaynak: köprü/realtime_uyari.py

   Üç uyku sinyali (py ile birebir):
   1. Göz kapalılığı — EAR yöntemi (CNN modeli TF.js'e çevrilene
      dek py'nin EAR yedek modu).
   2. Baş yatıklığı — göz çizgisi açısı > YATIK_ACI ise eşikler
      toleranslı uygulanır.
   3. Yüz görünmüyor — YUZ_YOK_ESIGI saniyeden uzun sürerse alarm.
   ============================================================ */
import { KOPRU_CONFIG as C } from "./config.js";
import { Storage } from "./storage.js";

export const Cam = {
  running: false,
  stream: null,
  landmarker: null,
  video: null,
  canvas: null,
  ctx: null,
  alarmAudio: null,
  alarmOn: false,
  deviceId: null,

  uykuBaslangic: null,
  yuzYokBaslangic: null,
  yuzGorulmus: false,
  sonUyari: null,
  uyariSayisi: 0,

  onStatus: null, // ({state,text,color,ear,aci,sure}) => {}
  onAlarm: null,  // (reason) => {}

  async listDevices() {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      return devs.filter((d) => d.kind === "videoinput");
    } catch {
      return [];
    }
  },

  async start(videoEl, canvasEl) {
    if (this.running) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Bu tarayıcı kamera erişimini desteklemiyor.");
    }
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");

    // 1) Kamera izni (py: cv2.VideoCapture(0))
    const constraints = {
      video: this.deviceId ? { deviceId: { exact: this.deviceId } } : { facingMode: "user" },
      audio: false,
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();

    // 2) FaceLandmarker (py: landmarker_hazirla)
    if (!this.landmarker) {
      this._status("yukleniyor", "Model yükleniyor…", "muted");
      const vision = await import(/* @vite-ignore */ C.TASKS_VISION_CDN);
      const files = await vision.FilesetResolver.forVisionTasks(C.TASKS_VISION_CDN + "/wasm");
      this.landmarker = await vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: C.LANDMARKER_URL },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    }

    // 3) Alarm sesi (py: AlarmSesi — mp3 döngüde)
    if (!this.alarmAudio) {
      this.alarmAudio = new Audio(C.ALARM_SES);
      this.alarmAudio.loop = true;
    }

    this.running = true;
    this.uykuBaslangic = null;
    this.yuzYokBaslangic = null;
    this.yuzGorulmus = false;
    this._loop();
    return true;
  },

  stop() {
    this.running = false;
    this._alarmDurdur();
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    if (this.video) this.video.srcObject = null;
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._status("kapali", "Kamera kapalı", "muted");
  },

  async setDevice(id) {
    this.deviceId = id || null;
    if (this.running) {
      const v = this.video, c = this.canvas;
      this.stop();
      await this.start(v, c);
    }
  },

  /* ---- py fonksiyonlarının karşılıkları ---- */
  _ear(lm, idx, w, h) { // py: ear_hesapla
    const p = idx.map((i) => [lm[i].x * w, lm[i].y * h]);
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const yatay = d(p[0], p[1]);
    if (yatay < 1e-6) return null;
    return (d(p[2], p[3]) + d(p[4], p[5])) / (2 * yatay);
  },
  _basAcisi(lm, w, h) { // py: bas_acisi
    const x1 = lm[33].x * w, y1 = lm[33].y * h, x2 = lm[263].x * w, y2 = lm[263].y * h;
    const aci = Math.abs((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
    return Math.min(aci, 180 - aci);
  },
  _gozKutu(lm, idx, w, h) { // py: goz_kutu
    const xs = idx.map((i) => lm[i].x * w), ys = idx.map((i) => lm[i].y * h);
    const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const px = (x2 - x1) * 0.3, py = Math.max(y2 - y1, (x2 - x1) * 0.5) * 0.6;
    return [Math.max(x1 - px, 0), Math.max(y1 - py, 0), Math.min(x2 + px, w), Math.min(y2 + py, h)];
  },

  _alarmBaslat() {
    if (this.alarmOn) return;
    this.alarmOn = true;
    const s = Storage.user ? Storage.get("settings", {}) : {};
    if (s.sfx !== false && this.alarmAudio) this.alarmAudio.play().catch(() => {});
  },
  _alarmDurdur() {
    if (!this.alarmOn) return;
    this.alarmOn = false;
    if (this.alarmAudio) { this.alarmAudio.pause(); this.alarmAudio.currentTime = 0; }
  },
  _status(state, text, color, extra) {
    if (this.onStatus) this.onStatus(Object.assign({ state, text, color }, extra || {}));
  },

  /* ---- ana döngü (py: main while True) ---- */
  _loop() {
    if (!this.running) return;
    const v = this.video;
    if (v.readyState >= 2 && this.landmarker) {
      const w = v.videoWidth, h = v.videoHeight;
      if (this.canvas.width !== w) { this.canvas.width = w; this.canvas.height = h; }
      const ctx = this.ctx;
      ctx.clearRect(0, 0, w, h);

      const sonuc = this.landmarker.detectForVideo(v, performance.now());
      const now = performance.now() / 1000;
      let alarm = false, reason = "";

      if (sonuc.faceLandmarks && sonuc.faceLandmarks.length) {
        this.yuzGorulmus = true;
        this.yuzYokBaslangic = null;
        const lm = sonuc.faceLandmarks[0];

        const aci = this._basAcisi(lm, w, h);
        const yatik = aci > C.YATIK_ACI;

        const earlar = [this._ear(lm, C.SOL_EAR, w, h), this._ear(lm, C.SAG_EAR, w, h)].filter((e) => e !== null);
        const ear = earlar.length ? earlar.reduce((a, b) => a + b, 0) / earlar.length : null;
        const esik = yatik ? C.EAR_ESIK * C.EAR_ESIK_YATIK_CARPAN : C.EAR_ESIK;
        const kapali = ear !== null && ear < esik;

        [[C.SOL_GOZ, C.SOL_EAR], [C.SAG_GOZ, C.SAG_EAR]].forEach(([gozIdx, earIdx]) => {
          const [x1, y1, x2, y2] = this._gozKutu(lm, gozIdx, w, h);
          const e = this._ear(lm, earIdx, w, h);
          ctx.strokeStyle = e !== null && e < esik ? "#e23b2e" : "#27c281";
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        });

        if (kapali) {
          if (this.uykuBaslangic === null) this.uykuBaslangic = now;
          const sure = now - this.uykuBaslangic;
          reason = yatik ? "Gözler kapalı (baş yatık)" : "Gözler kapalı";
          if (sure >= C.KAPALI_SURE_ESIGI) {
            alarm = true;
            this._status("alarm", `UYARI! ${reason} (${sure.toFixed(1)} sn) — UYAN!`, "red", { ear, aci, sure });
          } else {
            this._status("kapali-goz", `${reason} (${sure.toFixed(1)} sn)`, "orange", { ear, aci, sure });
          }
        } else {
          this.uykuBaslangic = null;
          this._status("odak", "Gözler açık — odaklanmış", "green", { ear, aci });
        }
      } else {
        this.uykuBaslangic = null;
        if (this.yuzGorulmus) {
          if (this.yuzYokBaslangic === null) this.yuzYokBaslangic = now;
          const sure = now - this.yuzYokBaslangic;
          reason = "Yüz görünmüyor";
          if (sure >= C.YUZ_YOK_ESIGI) {
            alarm = true;
            this._status("alarm", `UYARI! Yüz görünmüyor (${sure.toFixed(0)} sn)`, "red", { sure });
          } else {
            this._status("yuz-yok", `Yüz görünmüyor (${sure.toFixed(1)} sn)`, "orange", { sure });
          }
        } else {
          this._status("bekleniyor", "Yüz aranıyor…", "muted");
        }
      }

      if (alarm) {
        ctx.strokeStyle = "#e23b2e";
        ctx.lineWidth = 14;
        ctx.strokeRect(0, 0, w, h);
        this._alarmBaslat();
        const t = Date.now();
        if (!this.sonUyari || t - this.sonUyari > 5000) {
          this.sonUyari = t;
          this.uyariSayisi++;
          if (this.onAlarm) this.onAlarm(reason);
        }
      } else {
        this._alarmDurdur();
      }
    }
    requestAnimationFrame(() => this._loop());
  },
};

if (typeof window !== "undefined") window.KopruCam = Cam;
export default Cam;
