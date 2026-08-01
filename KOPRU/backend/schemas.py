"""
KÖPRÜ Backend — Pydantic Şemaları
API'ye giren/çıkan verinin şeklini ve doğrulamasını tanımlar.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


# ---------- Auth ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    email: str
    name: Optional[str] = None


# ---------- Profile ----------
class ProfileOut(BaseModel):
    name: str
    level: int
    xp: int
    xpMax: int
    joined: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    xpMax: Optional[int] = None
    avatar: Optional[str] = None


# ---------- Settings ----------
class SettingsOut(BaseModel):
    theme: str
    lang: str
    sens: float
    thresh: float
    faceThresh: float
    camId: Optional[str] = None
    preview: bool
    sfx: bool
    ambient: bool
    motiv: bool
    aiProvider: Optional[str] = "anthropic"
    aiModel: Optional[str] = None

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    lang: Optional[str] = None
    sens: Optional[float] = None
    thresh: Optional[float] = None
    faceThresh: Optional[float] = None
    camId: Optional[str] = None
    preview: Optional[bool] = None
    sfx: Optional[bool] = None
    ambient: Optional[bool] = None
    motiv: Optional[bool] = None
    aiProvider: Optional[str] = None
    aiModel: Optional[str] = None


# ---------- Task ----------
class TaskIn(BaseModel):
    name: str
    cat: Optional[str] = None
    prio: Optional[str] = None
    dur: Optional[int] = None
    group: Optional[str] = None
    done: bool = False
    doneAt: Optional[str] = None
    createdAt: Optional[str] = None


class TaskOut(TaskIn):
    id: int

    class Config:
        from_attributes = True


class TaskPatch(BaseModel):
    name: Optional[str] = None
    cat: Optional[str] = None
    prio: Optional[str] = None
    dur: Optional[int] = None
    group: Optional[str] = None
    done: Optional[bool] = None
    doneAt: Optional[str] = None


# ---------- Fish ----------
class FishIn(BaseModel):
    name: Optional[str] = ""
    file: str
    tier: str
    minutes: int
    date: Optional[str] = None
    isNew: bool = True
    movement: Optional[str] = "swim"


class FishOut(FishIn):
    id: int

    class Config:
        from_attributes = True


# ---------- Focus Session ----------
class SessionIn(BaseModel):
    date: Optional[str] = None
    minutes: int
    mode: Optional[str] = None
    hour: Optional[int] = None
    completed: bool = True
    ts: Optional[int] = None


class SessionOut(SessionIn):
    id: int

    class Config:
        from_attributes = True


# ---------- Warning ----------
class WarningIn(BaseModel):
    time: int
    reason: str


class WarningOut(WarningIn):
    id: int

    class Config:
        from_attributes = True


# ---------- Notification ----------
class NotifIn(BaseModel):
    icon: Optional[str] = None
    t: Optional[str] = None
    d: Optional[str] = None
    ts: Optional[int] = None


class NotifOut(NotifIn):
    id: int

    class Config:
        from_attributes = True


# ---------- Daily Starts ----------
class StartOut(BaseModel):
    date: str
    count: int

    class Config:
        from_attributes = True
