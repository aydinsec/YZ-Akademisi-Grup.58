from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import (
    auth_router, profile_router, settings_router, tasks_router,
    fish_router, sessions_router, warnings_router, notifs_router, starts_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KÖPRÜ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(profile_router.router)
app.include_router(settings_router.router)
app.include_router(tasks_router.router)
app.include_router(fish_router.router)
app.include_router(sessions_router.router)
app.include_router(warnings_router.router)
app.include_router(notifs_router.router)
app.include_router(starts_router.router)


@app.get("/")
def root():
    return {"mesaj": "KÖPRÜ API çalışıyor ⚓", "docs": "/docs"}
