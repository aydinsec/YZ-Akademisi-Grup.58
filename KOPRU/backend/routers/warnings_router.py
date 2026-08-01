from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/warnings", tags=["warnings"])


def _to_out(w: models.Warning) -> schemas.WarningOut:
    return schemas.WarningOut(id=w.id, time=w.time, reason=w.reason)


@router.get("", response_model=list[schemas.WarningOut])
def list_warnings(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Warning).filter_by(user_id=user.id).order_by(models.Warning.id.desc()).all()
    return [_to_out(w) for w in rows]


@router.post("", response_model=schemas.WarningOut, status_code=status.HTTP_201_CREATED)
def create_warning(body: schemas.WarningIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    w = models.Warning(user_id=user.id, time=body.time, reason=body.reason)
    db.add(w)
    db.commit()
    db.refresh(w)
    return _to_out(w)
