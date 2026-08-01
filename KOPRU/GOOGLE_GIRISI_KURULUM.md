# Google ile Giriş — Kurulum (5 dakika)

Google girişi koda tamamen bağlandı; çalışması için yalnızca **bir OAuth istemci
kimliği** girmeniz gerekiyor. Kimlik girilmezse uygulama bozulmaz — Google butonu
yerine demo hesabıyla hızlı giriş düğmesi görünür.

## 1. İstemci kimliğini alın (ücretsiz)

1. [console.cloud.google.com](https://console.cloud.google.com) → yeni bir proje oluşturun (ör. "KOPRU").
2. Sol menü → **APIs & Services → OAuth consent screen**
   - User Type: **External** → Create
   - Uygulama adı: `KÖPRÜ`, destek e-postası: kendi adresiniz → Save and Continue
   - Test users bölümüne giriş yapacak Google hesaplarını ekleyin (yayınlamadan önce şart).
3. Sol menü → **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins** alanına şunları ekleyin:
     ```
     http://localhost:5173
     http://127.0.0.1:5173
     ```
     (Vite farklı bir port açarsa onu da ekleyin.)
   - Create → çıkan **Client ID** değerini kopyalayın
     (`123456-abcdef.apps.googleusercontent.com` biçiminde).

## 2. Kimliği iki yere yazın

**Frontend** — `frontend/src/utils/config.js`:
```js
export const GOOGLE_CLIENT_ID = "123456-abcdef.apps.googleusercontent.com";
```

**Backend** — uygulamayı başlatmadan önce ortam değişkeni olarak:
```powershell
# Windows PowerShell
$env:GOOGLE_CLIENT_ID="123456-abcdef.apps.googleusercontent.com"
uvicorn main:app --reload
```
İsterseniz `backend/auth.py` içindeki `GOOGLE_CLIENT_ID` satırına doğrudan da yazabilirsiniz.

## 3. Bağımlılığı kurun

```powershell
cd backend
pip install -r requirements.txt      # google-auth eklendi
```

`google-auth` kurulamazsa sistem otomatik olarak Google'ın `tokeninfo` uç noktasına
düşer — yine çalışır, sadece her girişte bir ağ isteği daha yapar.

## Nasıl çalışıyor?

1. Kullanıcı giriş ekranındaki Google butonuna basar; Google penceresinde hesabını seçer.
2. Google tarayıcıya imzalı bir **kimlik jetonu (JWT)** verir.
3. Frontend bu jetonu `POST /auth/google` ile backend'e gönderir.
4. Backend jetonu Google'ın açık anahtarlarıyla doğrular, `aud` (istemci kimliği) ve
   `iss` (kaynak) alanlarını kontrol eder.
5. E-posta veritabanında yoksa hesap otomatik oluşturulur; varsa mevcut hesaba bağlanır.
6. Backend kendi JWT'sini döner ve kullanıcı normal oturumla devam eder.

Şifre alanı Google kullanıcıları için rastgele üretilir ve hiçbir zaman kullanılmaz.
