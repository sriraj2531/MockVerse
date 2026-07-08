import firebase_admin
from firebase_admin import auth,credentials
from fastapi import HTTPException,Security,status
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from app.config import settings

# Initialize the Firebase Admin SDK exactly once upon application bootup
if not firebase_admin._apps:
    try:
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
        print("Firebase Admin SDK successfully initialized.")
    except Exception as e:
        print(f"CRITICAL ERROR: Firebase initialization failed: {str(e)}")
        
# Instantiate the HTTPBearer security provider scheme
# This tells FastAPI to look automatically for an "Authorization: Bearer <TOKEN>" header
security_bearer = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security_bearer)):
    """
    Dependency Injection Hook to shield protected routes.
    Intercepts incoming bearer tokens, cryptographically decodes them,
    and yields user metadata profile credentials context block.
    """
    if settings.ENVIRONMENT != "production" and (credentials is None or credentials.credentials == "MOCK_SECURE_JWT_TOKEN_STRING"):
        return {
            "uid": "mock_local_student_123",
            "email": "sreedharasriraj@gmail.com",
            "name": "Sriraj Sreedhara"
        }
    
    token = credentials.credentials
    
    try:
        import asyncio
        # Cryptographically parse and verify the JWT string token locally in memory in a worker thread
        decoded_token = await asyncio.to_thread(auth.verify_id_token, token)
        
        # Return a dictionary containing the validated user's parameters
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name", "User")
        }
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token credentials supplied.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )