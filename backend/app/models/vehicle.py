from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    vehicle_model = Column(String(100), nullable=False)
    manufacturer = Column(String(100))
    manufacturing_year = Column(Integer, nullable=False)
    mileage_km = Column(Float, nullable=False)
    fuel_type = Column(String(20), default="petrol")

    last_service_date = Column(DateTime)
    last_oil_change_date = Column(DateTime)
    battery_age_months = Column(Integer, default=0)
    brake_condition = Column(String(20), default="good")
    fuel_efficiency_kmpl = Column(Float)

    has_unusual_noise = Column(Boolean, default=False)
    has_vibration = Column(Boolean, default=False)
    has_reduced_mileage = Column(Boolean, default=False)
    has_braking_issues = Column(Boolean, default=False)
    additional_symptoms = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service_records = relationship("ServiceRecord", back_populates="vehicle")
