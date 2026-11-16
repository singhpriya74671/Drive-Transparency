from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import vehicles, maintenance, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vehicle Service Transparency API",
    description="AI-powered vehicle health analysis and predictive maintenance",
    version="1.0.0",
)

# Origins come from the ALLOWED_ORIGINS environment variable in production.
# No wildcard is used so only the deployed frontend (and local dev origins by
# default) can call the API from a browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(maintenance.router)


@app.get("/")
def root():
    return {"message": "Vehicle Service Transparency API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
