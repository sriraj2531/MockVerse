from firebase_admin import firestore

async def log_exam_to_firestore(student_uid: str, topic: str, score: int, total_questions: int, accuracy: str, time_taken: str):
    """
    Asynchronously registers user session results to Firebase Firestore.
    Runs in a try-except block to fail-open gracefully if Firebase Credentials are not fully setup in sandbox.
    """
    try:
        db = firestore.client()
        doc_ref = db.collection("exam_results").document()
        doc_ref.set({
            "student_uid": student_uid,
            "topic": topic,
            "score": score,
            "total_questions": total_questions,
            "accuracy": accuracy,
            "time_taken": time_taken,
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        print(f"Logged exam results to Firestore for user: {student_uid}")
    except Exception as e:
        print(f"Firestore logging skipped/failed: {e}")
