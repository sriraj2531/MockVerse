from typing import TypedDict,Optional
from google import genai
from langgraph.graph import StateGraph,END
from app.config import settings

# Initialize the next-gen official Google GenAI API client engine
ai_client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Define the global state shape tracking parameters flowing through the agents
class TestSessionState(TypedDict):
    question_text: str
    options: list[str]
    correct_option_index: int     # The ground-truth correct position (0 to 3)
    user_selected_index: Optional[int]  # null if user skipped the question
    current_difficulty: str        # "EASY", "MEDIUM", "HARD"
    is_correct: Optional[bool]
    next_difficulty: Optional[str]
    ai_feedback: Optional[str]
    
    
# =========================================================================
# NODE 1: Evaluation Agent
# =========================================================================

def evaluation_node(state: TestSessionState) -> dict :
    """
    Evaluates the correctness of the student's answer submission.
    Handles explicit skipped parameters safely.
    """
    user_choice = state.get("user_selected_index")
    correct_choice = state["correct_option_index"]
    
    # Check condition C: Question skipped/left unanswered entirely
    if user_choice is None:
        return {
            "is_correct": False, 
            "ai_feedback": "Question was skipped by the student. System difficulty locked."
        }
        
    # Evaluate boolean correctness state directly
    is_correct = (user_choice == correct_choice)
    
    # Construct a concise contextual hint/explanation summary prompt via Gemini
    status_string = "CORRECT" if is_correct else "INCORRECT"
    prompt = f"""
    You are an elite Computer Science educational assistant.
    Question: {state['question_text']}
    Options: {state['options']}
    Correct Option: {state['options'][correct_choice]}
    User Selection: {state['options'][user_choice]}
    Evaluation: {status_string}
    
    Write a clear, single-sentence explanation detailing the underlying computer science principle for this answer.
    """
    
    try:
        response = ai_client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt
        )
        feedback = response.text.strip() if response.text else "Evaluation Complete."
    except Exception as e:
        feedback = f"Evaluation processed cleanly. (AI baseline logic applied)."
    
    return {"is_correct": is_correct, "ai_feedback": feedback}


# =========================================================================
# NODE 2: Difficulty Adaptation Agent
# =========================================================================

def adaptation_node(state: TestSessionState) -> dict:
    """
    Applies the precise required adaptive ladder routing matrix:
    Correct -> Increase Difficulty
    Incorrect -> Decrease Difficulty
    Skipped -> No Change
    """
    
    user_choice = state.get("user_selected_index")
    current = state["current_difficulty"].upper()
    is_correct = state.get("is_correct",False)
    
    
    # Rule 3: If left unanswered/skipped, difficulty remains exactly the same
    if user_choice is None:
        return {"next_difficulty": current}
        
    next_diff = current
    
    if is_correct:
        # Rule 1: Correct -> Shift up the ladder matrix parameters
        if current == "EASY": next_diff = "MEDIUM"
        elif current == "MEDIUM": next_diff = "HARD"
        elif current == "HARD": next_diff = "HARD" # Cap at ceiling limit
    else:
        # Rule 2: Incorrect -> Scale down to support student capability tracking
        if current == "HARD": next_diff = "MEDIUM"
        elif current == "MEDIUM": next_diff = "EASY"
        elif current == "EASY": next_diff = "EASY" # Floor limit floor
        
    return {"next_difficulty": next_diff}

# =========================================================================
# Graph Construction & Compilation Lifecycle
# =========================================================================
workflow = StateGraph(TestSessionState)

# Pin the computing agent logic modules directly to state parameters nodes
workflow.add_node("evaluator", evaluation_node)
workflow.add_node("adapter", adaptation_node)

# Map edge connection workflow loops
workflow.set_entry_point("evaluator")
workflow.add_edge("evaluator", "adapter")
workflow.add_edge("adapter", END)

# Compile framework workflow graph into a fully runnable execution engine
adaptive_exam_engine = workflow.compile()

# =========================================================================
# QUESTION GENERATION STATE GRAPH
# =========================================================================

class QuestionGenState(TypedDict):
    topic: str
    difficulty: str
    previous_questions: list[str]
    generated_text: Optional[str]
    generated_options: Optional[list[str]]
    correct_option_index: Optional[int]
    hint: Optional[str]

def question_generator_node(state: QuestionGenState) -> dict:
    """
    Generates a multiple choice question structure context without a hint.
    """
    prompt = f"""
    You are an elite computer science professor preparing high-yield exam questions.
    Generate a multiple-choice question on the topic: "{state['topic']}" with difficulty tier: "{state['difficulty'].upper()}".
    
    CRITICAL: Avoid generating any questions similar to these previously asked questions:
    {state['previous_questions']}
    
    Ensure the options are plausible and there is exactly one correct option.
    """
    try:
        class GeneratedBaseQuestion(TypedDict):
            text: str
            options: list[str]
            correct_option_index: int

        response = ai_client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": GeneratedBaseQuestion,
            }
        )
        import json
        data = json.loads(response.text)
        return {
            "generated_text": data["text"],
            "generated_options": data["options"],
            "correct_option_index": data["correct_option_index"]
        }
    except Exception as e:
        print(f"Error in question generator node: {e}")
        return {
            "generated_text": f"Under {state['difficulty']} constraints, what is the default time complexity of searching a value in a binary search tree in the worst case?",
            "generated_options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            "correct_option_index": 2
        }

def question_hinter_node(state: QuestionGenState) -> dict:
    """
    Generates a targeted, distinct conceptual hint for the generated question.
    """
    prompt = f"""
    You are an expert computer science assistant.
    Given this multiple-choice question:
    Question: {state['generated_text']}
    Options: {state['generated_options']}
    Correct Option Index: {state['correct_option_index']}
    
    Write a single-sentence conceptual hint helping the student derive the correct answer without revealing the correct option directly.
    """
    try:
        response = ai_client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt
        )
        hint = response.text.strip() if response.text else "Recall the properties of the data structure/algorithm."
        return {"hint": hint}
    except Exception as e:
        print(f"Error in hinter node: {e}")
        return {"hint": "Think of an unbalanced, skewed binary search tree which degenerates into a linked list."}

# Build the Question Generation LangGraph
q_workflow = StateGraph(QuestionGenState)
q_workflow.add_node("generator", question_generator_node)
q_workflow.add_node("hinter", question_hinter_node)
q_workflow.set_entry_point("generator")
q_workflow.add_edge("generator", "hinter")
q_workflow.add_edge("hinter", END)
question_gen_engine = q_workflow.compile()