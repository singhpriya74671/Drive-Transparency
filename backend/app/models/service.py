from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    service_type = Column(String(100), nullable=False)
    component = Column(String(100))
    urgency = Column(String(20))        # critical / warning / good
    health_score = Column(Float)        # 0-100
    explanation = Column(Text)
    estimated_cost_min = Column(Float)
    estimated_cost_max = Column(Float)
    is_completed = Column(Boolean, default=False)
    completed_date = Column(DateTime)
    service_center = Column(String(200))
    actual_cost = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="service_records")
