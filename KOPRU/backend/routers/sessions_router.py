from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _to_out(s: models.FocusSession) -> schemas.SessionOut:
    return schemas.SessionOut(
        id=s.id, date=s.date, minutes=s.minutes, mode=s.mode,
        hour=s.hour, completed=s.completed, ts=s.ts,
    )


@router.get("", response_model=list[schemas.SessionOut])
def list_sessions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.FocusSession).filter_by(user_id=user.id).order_by(models.FocusSession.id.desc()).all()
    return [_to_out(s) for s in rows]


@router.post("", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    body: schemas.SessionIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = models.FocusSession(
        user_id=user.id, date=body.date, minutes=body.minutes,
        mode=body.mode, hour=body.hour, completed=body.completed, ts=body.ts,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _to_out(s)
