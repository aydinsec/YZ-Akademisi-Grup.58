# 🌊 KÖPRÜ — Web Uygulaması (Ekip Rehberi)

> **Odaklan. İlerle. Köprü kur.**
> Pomodoro zamanlayıcı + **gerçek zamanlı kamera tabanlı odak takibi** + oyunlaştırma (balık koleksiyonu, XP, rozetler).
> Bu klasör (`kopru-web/`) projenin çalışan web uygulamasıdır.

---

## 🚀 Hızlı Başlangıç

1. Repoyu klonla, `tuanna` branch'ine geç.
2. `kopru-web/index.html` dosyasını **Chrome veya Edge** ile aç. Kurulum, derleme, sunucu **gerekmez**.
3. Giriş ekranında herhangi bir e-posta + en az 6 karakter şifre ile gir (veriler bu e-postaya özel saklanır).
4. **Odak Modu** sekmesi → "Kamerayı Başlat" → tarayıcı kamera izni ister → odak takibi çalışır.

> İnternet gerekir: MediaPipe yüz modeli ve yazı tipleri CDN'den yüklenir.
> Kameranın ilk açılışında "Model yükleniyor…" birkaç saniye sürebilir.

---

## 📁 Klasör Yapısı

```
kopru-web/
├── index.html            Tek sayfalık uygulama (SPA) — tüm sekmeler burada
├── balik_guncelle.py     Balık kataloğunu yeniden üretir (aşağıda)
├── css/style.css         Tasarım sistemi (renk değişkenleri, koyu tema dahil)
├── js/
│   ├── config.js         Tüm eşik ve sabitler — ayar değiştireceksen İLK BURAYA bak
│   ├── storage.js        Kullanıcıya özel veri katmanı — veritabanı buraya bağlanır
│   ├── camera.js         Odak takip motoru (realtime_uyari.py'nin tarayıcı portu)
│   └── app.js            Arayüz + iş mantığı (sekmeler, görevler, istatistikler...)
└── assets/
    ├── img/              Arayüz görselleri
    ├── audio/alarm.mp3   Uyarı alarmı
    └── fish/             Balık kataloğu (92 görsel) + manifest.js
```

Yükleme sırası önemlidir: `manifest.js → config.js → storage.js → camera.js → app.js`
(hepsi `index.html`'in en altında).

---

## 👁 Odak Takip Sistemi Nasıl Çalışıyor? (`js/camera.js`)

Python tarafında eğitilen sistemin (`realtime_uyari.py`) tarayıcı portudur.
**Aynı üç uyku sinyali** izlenir:

| Sinyal | Nasıl ölçülür | Varsayılan eşik |
|---|---|---|
| 1. Göz kapalılığı | EAR (Eye Aspect Ratio) — MediaPipe göz landmark'ları | EAR < 0.20, süre ≥ 2 sn → alarm |
| 2. Baş yatıklığı | Göz dış köşeleri (33–263) çizgisinin yatayla açısı | > 30° ise eşikler toleranslı uygulanır |
| 3. Yüz görünmüyor | FaceLandmarker yüz bulamıyor | ≥ 4 sn → alarm |

- Model: Python'dakiyle **aynı** MediaPipe FaceLandmarker (`float16/1`), CDN'den yüklenir.
- Alarm: `assets/audio/alarm.mp3` döngüde çalar; ekrana kırmızı çerçeve çizilir (py ile aynı davranış).
- Uyarılar kullanıcı verisine kaydedilir; "Uyarılar" kartında ve bildirimlerde görünür.
- Eşikler **Ayarlar → Kamera ve Odak Takibi** bölümünden canlı değiştirilir
  (hassasiyet kaydırıcısı EAR eşiğini 0.14–0.26 arasında ayarlar).

> **Not:** Eğitilen CNN (`goz_modeli.keras`) tarayıcıda doğrudan çalışmaz.
> Python kodundaki **EAR yedek modu** birebir taşındı. CNN'i kullanmak istersek:
> `tensorflowjs_converter` ile modeli çevirip `camera.js` içindeki EAR kararının
> yerine TF.js tahmini koymak yeterli — mimari buna hazır.

---

## 🐟 Balık Sistemi

- **Balıklar elle eklenmez.** Bir pomodoro seansı tamamlanınca süreye göre
  otomatik bir balık yakalanır ve isim vermen için pencere açılır:

| Seans süresi | Nadirlik |
|---|---|
| < 20 dk | Yaygın |
| 20–39 dk | Orta |
| 40–59 dk | Nadir |
| 60+ dk | Efsanevi |

- **Kataloğa yeni balık eklemek için:** görseli `assets/fish/` içine kopyala ve
  `python balik_guncelle.py` çalıştır. Script dosya adlarını temizler, nadirlik
  atar ve `manifest.js`'i yeniden üretir. Kodda başka hiçbir değişiklik gerekmez.
- "Koleksiyon" sekmesi tüm katalogdaki balıkları gösterir; yakalanmayanlar soluk görünür.

---

## 💾 Veri Katmanı ve Veritabanına Geçiş (`js/storage.js`)

- Tüm veriler **kullanıcı e-postasına göre ayrılır**: `kopru:<kullanıcı>:<koleksiyon>`
- Koleksiyonlar: `profile`, `tasks`, `fish`, `sessions`, `warnings`, `settings`, `notifs`, `starts`
- Şu an localStorage kullanılır; **bir sunucuya bağlamak için yalnızca
  `Storage._read` ve `Storage._write` fonksiyonlarını `fetch()` ile değiştirin.**
  Dosyanın başındaki yorumda hazır örnek var. Uygulamanın geri kalanı yalnızca
  `Storage.get/set/update/push` kullanır, hiçbir şey bilmez.
- `Ayarlar → Verileri Dışa Aktar`: kullanıcının tüm verisini tek JSON indirir
  (yedek/paylaşım/DB'ye taşıma formatı).
- `Ayarlar → Verileri Temizle`: onay sorar, sonra kullanıcının **tüm** verisini siler
  (odak süreleri, görevler, grafikler, balıklar).

---

## 📊 İstatistikler

Grafiklerin tamamı (günlük odak süresi, tür dağılımı, başarı oranı, ısı haritası,
rozetler, seviye/XP) **gerçek seans verisinden** hesaplanır — sahte veri yoktur.
Yeni kullanıcıda grafikler boş başlar, seans tamamlandıkça dolar.

- XP: seans +50, görev +20 (bkz. `config.js`)
- Seri (streak): üst üste en az 1 seanslı gün sayısı
- "Bu Hafta / Geçen Hafta" karşılaştırmaları otomatik hesaplanır

---

## 🛠 Katkı Notları

- **Bir eşik/sabit mi değiştireceksin?** → `js/config.js` (kod aramana gerek yok)
- **Yeni sekme/bileşen mi?** → `index.html`'e section ekle, `app.js`'te `PAGES`'e kaydet
- **Renk/tema?** → `css/style.css` en üstteki `:root` ve `body.dark` değişkenleri
- İkonlar `index.html` başındaki SVG sprite'ta; `<use href="#i-isim">` ile kullanılır
- Kod dili: arayüz metinleri ve yorumlar Türkçe

## ⚠️ Bilinen Sınırlar

- Kamera izni yalnızca Chrome/Edge'de `file://` ile sorunsuz; sorun yaşarsanız
  klasörde `python -m http.server` çalıştırıp `localhost:8000`'den açın.
- CNN modeli henüz tarayıcıda değil (EAR modu aktif — yukarıya bak).
- Bulut senkronizasyonu arayüzde var ama backend bağlanana kadar pasif.
