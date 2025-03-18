const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const ctx = canvas.getContext('2d');

let isDrawing = false;
const socket = new WebSocket("ws://localhost:8000/ws");

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

let lineWidth = 5;
let drawingData = [];  // Store drawing data for rerendering
const clientColor = getRandomColor();  // Unique color for each client

// Toolbar Controls
toolbar.addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingData = [];  // Clear stored data as well

        // Notify server that drawing data has been cleared
        socket.send(JSON.stringify({ type: 'clear' }));
    }
});

toolbar.addEventListener('change', e => {
    if(e.target.id === 'lineWidth') {
        lineWidth = parseInt(e.target.value, 10);
    }
});

// Drawing Function
function draw(e) {
    if (!isDrawing) return;

    const x = e.clientX - canvasOffsetX;
    const y = e.clientY - canvasOffsetY;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = clientColor;  // Use the client's unique color
    ctx.lineCap = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();

    // Store drawing data for rerendering
    const data = { type: 'draw', x, y, strokeStyle: clientColor, lineWidth };
    drawingData.push(data);

    // Send drawing data to the server
    socket.send(JSON.stringify(data));  
}

// Rerender Canvas
function rerenderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas first
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
        }
    });
}

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const startX = e.clientX - canvasOffsetX;
    const startY = e.clientY - canvasOffsetY;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const startData = { type: 'start', x: startX, y: startY, strokeStyle: clientColor };
    drawingData.push(startData);

    socket.send(JSON.stringify(startData));  // Notify others of new line start
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath();

    const endData = { type: 'end' };
    socket.send(JSON.stringify(endData));  // Notify others to stop the path
});

// Mouse Move
canvas.addEventListener('mousemove', draw);

// Receive drawing data from other clients
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'clear') {
        drawingData = [];  // Clear stored data for all clients
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    } else if (data.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        drawingData.push(data);
    } else if (data.type === 'draw') {
        drawingData.push(data);
        rerenderCanvas();
    } else if (data.type === 'end') {
        ctx.beginPath();  // End the path correctly
    }
};

// Utility: Generate Random Color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
