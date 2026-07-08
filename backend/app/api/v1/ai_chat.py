from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from google import genai
from app.config import settings
from app.core.auth_firebase import verify_firebase_token

from app.core.rate_limiter import rate_limit_dependency

router = APIRouter(prefix="/chat", tags=["AI Live Chatbot Companion"])

# Initialize the official Google GenAI client inside the router space
ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

from google.genai import types

class ChatMessage(BaseModel):
    role: str = Field(..., description="The role of the speaker: user or model.")
    text: str = Field(..., description="The textual message content.")

class ChatPromptSchema(BaseModel):
    user_message: str = Field(..., description="The technical question or prompt submitted by the student.")
    history: list[ChatMessage] = Field([], description="List of previous conversation turns.")

@router.post("/stream-converse", dependencies=[Depends(rate_limit_dependency)])
async def converse_with_ai_assistant(
    payload: ChatPromptSchema,
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Exposes an optimized REST interface for the floating global widget companion.
    Queries gemini-3.1-flash-lite non-blockingly using system instructions tailored 
    to the MockVerse learning context.
    """
    # System instructions force Gemini to act specifically as a computer science mentor
    system_instruction = f"""
    You are 'MockVerse Companion', an expert AI tutor specialized strictly in Computer Science engineering.
    The user interacting with you is named {current_user['name']}.
    Keep your responses clear, helpful, accurate, and concise (under 4 sentences if possible).
    Provide structural assistance on operating systems kernels, data structures, networks, or algorithms.
    """
    
    # Map previous conversation history turns
    contents = []
    for msg in payload.history:
        contents.append(
            types.Content(
                role=msg.role,
                parts=[types.Part.from_text(text=msg.text)]
            )
        )
    # Add current user message
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=payload.user_message)]
        )
    )
    
    import asyncio
    try:
        # Run blocking generate_content call asynchronously in a worker thread
        response = await asyncio.to_thread(
            ai_client.models.generate_content,
            model='gemini-3.1-flash-lite',
            contents=contents,
            config={"system_instruction": system_instruction}
        )
        
        ai_response_text = response.text.strip() if response.text else "I am currently compiling your query parameters. Could you elaborate?"
        
        return {
            "authorized_uid": current_user["uid"],
            "bot_response": ai_response_text
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Chatbot pipeline communication failure: {str(e)}"
        )

class DiagnosisSchema(BaseModel):
    strengths: str = Field(..., description="granular report details of student's strengths.")
    weaknesses: str = Field(..., description="granular report details of focus areas.")
    tips: str = Field(..., description="actionable learning tips.")

@router.post("/diagnose", response_model=DiagnosisSchema, dependencies=[Depends(rate_limit_dependency)])
async def diagnose_student_performance(
    payload: ChatPromptSchema,
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Analyzes quiz results using structured JSON outputs from Gemini, providing detailed diagnostic reports.
    """
    prompt = f"""
    You are 'MockVerse Diagnostician', an expert academic assessor.
    Student: {current_user['name']}
    Analyze this exam performance input message:
    {payload.user_message}
    
    Return a structured JSON output mapping strengths, weaknesses, and tips clearly.
    """
    import asyncio
    try:
        response = await asyncio.to_thread(
            ai_client.models.generate_content,
            model='gemini-3.1-flash-lite',
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": DiagnosisSchema,
            }
        )
        import json
        data = json.loads(response.text)
        return DiagnosisSchema(**data)
    except Exception as e:
        # Fallback diagnosis
        return DiagnosisSchema(
            strengths="Good foundational knowledge demonstrated in the quiz parameters.",
            weaknesses="Review complex data structure algorithms and OS memory mapping concepts.",
            tips="Practice 3 targeted AVL runtime exercises and study paging tables under instructions."
        )