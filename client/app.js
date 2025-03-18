const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

let isDrawing = false;
const socket = new WebSocket("ws://localhost:8000/ws");

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    startX = e.clientX;
    startY = e.clientY;
    draw();
});

canvas.addEventListener('mouseup', e => {
    isPainting = false;
    ctx.stroke();
    ctx.beginPath();
});
canvas.addEventListener('mousemove', draw);

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

function draw(e) {
    if (!isDrawing) return;

    const x = e.clientX;
    const y = e.clientY;
    const strokeStyle = document.getElementById('stroke').value;
    const lineWidth = document.getElementById('lineWidth').value;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.lineCap = 'round';

    ctx.lineTo(e.clientX - canvasOffsetX, e.clientY);
    ctx.stroke();
    
    //ctx.moveTo(x, y);

    // Send drawing data to the server
    socket.send(JSON.stringify({ x, y, strokeStyle, lineWidth }));  

}

// Receive drawing data from other clients
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    ctx.lineWidth = data.lineWidth;
    ctx.strokeStyle = data.strokeStyle;
    ctx.lineCap = 'round';

    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
};
