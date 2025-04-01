const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentDrawingPacket = [];

const socket = new WebSocket("ws://192.168.55.39:8000/ws");

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

let lineWidth = 5;
let drawingData = [];
let drawingDataOtherUsers = [];
const clientColor = getRandomColor();

// Toolbar Controls
toolbar.addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingData = [];
        socket.send(JSON.stringify({ type: 'clear' }));
    }
});

toolbar.addEventListener('change', e => {
    if (e.target.id === 'lineWidth') {
        lineWidth = parseInt(e.target.value, 10);
    }
});

// Drawing
function draw(e) {
    if (!isDrawing) return;

    const x = e.clientX - canvasOffsetX;
    const y = e.clientY - canvasOffsetY;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = clientColor;
    ctx.lineCap = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();

    currentDrawingPacket.push({
        type: 'draw',
        x,
        y,
        strokeStyle: clientColor,
        lineWidth
    });
}

// Rerender Canvas
function rerenderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    drawingData.forEach(data => {
        if (data.type === 'start') {
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);
        } else if (data.type === 'draw') {
            ctx.lineWidth = data.lineWidth;
            ctx.strokeStyle = data.strokeStyle;
            ctx.lineCap = 'round';
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
        } else if (data.type === 'end') {
            ctx.beginPath();
        }
    });
}

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    currentDrawingPacket = [];

    const x = e.clientX - canvasOffsetX;
    const y = e.clientY - canvasOffsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);

    currentDrawingPacket.push({
        type: 'start',
        x,
        y,
        strokeStyle: clientColor,
        lineWidth
    });
});

canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;

    isDrawing = false;
    ctx.beginPath();

    currentDrawingPacket.push({ type: 'end' });
    drawingData.push(...currentDrawingPacket);
    socket.send(JSON.stringify(currentDrawingPacket)); // send the full packet
    currentDrawingPacket = [];
    drawingData.push(...drawingDataOtherUsers);
    drawingDataOtherUsers = [];
    rerenderCanvas();
});

// Mouse Move
canvas.addEventListener('mousemove', draw);

// Receive drawing data
socket.onmessage = (event) => {
    const dataPacket = JSON.parse(event.data);

    if (Array.isArray(dataPacket)) {

        drawingDataOtherUsers.push(...dataPacket);
        
        if(!isDrawing){
            drawingData.push(...drawingDataOtherUsers);
            drawingDataOtherUsers = [];
            rerenderCanvas();
        }
    } else if (dataPacket.type === 'clear') {
        drawingData = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

// Utility
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    return '#' + Array.from({ length: 6 }, () =>
        letters[Math.floor(Math.random() * 16)]
    ).join('');
}