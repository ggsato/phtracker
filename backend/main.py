import os
from datetime import date
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

import auth
import db
from models import (
    FoodList,
    FoodQuery,
    HealthResponse,
    MeResponse,
    PhLog,
    PhLogList,
    PhLogResponse,
    Profile,
    ProfileCreate,
)

app = FastAPI(title="phtracker API", version="0.1.0")

# Allow SPA origins to call the API.
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_user_id(request: Request) -> str:
    return auth.get_user_id(request)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        region=os.getenv("AWS_REGION"),
        table=os.getenv("TABLE_NAME"),
        runtime="fastapi",
    )


@app.get("/me", response_model=MeResponse)
def me(user_id: str = Depends(get_user_id)) -> MeResponse:
    return MeResponse(user_id=user_id)


@app.get("/profiles", response_model=list[Profile])
def list_profiles(user_id: str = Depends(get_user_id)):
    items = db.list_profiles(user_id)
    return [
        Profile(profile_id=item["profile_id"], display_name=item["display_name"])
        for item in items
    ]


@app.post("/profiles", response_model=Profile, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, user_id: str = Depends(get_user_id)):
    item = db.create_profile(user_id, payload.display_name)
    return Profile(profile_id=item["profile_id"], display_name=item["display_name"])


@app.get("/ph-logs", response_model=PhLogList)
def get_ph_logs(
    profile_id: str,
    start: Optional[date] = None,
    end: Optional[date] = None,
    user_id: str = Depends(get_user_id),
):
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="profile_id is required"
        )
    start_str = start.isoformat() if start else None
    end_str = end.isoformat() if end else None
    items = db.query_ph_logs(user_id, profile_id, start=start_str, end=end_str)
    logs = [
        PhLogResponse(
            profile_id=item["profile_id"],
            date=item["date"],
            ph=item["ph"],
            notes=item.get("notes"),
        )
        for item in items
    ]
    return PhLogList(items=logs)


@app.post("/ph-logs", response_model=PhLogResponse, status_code=status.HTTP_201_CREATED)
def upsert_ph_log(payload: PhLog, user_id: str = Depends(get_user_id)):
    saved = db.save_ph_log(
        user_id,
        payload.profile_id,
        payload.date.isoformat(),
        payload.ph,
        notes=payload.notes,
    )
    return PhLogResponse(
        profile_id=saved["profile_id"],
        date=saved["date"],
        ph=saved["ph"],
        notes=saved.get("notes"),
    )


@app.get("/foods", response_model=FoodList)
def get_foods(
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_pral: Optional[float] = None,
    max_pral: Optional[float] = None,
    limit: int = 50,
):
    params = FoodQuery(
        query=query,
        category=category,
        min_pral=min_pral,
        max_pral=max_pral,
        limit=limit,
    )
    items = db.search_foods(
        query=params.query,
        category=params.category,
        min_pral=params.min_pral,
        max_pral=params.max_pral,
        limit=params.limit,
    )
    foods = []
    for item in items:
        foods.append(
            {
                "id": item.get("food_id") or item.get("id") or item.get("SK", ""),
                "name": item.get("name", ""),
                "category": item.get("category"),
                "pral": item.get("pral"),
            }
        )
    return FoodList(items=foods)


handler = Mangum(app)
