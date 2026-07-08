import json
from typing import List
from fastapi import APIRouter,WebSocket,WebSocketDisconnect,Depends,Query
from firebase_admin import messaging
from app.core.auth_firebase import auth

router = APIRouter(prefix="/ws", tags=["Real-Time WebSockets & Notifications"])
# =========================================================================
# WEBSOCKET CONNECTION MANAGER
# =========================================================================

class WebSocketConnectionManager:
    """
    Tracks and broadcasts text frames across active bidirectional WebSocket client sockets.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        
    async def broadcast_to_all(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Silently prune stale connections that failed to receive text frames
                pass
            
ws_manager = WebSocketConnectionManager()

@router.websocket("/live-updates")
async def live_updates_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Firebase identification token passed via query parameters.")
):
    """
    Bidirectional WebSocket stream node.
    Authorizes users via token query parameter and opens a persistent TCP socket pipeline.
    """
    
    await ws_manager.connect(websocket)
    # 1. Authenticate token upon initial socket frame handshake connection
    try:
        decoded_token = auth.verify_id_token(token)
        student_name = decoded_token.get("name", "Student")
    except Exception:
        await websocket.send_text(json.dumps({"error": "WebSocket authentication failed."}))
        await websocket.close(code=1008)
        ws_manager.disconnect(websocket)
        return
    
    # 2. Inform channels that a new node has registered to the cluster
    await ws_manager.broadcast_to_all(json.dumps({
        "event": "USER_CONNECTED",
        "message": f"{student_name} joined the live practice lab space!"
    }))
    
    # 3. Enter persistent message consumption loop state
    try:
        while True:
            # Non-blocking async listen for incoming network strings from the user
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Broadcast the incoming client packet frames across all listener nodes
            await ws_manager.broadcast_to_all(json.dumps({
                "event": "LIVE_ACTIVITY_BROADCAST",
                "sender": student_name,
                "payload": payload
            }))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        await ws_manager.broadcast_to_all(json.dumps({
            "event": "USER_DISCONNECTED",
            "message": f"{student_name} disconnected from the active session pipeline."
        }))
        
    
# =========================================================================
# FIREBASE PUSH NOTIFICATIONS (FCM) UTILITY
# =========================================================================

def trigger_push_notification_alert(target_fcm_token: str, title: str, body: str):
    """
    Dispatches asynchronous push notification data payloads downstream via Firebase Cloud Messaging (FCM).
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            token=target_fcm_token,
        )
        # Transmit the payload asynchronously across Google messaging cluster lines
        response = messaging.send(message)
        return {"status": "dispatched", "message_id": response}
    except Exception as e:
        return {"status": "failed", "error": str(e)}