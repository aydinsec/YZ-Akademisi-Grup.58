# React Geçişi Düzeltme Notları

React'e geçişte kopan işlevler onarıldı. Değişenler:

## Onarılanlar
- **Giriş ekranı ve Profil sayfası geri geldi** — veriler yine kullanıcı e-postasına göre ayrı saklanıyor (`src/utils/storage.js`).
- **Seans döngüsü çalışıyor:** Pomodoro bitince seans kaydedilir, +50 XP ve süreye göre otomatik balık gelir; isim verme penceresi açılır (App.jsx → FishNamingModal).
- **Ana Sayfa ↔ Odak Modu sayacı ortak** (`src/state/AppContext.jsx` — tüm ortak durum burada).
- **Kamera uyarıları kaydediliyor:** alarm → Uyarılar kartı + bildirim + kalıcı kayıt.
- **Topbar canlandı:** dinamik selamlama, oturum/odak sayacı, koyu tema, bildirim menüsü.
- **Görevler/Balıklar/İstatistikler/Ayarlar gerçek veriye bağlandı** — sahte listeler kaldırıldı; grafikler seans kayıtlarından hesaplanır.
- **Ayarlar → kamera motoru entegrasyonu:** hassasiyet/eşikler `KOPRU_CONFIG`'i canlı günceller.
- `index.html`'deki çift script yüklemeleri kaldırıldı (build'i bozuyordu); utils artık ES modülü.
- Tanımsız CSS değişkenleri (`--bg-soft`, `--card-bg`, `--border`) tanımlandı.

## Korunanlar
- `BoatScene.jsx` (Three.js 3D sahne) olduğu gibi duruyor, ortak sayaca bağlı.
- Vite/React yapısı ve tasarım aynen korundu.

## Çalıştırma
```
cd kopru-web-react
npm install
npm run dev
```

Not: Kalan birkaç eslint bildirimi yeni react-hooks ön ayarının stil uyarılarıdır, çalışmayı etkilemez.
