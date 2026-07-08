from typing import Optional
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_firebase import verify_firebase_token
from app.core.ai_agents import adaptive_exam_engine, ai_client, question_gen_engine
from app.database.session import get_async_db_session  # Database session dependency
from app.models.db_models import HistoricalAnalyticsLog, HistoricalExamSummary  # SQLAlchemy ORM model

from app.core.rate_limiter import rate_limit_dependency
from app.database.redis_cache import set_leaderboard_cache_score, fetch_top_room_rankings
from app.database.firestore_db import log_exam_to_firestore
from app.api.v1.real_time import trigger_push_notification_alert
from firebase_admin import firestore

router = APIRouter(prefix="/test", tags=["Adaptive Testing Workspace Engine"])

class GenerateQuestionRequest(BaseModel):
    topic: str = Field(..., description="The exam topic to generate the question for.")
    difficulty: str = Field(..., description="EASY, MEDIUM, or HARD.")
    previous_questions: list[str] = Field([], description="List of previously generated question texts to avoid duplicates.")

class GeneratedQuestionSchema(BaseModel):
    text: str = Field(..., description="The conceptual question statement.")
    options: list[str] = Field(..., min_length=4, max_length=4, description="Exactly four options for the question.")
    correct_option_index: int = Field(..., ge=0, le=3, description="The 0-indexed correct option.")
    hint: str = Field(..., description="A helpful hint for the student.")

class ProcessAnswerSchema(BaseModel):
    question_text: str = Field(..., description="The context text block statement evaluating logic properties.")
    options: list[str] = Field(..., description="Array housing structural choice components.")
    correct_option_index: int = Field(..., ge=0, le=3, description="Ground truth answer pointer.")
    user_selected_index: Optional[int] = Field(None, description="The selection index; pass null/None if skipped.")
    current_difficulty: str = Field(..., description="EASY, MEDIUM, or HARD status token.")
    topic: str = Field(..., description="The topic context.")
    session_id: Optional[str] = Field(None, description="Groups individual questions into a single session.")

class SaveResultsSchema(BaseModel):
    topic: str = Field(..., description="Exam topic name.")
    score: int = Field(..., description="Total correct answers.")
    total_questions: int = Field(..., description="Total questions count.")
    accuracy: str = Field(..., description="Accuracy string representation.")
    time_taken: str = Field(..., description="Formatted string of time taken.")

@router.post("/process-submit", dependencies=[Depends(rate_limit_dependency)])
async def submit_exam_question_node(
    payload: ProcessAnswerSchema,
    current_user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_async_db_session)  # Injected async database transaction channel
):
    """
    Processes user response selections live.
    Runs the multi-agent LangGraph execution pipeline to return scores, 
    instant conceptual feedback, and calculates the adaptive next question difficulty parameters.
    Saves persistent transaction analytics to PostgreSQL asynchronously.
    """
    try:
        # 1. Bind payload data objects directly into state attributes parameters ledger
        input_state = {
            "question_text": payload.question_text,
            "options": payload.options,
            "correct_option_index": payload.correct_option_index,
            "user_selected_index": payload.user_selected_index,
            "current_difficulty": payload.current_difficulty,
            "is_correct": None,
            "next_difficulty": None,
            "ai_feedback": None
        }
        
        # 2. Invoke the compiled state graph engine asynchronously in a separate worker thread
        output_state = await asyncio.to_thread(adaptive_exam_engine.invoke, input_state)
        
        # 3. Prepare Immutable Audit Log payload mapping for PostgreSQL persistence
        analytics_record = HistoricalAnalyticsLog(
            student_uid=current_user["uid"],
            session_id=payload.session_id,
            topic_node=payload.topic,  # Dynamic topic node context tracker
            question_statement=payload.question_text,
            difficulty_tier=payload.current_difficulty,
            is_correct=bool(output_state["is_correct"])
        )
        
        # 4. Stage row entry inside the transactional pipeline buffer frame
        # NOTE: get_async_db_session auto-handles async .commit() cleanup cleanly upon return.
        db.add(analytics_record)
        
        # 5. Return compiled JSON results back to the React UI client
        return {
            "student_uid": current_user["uid"],
            "is_correct": output_state["is_correct"],
            "ai_explanation": output_state["ai_feedback"],
            "recommended_next_difficulty": output_state["next_difficulty"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph or Database execution pipeline execution halted: {str(e)}"
        )

@router.post("/generate-question", response_model=GeneratedQuestionSchema, dependencies=[Depends(rate_limit_dependency)])
async def generate_single_question(
    payload: GenerateQuestionRequest,
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Dynamically generates a custom multiple-choice question tailored to the topic and difficulty
    using Google Gemini-3.1-flash-lite with Structured Outputs (JSON Schema compliance).
    """
    input_gen_state = {
        "topic": payload.topic,
        "difficulty": payload.difficulty,
        "previous_questions": payload.previous_questions,
        "generated_text": None,
        "generated_options": None,
        "correct_option_index": None,
        "hint": None
    }
    
    try:
        # Run the entire LangGraph pipeline asynchronously in a background worker thread
        output_state = await asyncio.to_thread(question_gen_engine.invoke, input_gen_state)
        return GeneratedQuestionSchema(
            text=output_state["generated_text"],
            options=output_state["generated_options"],
            correct_option_index=output_state["correct_option_index"],
            hint=output_state["hint"]
        )
    except Exception as e:
        print(f"Error generating question: {e}")
        # Fallback question
        return GeneratedQuestionSchema(
            text=f"Under {payload.difficulty} constraints, what is the default time complexity of searching a value in a binary search tree in the worst case?",
            options=["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            correct_option_index=2,
            hint="Think of an unbalanced, skewed binary search tree which degenerates into a linked list."
        )

@router.post("/save-results", dependencies=[Depends(rate_limit_dependency)])
async def save_exam_results(
    payload: SaveResultsSchema,
    current_user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Saves final exam results: updates Redis leaderboard, logs details to Firestore,
    persists the summary to PostgreSQL, and triggers a dynamic FCM push notification alert.
    """
    room_id = payload.topic
    # 1. Update Redis Leaderboard cache
    await set_leaderboard_cache_score(room_id, current_user["name"], payload.score)

    # 2. Log details to Firebase Firestore
    await log_exam_to_firestore(
        student_uid=current_user["uid"],
        topic=payload.topic,
        score=payload.score,
        total_questions=payload.total_questions,
        accuracy=payload.accuracy,
        time_taken=payload.time_taken
    )

    # 3. Persist final summary metrics directly in PostgreSQL analytics audit store
    summary_record = HistoricalExamSummary(
        student_uid=current_user["uid"],
        topic=payload.topic,
        score=payload.score,
        total_questions=payload.total_questions,
        accuracy=payload.accuracy,
        time_taken=payload.time_taken
    )
    db.add(summary_record)

    # 4. Dispatch simulated FCM push alert notifying of assessment completion
    trigger_push_notification_alert(
        target_fcm_token="mock_user_device_fcm_token_123",
        title="Exam Results Synchronized! 🎓",
        body=f"Congratulations {current_user['name']}! You scored {payload.score}/{payload.total_questions} on your {payload.topic} practice run."
    )

    return {"status": "success", "message": "Exam results synchronized successfully across Redis, Firestore, and PostgreSQL."}

@router.get("/leaderboard/rankings/{room_id}", dependencies=[Depends(rate_limit_dependency)])
async def get_leaderboard_rankings(room_id: str):
    """
    Fetches the top rankings for a specific exam/room topic from the Redis cache.
    """
    rankings = await fetch_top_room_rankings(room_id, limit=10)
    return {"room_id": room_id, "rankings": rankings}

@router.get("/history", dependencies=[Depends(rate_limit_dependency)])
async def get_student_exam_history(
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Fetches the complete exam results history for the authenticated user from Firestore.
    """
    try:
        db = firestore.client()
        docs = db.collection("exam_results")\
                 .where("student_uid", "==", current_user["uid"])\
                 .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                 .stream()
        history = []
        for doc in docs:
            data = doc.to_dict()
            history.append({
                "id": doc.id,
                "topic": data.get("topic"),
                "score": f"{data.get('score')}/{data.get('total_questions')}",
                "accuracy": data.get("accuracy"),
                "time": data.get("time_taken"),
                "date": data.get("timestamp").strftime("%Y-%m-%d %H:%M") if data.get("timestamp") else "Recent"
            })
        return history
    except Exception as e:
        print(f"Firestore history fetch skipped/failed: {e}")
        return []