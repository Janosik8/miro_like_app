import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Correct the path to the client folder
app.mount("/client", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../client")), name="client")

clients = []
drawing_data = []  # Store all drawing data here

@app.get("/")
async def get():
    with open(os.path.join(os.path.dirname(__file__), "../client/index.html")) as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    # Send the stored drawing data to the new client
    for data in drawing_data:
        await websocket.send_text(data)

    try:
        while True:
            data = await websocket.receive_text()

            data_json = data.strip()

            # Clear drawing data if 'clear' message received
            if '"type":"clear"' in data_json:
                drawing_data.clear()  # Clear stored data
                for client in clients:
                    await client.send_text(data)  # Broadcast 'clear' to all clients
                continue

            drawing_data.append(data)

            for client in clients:
                if client != websocket:
                    await client.send_text(data)
    except WebSocketDisconnect:
        clients.remove(websocket)

