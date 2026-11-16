from pydantic import BaseModel
from pydantic import ConfigDict, Field, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


def _max_manufacturing_year() -> int:
    # Next year's models are sold before the calendar year starts.
    return datetime.now().year + 1


def _validate_manufacturing_year(value: Optional[int]) -> Optional[int]:
    if value is not None and value > _max_manufacturing_year():
        raise ValueError(f"manufacturing_year must be {_max_manufacturing_year()} or earlier")
    return value


class MaintenanceAnalysisInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    owner_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    vehicle_model: Optional[str] = Field(default=None, min_length=2, max_length=100)
    manufacturer: Optional[str] = Field(default=None, max_length=100)
    manufacturing_year: Optional[int] = Field(default=None, ge=1900)
    mileage_km: Optional[float] = Field(default=None, ge=0, le=2_000_000)
    fuel_type: Optional[Literal["petrol", "diesel", "electric", "hybrid", "cng"]] = None

    last_service_date: Optional[datetime] = None
    last_oil_change_date: Optional[datetime] = None
    battery_age_months: Optional[int] = Field(default=None, ge=0, le=240)
    brake_condition: Optional[Literal["good", "fair", "poor"]] = None
    fuel_efficiency_kmpl: Optional[float] = Field(default=None, ge=0, le=100)

    has_unusual_noise: Optional[bool] = None
    has_vibration: Optional[bool] = None
    has_reduced_mileage: Optional[bool] = None
    has_braking_issues: Optional[bool] = None
    additional_symptoms: Optional[str] = Field(default=None, max_length=2000)

    battery_voltage: Optional[float] = Field(default=None, ge=8, le=16)
    engine_temp_c: Optional[float] = Field(default=None, ge=0, le=250)
    has_dtc: Optional[bool] = None
    dtc_codes: Optional[str] = Field(default=None, max_length=500)
    avg_speed_kmh: Optional[float] = Field(default=None, ge=0, le=300)
    engine_runtime_hours: Optional[float] = Field(default=None, ge=0, le=1_000_000)

    @field_validator("*", mode="before")
    @classmethod
    def _blank_to_none(cls, value: Any) -> Any:
        # Forms send "" for untouched fields; treat that as "not provided".
        if isinstance(value, str) and not value.strip():
            return None
        return value

    _check_year = field_validator("manufacturing_year")(_validate_manufacturing_year)


class ComponentHealth(BaseModel):
    component: str
    label: Optional[str] = None
    health_score: Optional[float] = None
    risk_score: Optional[float] = None
    urgency: str
    assessment_source: Optional[str] = None
    explanation: str
    recommended_action: Optional[str] = None
    estimated_cost_min: Optional[float] = None
    estimated_cost_max: Optional[float] = None
    maintenance_probability: Optional[float] = None
    predicted_service_window_days: Optional[int] = None
    shap_factors: Optional[List[dict]] = None


class MaintenanceReport(BaseModel):
    vehicle_id: int
    overall_health_score: Optional[float] = None
    overall_status: str
    components: List[ComponentHealth]
    top_alert: Optional[str] = None
    generated_at: datetime
    service_required: Optional[bool] = None
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    assessment_method: str
    model_status: Literal["available", "not_trained"]
    model_message: Optional[str] = None
    model_prediction: Optional[Dict[str, Any]] = None
    assessed_components_count: int = 0


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
