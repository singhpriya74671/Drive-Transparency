from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VehicleInput(BaseModel):
    owner_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    vehicle_model: str = Field(..., min_length=2)
    manufacturer: Optional[str] = None
    manufacturing_year: int = Field(..., ge=1990, le=2026)
    mileage_km: float = Field(..., ge=0)
    fuel_type: str = Field(default="petrol", pattern="^(petrol|diesel|electric|hybrid|cng)$")

    last_service_date: Optional[datetime] = None
    last_oil_change_date: Optional[datetime] = None
    battery_age_months: int = Field(default=0, ge=0)
    brake_condition: str = Field(default="good", pattern="^(good|fair|poor)$")
    fuel_efficiency_kmpl: Optional[float] = Field(default=None, ge=0)

    has_unusual_noise: bool = False
    has_vibration: bool = False
    has_reduced_mileage: bool = False
    has_braking_issues: bool = False
    additional_symptoms: Optional[str] = None

    # OBD-II / Telematics fields
    battery_voltage: Optional[float] = Field(default=12.6, ge=10.0, le=15.0)
    engine_temp_c: Optional[float] = Field(default=90.0, ge=0, le=150)
    has_dtc: bool = False
    dtc_codes: Optional[str] = None
    avg_speed_kmh: Optional[float] = Field(default=45.0, ge=0, le=200)
    engine_runtime_hours: Optional[float] = Field(default=None, ge=0)


class VehicleResponse(BaseModel):
    id: int
    owner_name: str
    vehicle_model: str
    manufacturer: Optional[str]
    manufacturing_year: int
    mileage_km: float
    fuel_type: str
    created_at: datetime

    class Config:
        from_attributes = True
