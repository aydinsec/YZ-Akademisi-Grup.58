from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _to_out(t: models.Task) -> schemas.TaskOut:
    return schemas.TaskOut(
        id=t.id, name=t.name, cat=t.cat, prio=t.prio, dur=t.dur, group=t.group_name,
        done=t.done, doneAt=t.done_at, createdAt=t.created_at,
    )


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.Task).filter_by(user_id=user.id).order_by(models.Task.id.desc()).all()
    return [_to_out(t) for t in rows]


@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: schemas.TaskIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = models.Task(
        user_id=user.id, name=body.name, cat=body.cat, prio=body.prio, dur=body.dur,
        group_name=body.group, done=body.done, done_at=body.doneAt, created_at=body.createdAt,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _to_out(t)


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    body: schemas.TaskPatch,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.query(models.Task).filter_by(id=task_id, user_id=user.id).first()
    if not t:
        raise HTTPException(404, "Görev bulunamadı")
    data = body.model_dump(exclude_unset=True)
    if "group" in data:
        t.group_name = data.pop("group")
    if "doneAt" in data:
        t.done_at = data.pop("doneAt")
    for k, v in data.items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return _to_out(t)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(models.Task).filter_by(id=task_id, user_id=user.id).first()
    if not t:
        raise HTTPException(404, "Görev bulunamadı")
    db.delete(t)
    db.commit()
