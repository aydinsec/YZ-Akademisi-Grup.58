from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/profile", tags=["profile"])


def _to_out(p: models.Profile) -> schemas.ProfileOut:
    return schemas.ProfileOut(name=p.name, level=p.level, xp=p.xp, xpMax=p.xp_max, joined=p.joined, avatar=p.avatar)


@router.get("", response_model=schemas.ProfileOut)
def get_profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _to_out(user.profile)


@router.put("", response_model=schemas.ProfileOut)
def update_profile(
    body: schemas.ProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = user.profile
    data = body.model_dump(exclude_unset=True)
    if "xpMax" in data:
        p.xp_max = data.pop("xpMax")
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _to_out(p)
