from fastapi import APIRouter, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from utils import iso_now

router = APIRouter(prefix="/starts", tags=["starts"])


@router.get("")
def get_starts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.DailyStart).filter_by(user_id=user.id).all()
    return {r.date: r.count for r in rows}


@router.put("")
def set_starts(body: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for date, count in body.items():
        row = db.query(models.DailyStart).filter_by(user_id=user.id, date=date).first()
        if row:
            row.count = count
        else:
            db.add(models.DailyStart(user_id=user.id, date=date, count=count))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            row = db.query(models.DailyStart).filter_by(user_id=user.id, date=date).first()
            if row:
                row.count = count
                db.commit()
    return body


@router.post("/increment")
def increment_today(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = iso_now()[:10]
    row = db.query(models.DailyStart).filter_by(user_id=user.id, date=today).first()
    if row:
        row.count += 1
    else:
        row = models.DailyStart(user_id=user.id, date=today, count=1)
        db.add(row)
    db.commit()
    return {today: row.count}
