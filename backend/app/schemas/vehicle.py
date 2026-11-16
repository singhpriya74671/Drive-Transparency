from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

from app.schemas.service import _validate_manufacturing_year


class VehicleInput(BaseModel):
    owner_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    vehicle_model: str = Field(..., min_length=2)
    manufacturer: Optional[str] = None
    manufacturing_year: int = Field(..., ge=1990)
    mileage_km: float = Field(..., ge=0)
    fuel_type: str = Field(default="petrol", pattern="^(petrol|diesel|electric|hybrid|cng)$")

    last_service_date: Optional[datetime] = None
    last_oil_change_date: Optional[datetime] = None
    battery_age_months: Optional[int] = Field(default=None, ge=0, le=240)
    brake_condition: Optional[Literal["good", "fair", "poor"]] = None
    fuel_efficiency_kmpl: Optional[float] = Field(default=None, ge=0)

    has_unusual_noise: Optional[bool] = None
    has_vibration: Optional[bool] = None
    has_reduced_mileage: Optional[bool] = None
    has_braking_issues: Optional[bool] = None
    additional_symptoms: Optional[str] = None

    # OBD-II / Telematics fields
    battery_voltage: Optional[float] = Field(default=None, ge=8, le=16)
    engine_temp_c: Optional[float] = Field(default=None, ge=0, le=250)
    has_dtc: Optional[bool] = None
    dtc_codes: Optional[str] = None
    avg_speed_kmh: Optional[float] = Field(default=None, ge=0, le=300)
    engine_runtime_hours: Optional[float] = Field(default=None, ge=0, le=1_000_000)

    _check_year = field_validator("manufacturing_year")(_validate_manufacturing_year)


class VehicleResponse(BaseModel):
    id: int
    owner_name: str
    phone: Optional[str] = None
    vehicle_model: str
    manufacturer: Optional[str]
    manufacturing_year: int
    mileage_km: float
    fuel_type: str
    last_service_date: Optional[datetime] = None
    last_oil_change_date: Optional[datetime] = None
    battery_age_months: Optional[int] = None
    brake_condition: Optional[str] = None
    fuel_efficiency_kmpl: Optional[float] = None
    has_unusual_noise: Optional[bool] = None
    has_vibration: Optional[bool] = None
    has_reduced_mileage: Optional[bool] = None
    has_braking_issues: Optional[bool] = None
    additional_symptoms: Optional[str] = None
    battery_voltage: Optional[float] = None
    engine_temp_c: Optional[float] = None
    has_dtc: Optional[bool] = None
    dtc_codes: Optional[str] = None
    avg_speed_kmh: Optional[float] = None
    engine_runtime_hours: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
