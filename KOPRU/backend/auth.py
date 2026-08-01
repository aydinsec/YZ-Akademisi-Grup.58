import json
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
import models

SECRET_KEY = "kopru-cok-gizli-anahtar-degistir-bunu"
ALGORITHM = "HS256"
TOKEN_GECERLILIK_GUN = 7

# ---------------------------------------------------------------------------
# Google ile giriş
# console.cloud.google.com → APIs & Services → Credentials → OAuth client ID
# (Web application) oluşturup istemci kimliğini buraya ya da GOOGLE_CLIENT_ID
# ortam değişkenine yazın. Aynı değeri frontend/src/utils/config.js içine de girin.
# Boş bırakılırsa Google butonu gizlenir, e-posta/şifre girişi çalışmaya devam eder.
# ---------------------------------------------------------------------------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


def verify_google_token(credential: str) -> dict:
    """Google kimlik jetonunu doğrular ve içindeki kullanıcı bilgisini döndürür.

    Önce google-auth kütüphanesiyle yerel doğrulama denenir; kurulu değilse
    Google'ın tokeninfo uç noktasına düşülür.
    """
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        return id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ImportError:
        pass
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google doğrulaması başarısız")

    # Yedek yol: Google'ın kendi doğrulama uç noktası
    try:
        import urllib.request

        with urllib.request.urlopen(
            "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential, timeout=10
        ) as cevap:
            bilgi = json.loads(cevap.read().decode("utf-8"))
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google doğrulaması başarısız")

    if bilgi.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton bu uygulamaya ait değil")
    if bilgi.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton kaynağı geçersiz")
    return bilgi

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_GECERLILIK_GUN)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Giriş yapmanız gerekiyor")

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Geçersiz veya süresi dolmuş oturum")

    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Kullanıcı bulunamadı")
    return user
