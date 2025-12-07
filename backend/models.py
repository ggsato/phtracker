from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    region: Optional[str] = None
    table: Optional[str] = None
    runtime: str = "fastapi"


class MeResponse(BaseModel):
    user_id: str


class Profile(BaseModel):
    profile_id: str
    display_name: str


class ProfileCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)


class PhLog(BaseModel):
    profile_id: str
    date: date
    ph: float
    notes: Optional[str] = None


class PhLogResponse(BaseModel):
    profile_id: str
    date: date
    ph: float
    notes: Optional[str] = None


class PhLogList(BaseModel):
    items: List[PhLogResponse]


class FoodItem(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    pral: Optional[float] = None


class FoodList(BaseModel):
    items: List[FoodItem]


class FoodQuery(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    min_pral: Optional[float] = None
    max_pral: Optional[float] = None
    limit: int = Field(default=50, ge=1, le=200)
