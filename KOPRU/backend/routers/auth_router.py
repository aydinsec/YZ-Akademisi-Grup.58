import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import get_db
from utils import iso_now

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.AuthOut)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=body.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Bu e-posta zaten kayıtlı")

    user = models.User(
        email=body.email,
        name=body.name or body.email.split("@")[0],
        password_hash=auth.hash_password(body.password),
    )
    db.add(user)
    db.flush()

    db.add(models.Profile(user_id=user.id, name=user.name, joined=iso_now()))
    db.add(models.Setting(user_id=user.id))

    db.commit()
    db.refresh(user)

    return schemas.AuthOut(token=auth.create_access_token(user.id), email=user.email, name=user.name)


@router.post("/google", response_model=schemas.AuthOut)
def google_login(body: schemas.GoogleIn, db: Session = Depends(get_db)):
    """Google Identity Services'ten gelen kimlik jetonunu doğrular.

    Kurulum: console.cloud.google.com üzerinden bir OAuth istemci kimliği alıp
    GOOGLE_CLIENT_ID ortam değişkenine (veya auth.py içindeki sabite) yazın;
    aynı değeri frontend/src/utils/config.js içindeki GOOGLE_CLIENT_ID'ye girin.
    """
    if not auth.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google girişi yapılandırılmamış (GOOGLE_CLIENT_ID boş)",
        )

    bilgi = auth.verify_google_token(body.credential)
    email = (bilgi.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google hesabından e-posta alınamadı")
    if bilgi.get("email_verified") in (False, "false"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google hesabının e-postası doğrulanmamış")

    user = db.query(models.User).filter_by(email=email).first()
    if user is None:
        # Google ile ilk giriş: hesabı oluştur (şifre alanı kullanılmaz)
        user = models.User(
            email=email,
            name=bilgi.get("given_name") or bilgi.get("name") or email.split("@")[0],
            password_hash=auth.hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.flush()
        db.add(models.Profile(user_id=user.id, name=user.name, joined=iso_now()))
        db.add(models.Setting(user_id=user.id))
        db.commit()
        db.refresh(user)

    return schemas.AuthOut(token=auth.create_access_token(user.id), email=user.email, name=user.name)


@router.post("/login", response_model=schemas.AuthOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=body.email).first()
    if not user or not auth.verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-posta veya şifre hatalı")

    return schemas.AuthOut(token=auth.create_access_token(user.id), email=user.email, name=user.name)
