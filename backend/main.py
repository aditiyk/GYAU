from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import connect_to_mongo, close_mongo_connection
from routes import tasks, calendar, analytics, voice, agents, payments, focus, gmail, planner, auth, ai_helpers

app = FastAPI(title="GYAU API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(agents.router, prefix="/agent", tags=["Agent Orchestrator"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(focus.router, prefix="/focus", tags=["Focus"])
app.include_router(gmail.router, prefix="/gmail", tags=["Gmail"])
app.include_router(planner.router, prefix="/planner", tags=["Planner"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(ai_helpers.router, prefix="/ai", tags=["AI Helpers"])

@app.get("/")
def read_root():
    return {"message": "Welcome to GYAU API"}
