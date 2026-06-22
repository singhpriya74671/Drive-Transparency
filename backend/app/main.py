from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.config import settings
from app.database import engine, Base
from app.routes import vehicles, maintenance, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vehicle Service Transparency API",
    description="AI-powered vehicle health analysis and predictive maintenance",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
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
