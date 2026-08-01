from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, TIMESTAMP, UniqueConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings = relationship("Setting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    fish = relationship("Fish", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    warnings = relationship("Warning", back_populates="user", cascade="all, delete-orphan")
    notifs = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    starts = relationship("DailyStart", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, default="Kaptan")
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    xp_max = Column(Integer, default=1000)
    joined = Column(String)
    avatar = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String, default="light")
    lang = Column(String, default="tr")
    sens = Column(Float, default=50)
    thresh = Column(Float, default=2.0)
    face_thresh = Column(Float, default=4.0)
    cam_id = Column(String, nullable=True)
    preview = Column(Boolean, default=True)
    sfx = Column(Boolean, default=True)
    ambient = Column(Boolean, default=False)
    motiv = Column(Boolean, default=True)
    ai_provider = Column(String, default="anthropic")
    ai_model = Column(String, nullable=True)

    user = relationship("User", back_populates="settings")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    cat = Column(String, nullable=True)
    prio = Column(String, nullable=True)
    dur = Column(Integer, nullable=True)
    group_name = Column(String, nullable=True)
    done = Column(Boolean, default=False)
    done_at = Column(String, nullable=True)
    created_at = Column(String, nullable=True)

    user = relationship("User", back_populates="tasks")


class Fish(Base):
    __tablename__ = "fish"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=True)
    file = Column(String, nullable=False)
    tier = Column(String, nullable=False)
    minutes = Column(Integer, nullable=False)
    date = Column(String, nullable=True)
    is_new = Column(Boolean, default=True)
    movement = Column(String, default="swim")

    user = relationship("User", back_populates="fish")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String, nullable=True)
    minutes = Column(Integer, nullable=False)
    mode = Column(String, nullable=True)
    hour = Column(Integer, nullable=True)
    completed = Column(Boolean, default=True)
    ts = Column(Integer, nullable=True)

    user = relationship("User", back_populates="sessions")


class Warning(Base):
    __tablename__ = "warnings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    time = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)

    user = relationship("User", back_populates="warnings")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    icon = Column(String, nullable=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    ts = Column(Integer, nullable=True)

    user = relationship("User", back_populates="notifs")


class DailyStart(Base):
    __tablename__ = "daily_starts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String, nullable=False)
    count = Column(Integer, default=1)

    user = relationship("User", back_populates="starts")

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)
