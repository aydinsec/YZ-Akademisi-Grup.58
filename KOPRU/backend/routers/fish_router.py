from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/fish", tags=["fish"])


def _to_out(f: models.Fish) -> schemas.FishOut:
    return schemas.FishOut(
        id=f.id, name=f.name, file=f.file, tier=f.tier,
        minutes=f.minutes, date=f.date, isNew=f.is_new, movement=f.movement,
    )


@router.get("", response_model=list[schemas.FishOut])
def list_fish(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Fish).filter_by(user_id=user.id).order_by(models.Fish.id.desc()).all()
    return [_to_out(f) for f in rows]


@router.post("", response_model=schemas.FishOut, status_code=status.HTTP_201_CREATED)
def create_fish(body: schemas.FishIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = models.Fish(
        user_id=user.id, name=body.name, file=body.file, tier=body.tier,
        minutes=body.minutes, date=body.date, is_new=body.isNew, movement=body.movement or "swim",
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return _to_out(f)


@router.patch("/{fish_id}", response_model=schemas.FishOut)
def rename_fish(
    fish_id: int,
    body: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    f = db.query(models.Fish).filter_by(id=fish_id, user_id=user.id).first()
    if not f:
        raise HTTPException(404, "Balık bulunamadı")
    if "name" in body:
        f.name = body["name"]
    if "isNew" in body:
        f.is_new = body["isNew"]
    if "movement" in body:
        f.movement = body["movement"]
    db.commit()
    db.refresh(f)
    return _to_out(f)
