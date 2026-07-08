from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.database.session import Base

class HistoricalAnalyticsLog(Base):
    """
    SQLAlchemy Object Relational Mapping (ORM) model class mapping directly 
    to the permanent 'mock_test_analytics_ledger' physical table.
    """
    __tablename__ = "mock_test_analytics_ledger"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_uid = Column(String(128), index=True, nullable=False)
    session_id = Column(String(64), nullable=True) # Groups individual question events into one session attempt
    topic_node = Column(String(256), nullable=False)
    question_statement = Column(Text, nullable=False)
    difficulty_tier = Column(String(32), nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

class HistoricalExamSummary(Base):
    """
    SQLAlchemy Object Relational Mapping (ORM) model class mapping directly
    to the permanent 'mock_exam_summaries' table for final exam scores.
    """
    __tablename__ = "mock_exam_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_uid = Column(String(128), index=True, nullable=False)
    topic = Column(String(256), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    accuracy = Column(String(32), nullable=False)
    time_taken = Column(String(32), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)