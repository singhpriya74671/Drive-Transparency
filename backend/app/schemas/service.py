from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ComponentHealth(BaseModel):
    component: str
    health_score: float       # 0-100
    urgency: str              # critical / warning / good
    explanation: str
    estimated_cost_min: float
    estimated_cost_max: float
    shap_factors: Optional[List[dict]] = None


class MaintenanceReport(BaseModel):
    vehicle_id: int
    overall_health_score: float
    overall_status: str       # critical / warning / good
    components: List[ComponentHealth]
    top_alert: Optional[str] = None
    generated_at: datetime


class ServiceRecordCreate(BaseModel):
    vehicle_id: int
    service_type: str
    component: Optional[str] = None
    is_completed: bool = False
    completed_date: Optional[datetime] = None
    service_center: Optional[str] = None
    actual_cost: Optional[float] = None
    notes: Optional[str] = None


class ServiceRecordResponse(ServiceRecordCreate):
    id: int
    urgency: Optional[str]
    health_score: Optional[float]
    explanation: Optional[str]
    estimated_cost_min: Optional[float]
    estimated_cost_max: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
