from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


def _to_out(s: models.Setting) -> schemas.SettingsOut:
    return schemas.SettingsOut(
        theme=s.theme, lang=s.lang, sens=s.sens, thresh=s.thresh,
        faceThresh=s.face_thresh, camId=s.cam_id, preview=s.preview,
        sfx=s.sfx, ambient=s.ambient, motiv=s.motiv,
        aiProvider=s.ai_provider, aiModel=s.ai_model,
    )


@router.get("", response_model=schemas.SettingsOut)
def get_settings(user: models.User = Depends(get_current_user)):
    return _to_out(user.settings)


@router.put("", response_model=schemas.SettingsOut)
def update_settings(
    body: schemas.SettingsUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = user.settings
    data = body.model_dump(exclude_unset=True)
    rename = {"faceThresh": "face_thresh", "camId": "cam_id", "aiProvider": "ai_provider", "aiModel": "ai_model"}
    for k, v in data.items():
        setattr(s, rename.get(k, k), v)
    db.commit()
    db.refresh(s)
    return _to_out(s)
