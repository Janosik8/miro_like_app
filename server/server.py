import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Correct the path to the client folder
app.mount("/client", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../client")), name="client")

clients = []

@app.get("/")
async def get():
    with open(os.path.join(os.path.dirname(__file__), "../client/index.html")) as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            for client in clients:
                if client != websocket:
                    await client.send_text(data)
    except WebSocketDisconnect:
        clients.remove(websocket)

