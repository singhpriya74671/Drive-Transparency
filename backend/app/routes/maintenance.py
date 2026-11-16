import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.service import ServiceRecord
from app.schemas.service import (
    MaintenanceAnalysisInput,
    MaintenanceReport,
    ComponentHealth,
    ServiceRecordCreate,
    ServiceRecordResponse,
)
from app.ml.predictor import ModelArtifactError, predict_maintenance

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
logger = logging.getLogger(__name__)


def _analyze(vehicle_id: int, vehicle_data: dict) -> MaintenanceReport:
    try:
        assessment = predict_maintenance(vehicle_data)
    except ModelArtifactError as exc:
        logger.exception("Maintenance model is unavailable for vehicle_id=%s", vehicle_id)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Maintenance analysis failed for vehicle_id=%s", vehicle_id)
        raise HTTPException(
            status_code=500,
            detail="Maintenance analysis failed. Check backend logs for the cause.",
        ) from exc

    return MaintenanceReport(
        vehicle_id=vehicle_id,
        overall_health_score=assessment["overall_health_score"],
        overall_status=assessment["overall_status"],
        top_alert=assessment["top_alert"],
        components=[ComponentHealth(**component) for component in assessment["components"]],
        generated_at=datetime.now(timezone.utc),
        service_required=assessment["service_required"],
        recommendations=assessment["recommendations"],
        assessment_method=assessment["assessment_method"],
        model_status=assessment["model_status"],
        model_message=assessment["model_message"],
        model_prediction=assessment["model_prediction"],
        assessed_components_count=assessment["assessed_components_count"],
    )


@router.get("/analyze/{vehicle_id}", response_model=MaintenanceReport)
def analyze_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle_dict = {
        "vehicle_model": vehicle.vehicle_model,
        "manufacturer": vehicle.manufacturer,
        "manufacturing_year": vehicle.manufacturing_year,
        "mileage_km": vehicle.mileage_km,
        "battery_age_months": vehicle.battery_age_months,
        "brake_condition": vehicle.brake_condition,
        "fuel_efficiency_kmpl": vehicle.fuel_efficiency_kmpl,
        "last_oil_change_date": vehicle.last_oil_change_date,
        "last_service_date": vehicle.last_service_date,
        "has_unusual_noise": vehicle.has_unusual_noise,
        "has_vibration": vehicle.has_vibration,
        "has_reduced_mileage": vehicle.has_reduced_mileage,
        "has_braking_issues": vehicle.has_braking_issues,
        "additional_symptoms": vehicle.additional_symptoms,
        # OBD-II fields
        "battery_voltage": vehicle.battery_voltage,
        "engine_temp_c": vehicle.engine_temp_c,
        "has_dtc": vehicle.has_dtc,
        "dtc_codes": vehicle.dtc_codes,
        "avg_speed_kmh": vehicle.avg_speed_kmh,
        "engine_runtime_hours": vehicle.engine_runtime_hours,
    }

    return _analyze(vehicle_id, vehicle_dict)


@router.post("/analyze-quick", response_model=MaintenanceReport)
def analyze_quick(data: MaintenanceAnalysisInput):
    """Analyze without saving — for mobile quick-check."""
    return _analyze(0, data.model_dump())


@router.get("/history/{vehicle_id}", response_model=List[ServiceRecordResponse])
def get_service_history(vehicle_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(ServiceRecord)
        .filter(ServiceRecord.vehicle_id == vehicle_id)
        .order_by(ServiceRecord.created_at.desc())
        .all()
    )
    return records


@router.post("/history", response_model=ServiceRecordResponse)
def add_service_record(data: ServiceRecordCreate, db: Session = Depends(get_db)):
    record = ServiceRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/history/{record_id}/complete", response_model=ServiceRecordResponse)
def mark_service_complete(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ServiceRecord).filter(ServiceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.is_completed = True
    record.completed_date = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record
