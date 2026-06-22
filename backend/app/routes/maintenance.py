from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.service import ServiceRecord
from app.schemas.service import MaintenanceReport, ComponentHealth, ServiceRecordCreate, ServiceRecordResponse
from app.ml.predictor import predict_maintenance, compute_overall_health

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/analyze/{vehicle_id}", response_model=MaintenanceReport)
def analyze_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle_dict = {
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
    }

    components_raw = predict_maintenance(vehicle_dict)
    overall = compute_overall_health(components_raw)

    components = [ComponentHealth(**c) for c in components_raw]

    return MaintenanceReport(
        vehicle_id=vehicle_id,
        overall_health_score=overall["overall_health_score"],
        overall_status=overall["overall_status"],
        top_alert=overall.get("top_alert"),
        components=components,
        generated_at=datetime.utcnow(),
    )


@router.post("/analyze-quick", response_model=MaintenanceReport)
def analyze_quick(data: dict):
    """Analyze without saving — for mobile quick-check."""
    components_raw = predict_maintenance(data)
    overall = compute_overall_health(components_raw)
    components = [ComponentHealth(**c) for c in components_raw]

    return MaintenanceReport(
        vehicle_id=0,
        overall_health_score=overall["overall_health_score"],
        overall_status=overall["overall_status"],
        top_alert=overall.get("top_alert"),
        components=components,
        generated_at=datetime.utcnow(),
    )


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
