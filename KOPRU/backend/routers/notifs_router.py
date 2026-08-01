from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/notifs", tags=["notifs"])


def _to_out(n: models.Notification) -> schemas.NotifOut:
    return schemas.NotifOut(id=n.id, icon=n.icon, t=n.title, d=n.description, ts=n.ts)


@router.get("", response_model=list[schemas.NotifOut])
def list_notifs(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Notification)
        .filter_by(user_id=user.id)
        .order_by(models.Notification.id.desc())
        .limit(12)
        .all()
    )
    return [_to_out(n) for n in rows]


@router.post("", response_model=schemas.NotifOut, status_code=status.HTTP_201_CREATED)
def create_notif(body: schemas.NotifIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = models.Notification(user_id=user.id, icon=body.icon, title=body.t, description=body.d, ts=body.ts)
    db.add(n)
    db.commit()
    db.refresh(n)

    old = (
        db.query(models.Notification)
        .filter_by(user_id=user.id)
        .order_by(models.Notification.id.desc())
        .offset(12)
        .all()
    )
    for o in old:
        db.delete(o)
    db.commit()

    return _to_out(n)
