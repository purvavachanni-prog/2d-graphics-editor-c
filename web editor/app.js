// Constants
const WIDTH = 60;
const HEIGHT = 20;

// Application State
let shapes = [];
let nextShapeId = 1;
let currentTool = 'line'; // 'line', 'rect', 'circle', 'triangle'
let clickPoints = [];
let hoveredCell = null;
let editingShapeId = null;

// DOM Cache
const gridCanvas = document.getElementById('pixel-grid');
const cursorCoords = document.getElementById('cursor-coords');
const toolBtns = document.querySelectorAll('.tool-btn');
const toolInstructions = document.getElementById('tool-instructions');
const shapesList = document.getElementById('shapes-list');
const btnClear = document.getElementById('btn-clear');
const btnExport = document.getElementById('btn-export');
const exportModal = document.getElementById('export-modal');
const exportText = document.getElementById('export-text');
const btnCopyExport = document.getElementById('btn-copy-export');
const btnCloseModal = document.getElementById('btn-close-modal');
const editPanel = document.getElementById('edit-panel');
const editShapeIdSpan = document.getElementById('edit-shape-id');
const editInputsContainer = document.getElementById('edit-inputs-container');
const btnSaveEdit = document.getElementById('btn-save-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Grid Cell Element Map (for fast lookup)
const cellElements = []; // 2D array [y][x]

// -------------------------------------------------------------
// Geometric Drawing Algorithms (Equivalent to C implementations)
// -------------------------------------------------------------

// Bounds Checking helper
function inBounds(x, y) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}

// Bresenham's Line Algorithm
function getLinePoints(x1, y1, x2, y2) {
    const points = [];
    const dx = Math.abs(x2 - x1);
    const dy = -Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx + dy;

    let cx = x1;
    let cy = y1;

    while (true) {
        if (inBounds(cx, cy)) {
            points.push({ x: cx, y: cy });
        }
        if (cx === x2 && cy === y2) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            cx += sx;
        }
        if (e2 <= dx) {
            err += dx;
            cy += sy;
        }
    }
    return points;
}

// Rectangle Drawing (borders only)
function getRectPoints(x, y, w, h) {
    const points = [];
    if (w <= 0 || h <= 0) return points;

    // Top and Bottom horizontal edges
    for (let i = 0; i < w; i++) {
        if (inBounds(x + i, y)) points.push({ x: x + i, y: y });
        if (inBounds(x + i, y + h - 1)) points.push({ x: x + i, y: y + h - 1 });
    }
    // Left and Right vertical edges
    for (let i = 0; i < h; i++) {
        if (inBounds(x, y + i)) points.push({ x: x, y: y + i });
        if (inBounds(x + w - 1, y + i)) points.push({ x: x + w - 1, y: y + i });
    }
    return points;
}

// Midpoint Circle Algorithm
function getCirclePoints(cx, cy, r) {
    const points = [];
    if (r < 0) return points;
    if (r === 0) {
        if (inBounds(cx, cy)) points.push({ x: cx, y: cy });
        return points;
    }

    function addPoints(x, y) {
        const symCoords = [
            { x: cx + x, y: cy + y },
            { x: cx - x, y: cy + y },
            { x: cx + x, y: cy - y },
            { x: cx - x, y: cy - y },
            { x: cx + y, y: cy + x },
            { x: cx - y, y: cy + x },
            { x: cx + y, y: cy - x },
            { x: cx - y, y: cy - x }
        ];
        symCoords.forEach(pt => {
            if (inBounds(pt.x, pt.y)) {
                points.push(pt);
            }
        });
    }

    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    addPoints(x, y);
    while (y >= x) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        addPoints(x, y);
    }
    return points;
}

// Triangle Drawing (Connects vertices)
function getTrianglePoints(x1, y1, x2, y2, x3, y3) {
    const p1 = getLinePoints(x1, y1, x2, y2);
    const p2 = getLinePoints(x2, y2, x3, y3);
    const p3 = getLinePoints(x3, y3, x1, y1);
    return [...p1, ...p2, ...p3];
}

// Get points for a specific Shape object
function getShapePoints(shape) {
    switch (shape.type) {
        case 'line':
            return getLinePoints(shape.p1, shape.p2, shape.p3, shape.p4);
        case 'rect':
            return getRectPoints(shape.p1, shape.p2, shape.p3, shape.p4);
        case 'circle':
            return getCirclePoints(shape.p1, shape.p2, shape.p3);
        case 'triangle':
            return getTrianglePoints(shape.p1, shape.p2, shape.p3, shape.p4, shape.p5, shape.p6);
        default:
            return [];
    }
}

// -------------------------------------------------------------
// Initialization & Grid Creation
// -------------------------------------------------------------

function initGrid() {
    gridCanvas.innerHTML = '';
    for (let y = 0; y < HEIGHT; y++) {
        cellElements[y] = [];
        for (let x = 0; x < WIDTH; x++) {
            const cell = document.createElement('div');
            cell.classList.add('pixel', 'empty');
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.textContent = '_';

            // Event Listeners
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('mouseleave', handleCellMouseLeave);
            cell.addEventListener('click', handleCellClick);

            gridCanvas.appendChild(cell);
            cellElements[y][x] = cell;
        }
    }
}

// -------------------------------------------------------------
// Interactive Mouse Handling & Drawing Logics
// -------------------------------------------------------------

function handleCellMouseEnter(e) {
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    hoveredCell = { x, y };
    cursorCoords.textContent = `X: ${x}, Y: ${y}`;
    drawPreview();
}

function handleCellMouseLeave() {
    hoveredCell = null;
    cursorCoords.textContent = 'Hover over grid...';
    clearPreview();
}

function handleCellClick(e) {
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    clickPoints.push({ x, y });

    updateInstructions();

    // Check if we gathered enough click points to draw the selected shape
    let finished = false;
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;

    if (currentTool === 'line' && clickPoints.length === 2) {
        p1 = clickPoints[0].x;
        p2 = clickPoints[0].y;
        p3 = clickPoints[1].x;
        p4 = clickPoints[1].y;
        addShape('line', p1, p2, p3, p4, 0, 0);
        finished = true;
    } else if (currentTool === 'rect' && clickPoints.length === 2) {
        // opposite corner style
        const x1 = clickPoints[0].x;
        const y1 = clickPoints[0].y;
        const x2 = clickPoints[1].x;
        const y2 = clickPoints[1].y;
        
        p1 = Math.min(x1, x2);
        p2 = Math.min(y1, y2);
        p3 = Math.abs(x2 - x1) + 1;
        p4 = Math.abs(y2 - y1) + 1;
        addShape('rect', p1, p2, p3, p4, 0, 0);
        finished = true;
    } else if (currentTool === 'circle' && clickPoints.length === 2) {
        // center and radius style
        const cx = clickPoints[0].x;
        const cy = clickPoints[0].y;
        const bx = clickPoints[1].x;
        const by = clickPoints[1].y;
        
        p1 = cx;
        p2 = cy;
        p3 = Math.round(Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2));
        addShape('circle', p1, p2, p3, 0, 0, 0);
        finished = true;
    } else if (currentTool === 'triangle' && clickPoints.length === 3) {
        p1 = clickPoints[0].x;
        p2 = clickPoints[0].y;
        p3 = clickPoints[1].x;
        p4 = clickPoints[1].y;
        p5 = clickPoints[2].x;
        p6 = clickPoints[2].y;
        addShape('triangle', p1, p2, p3, p4, p5, p6);
        finished = true;
    }

    if (finished) {
        clickPoints = [];
        updateInstructions();
        renderCanvas();
        updateShapesList();
    } else {
        drawPreview();
    }
}

// -------------------------------------------------------------
// Live Hover Previews
// -------------------------------------------------------------

function getPreviewPoints() {
    if (clickPoints.length === 0 || !hoveredCell) return [];

    const p1 = clickPoints[0];
    const p2 = hoveredCell;

    if (currentTool === 'line') {
        return getLinePoints(p1.x, p1.y, p2.x, p2.y);
    } else if (currentTool === 'rect') {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x) + 1;
        const h = Math.abs(p2.y - p1.y) + 1;
        return getRectPoints(x, y, w, h);
    } else if (currentTool === 'circle') {
        const r = Math.round(Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2));
        return getCirclePoints(p1.x, p1.y, r);
    } else if (currentTool === 'triangle') {
        if (clickPoints.length === 1) {
            // Only 1 click done, draw preview line to cursor
            return getLinePoints(p1.x, p1.y, p2.x, p2.y);
        } else if (clickPoints.length === 2) {
            // 2 clicks done, draw closed triangle to cursor
            const p3 = clickPoints[1];
            return getTrianglePoints(p1.x, p1.y, p3.x, p3.y, p2.x, p2.y);
        }
    }
    return [];
}

function drawPreview() {
    clearPreview();
    const pts = getPreviewPoints();
    pts.forEach(pt => {
        const cell = cellElements[pt.y][pt.x];
        if (cell && cell.classList.contains('empty')) {
            cell.classList.add('preview');
            cell.textContent = '*';
        }
    });

    // Mark current click starting points on the canvas
    clickPoints.forEach((pt, idx) => {
        const cell = cellElements[pt.y][pt.x];
        if (cell) {
            cell.classList.add('preview');
            cell.textContent = (idx + 1).toString(); // Display click sequence 1, 2...
        }
    });
}

function clearPreview() {
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const cell = cellElements[y][x];
            if (cell.classList.contains('preview')) {
                cell.classList.remove('preview');
                if (cell.classList.contains('empty')) {
                    cell.textContent = '_';
                } else {
                    cell.textContent = '*';
                }
            }
        }
    }
}

// -------------------------------------------------------------
// Shapes Management (CRUD)
// -------------------------------------------------------------

function addShape(type, p1, p2, p3, p4, p5, p6) {
    const shape = { id: nextShapeId++, type, p1, p2, p3, p4, p5, p6 };
    shapes.push(shape);
}

function deleteShape(id) {
    shapes = shapes.filter(s => s.id !== id);
    if (editingShapeId === id) {
        closeEditPanel();
    }
    renderCanvas();
    updateShapesList();
}

function modifyShape(id, p1, p2, p3, p4, p5, p6) {
    const shape = shapes.find(s => s.id === id);
    if (shape) {
        shape.p1 = p1;
        shape.p2 = p2;
        shape.p3 = p3;
        shape.p4 = p4;
        shape.p5 = p5;
        shape.p6 = p6;
    }
}

// -------------------------------------------------------------
// Canvas Render Routine (Vector to Raster)
// -------------------------------------------------------------

function renderCanvas() {
    // 1. Clear grid
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const cell = cellElements[y][x];
            cell.className = 'pixel empty';
            cell.textContent = '_';
        }
    }

    // 2. Draw all shapes
    shapes.forEach(shape => {
        const pts = getShapePoints(shape);
        pts.forEach(pt => {
            const cell = cellElements[pt.y][pt.x];
            if (cell) {
                cell.className = 'pixel filled';
                cell.textContent = '*';
            }
        });
    });
}

// -------------------------------------------------------------
// Sidebar View Controllers
// -------------------------------------------------------------

function getShapeDescription(shape) {
    switch (shape.type) {
        case 'line':
            return `Line from (${shape.p1}, ${shape.p2}) to (${shape.p3}, ${shape.p4})`;
        case 'rect':
            return `Rectangle at (${shape.p1}, ${shape.p2}), W:${shape.p3}, H:${shape.p4}`;
        case 'circle':
            return `Circle at (${shape.p1}, ${shape.p2}), R: ${shape.p3}`;
        case 'triangle':
            return `Triangle vertices (${shape.p1}, ${shape.p2}), (${shape.p3}, ${shape.p4}), (${shape.p5}, ${shape.p6})`;
        default:
            return 'Unknown Shape';
    }
}

function updateShapesList() {
    shapesList.innerHTML = '';
    if (shapes.length === 0) {
        shapesList.innerHTML = `<li class="empty-list-msg">No shapes created yet. Click on the canvas grid to start drawing!</li>`;
        return;
    }

    shapes.forEach(shape => {
        const li = document.createElement('li');
        li.className = 'shape-item';
        
        // Shape Info Text
        const info = document.createElement('div');
        info.className = 'shape-info';
        
        const title = document.createElement('span');
        title.className = 'shape-title';
        title.textContent = `ID #${shape.id} - ${shape.type.toUpperCase()}`;
        
        const desc = document.createElement('span');
        desc.className = 'shape-coords';
        desc.textContent = getShapeDescription(shape);
        
        info.appendChild(title);
        info.appendChild(desc);
        li.appendChild(info);

        // Actions (Edit/Delete)
        const actions = document.createElement('div');
        actions.className = 'shape-actions';
        
        const btnEdit = document.createElement('button');
        btnEdit.className = 'shape-btn shape-btn-edit';
        btnEdit.textContent = 'Edit';
        btnEdit.addEventListener('click', () => openEditPanel(shape));
        
        const btnDel = document.createElement('button');
        btnDel.className = 'shape-btn shape-btn-del';
        btnDel.textContent = 'Delete';
        btnDel.addEventListener('click', () => deleteShape(shape.id));
        
        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);
        li.appendChild(actions);

        shapesList.appendChild(li);
    });
}

// -------------------------------------------------------------
// Interactive Editing Panel Form
// -------------------------------------------------------------

function openEditPanel(shape) {
    editingShapeId = shape.id;
    editShapeIdSpan.textContent = `#${shape.id}`;
    editPanel.style.display = 'flex';
    
    // Inject inputs dynamically based on shape type
    let inputsHtml = '';
    
    if (shape.type === 'line') {
        inputsHtml = `
            <div class="form-group">
                <label>Start Point (X1, Y1)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p1" min="0" max="59" value="${shape.p1}">
                    <input type="number" id="val-p2" min="0" max="19" value="${shape.p2}">
                </div>
            </div>
            <div class="form-group">
                <label>End Point (X2, Y2)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p3" min="0" max="59" value="${shape.p3}">
                    <input type="number" id="val-p4" min="0" max="19" value="${shape.p4}">
                </div>
            </div>
        `;
    } else if (shape.type === 'rect') {
        inputsHtml = `
            <div class="form-group">
                <label>Top-Left corner (X, Y)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p1" min="0" max="59" value="${shape.p1}">
                    <input type="number" id="val-p2" min="0" max="19" value="${shape.p2}">
                </div>
            </div>
            <div class="form-group flex-row" style="display: flex; gap: 8px;">
                <div class="form-group" style="flex: 1;">
                    <label>Width</label>
                    <input type="number" id="val-p3" min="1" max="60" value="${shape.p3}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Height</label>
                    <input type="number" id="val-p4" min="1" max="20" value="${shape.p4}">
                </div>
            </div>
        `;
    } else if (shape.type === 'circle') {
        inputsHtml = `
            <div class="form-group">
                <label>Center Coordinate (CX, CY)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p1" min="0" max="59" value="${shape.p1}">
                    <input type="number" id="val-p2" min="0" max="19" value="${shape.p2}">
                </div>
            </div>
            <div class="form-group">
                <label>Radius</label>
                <input type="number" id="val-p3" min="0" max="40" value="${shape.p3}">
            </div>
        `;
    } else if (shape.type === 'triangle') {
        inputsHtml = `
            <div class="form-group">
                <label>Vertex 1 (X1, Y1)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p1" min="0" max="59" value="${shape.p1}">
                    <input type="number" id="val-p2" min="0" max="19" value="${shape.p2}">
                </div>
            </div>
            <div class="form-group">
                <label>Vertex 2 (X2, Y2)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p3" min="0" max="59" value="${shape.p3}">
                    <input type="number" id="val-p4" min="0" max="19" value="${shape.p4}">
                </div>
            </div>
            <div class="form-group">
                <label>Vertex 3 (X3, Y3)</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="val-p5" min="0" max="59" value="${shape.p5}">
                    <input type="number" id="val-p6" min="0" max="19" value="${shape.p6}">
                </div>
            </div>
        `;
    }

    editInputsContainer.innerHTML = inputsHtml;
}

function closeEditPanel() {
    editingShapeId = null;
    editPanel.style.display = 'none';
    editInputsContainer.innerHTML = '';
}

btnSaveEdit.addEventListener('click', () => {
    if (editingShapeId === null) return;
    
    const p1 = parseInt(document.getElementById('val-p1')?.value || 0);
    const p2 = parseInt(document.getElementById('val-p2')?.value || 0);
    const p3 = parseInt(document.getElementById('val-p3')?.value || 0);
    const p4 = parseInt(document.getElementById('val-p4')?.value || 0);
    const p5 = parseInt(document.getElementById('val-p5')?.value || 0);
    const p6 = parseInt(document.getElementById('val-p6')?.value || 0);

    modifyShape(editingShapeId, p1, p2, p3, p4, p5, p6);
    closeEditPanel();
    renderCanvas();
    updateShapesList();
});

btnCancelEdit.addEventListener('click', closeEditPanel);

// -------------------------------------------------------------
// Instructions View Controller
// -------------------------------------------------------------

function updateInstructions() {
    let title = '';
    let steps = '';
    const pointsLength = clickPoints.length;

    if (currentTool === 'line') {
        title = 'How to draw a Line:';
        if (pointsLength === 0) {
            steps = `
                <p>1. Click any cell on the grid to set the <strong>Start Point</strong>.</p>
                <p>2. Hover over the grid to see a live preview.</p>
                <p>3. Click another cell to set the <strong>End Point</strong>.</p>
            `;
        } else {
            steps = `
                <p>1. Start point set at <strong>(${clickPoints[0].x}, ${clickPoints[0].y})</strong>.</p>
                <p class="blink">2. <strong>Now, click another cell</strong> to set the End Point.</p>
            `;
        }
    } else if (currentTool === 'rect') {
        title = 'How to draw a Rectangle:';
        if (pointsLength === 0) {
            steps = `
                <p>1. Click a cell to set the <strong>First Corner</strong>.</p>
                <p>2. Move the mouse to preview the rectangle dimensions.</p>
                <p>3. Click another cell to set the <strong>Opposite Corner</strong>.</p>
            `;
        } else {
            steps = `
                <p>1. First corner set at <strong>(${clickPoints[0].x}, ${clickPoints[0].y})</strong>.</p>
                <p class="blink">2. <strong>Now, click another cell</strong> to define the opposite corner.</p>
            `;
        }
    } else if (currentTool === 'circle') {
        title = 'How to draw a Circle:';
        if (pointsLength === 0) {
            steps = `
                <p>1. Click a cell to set the <strong>Center Point</strong>.</p>
                <p>2. Move the mouse away to expand the radius preview.</p>
                <p>3. Click a second cell to lock the <strong>Radius</strong>.</p>
            `;
        } else {
            steps = `
                <p>1. Center set at <strong>(${clickPoints[0].x}, ${clickPoints[0].y})</strong>.</p>
                <p class="blink">2. <strong>Now, click a cell</strong> on the circle's boundary to set the radius.</p>
            `;
        }
    } else if (currentTool === 'triangle') {
        title = 'How to draw a Triangle:';
        if (pointsLength === 0) {
            steps = `
                <p>1. Click to set the <strong>First Vertex</strong>.</p>
                <p>2. Click to set the <strong>Second Vertex</strong>.</p>
                <p>3. Click to set the <strong>Third Vertex</strong> to close the shape.</p>
            `;
        } else if (pointsLength === 1) {
            steps = `
                <p>1. Vertex 1 set at <strong>(${clickPoints[0].x}, ${clickPoints[0].y})</strong>.</p>
                <p class="blink">2. <strong>Click another cell</strong> to set the Second Vertex.</p>
            `;
        } else if (pointsLength === 2) {
            steps = `
                <p>1. Vertices: <strong>(${clickPoints[0].x}, ${clickPoints[0].y})</strong>, <strong>(${clickPoints[1].x}, ${clickPoints[1].y})</strong>.</p>
                <p class="blink">2. <strong>Click a third cell</strong> to set the Third Vertex and close the triangle.</p>
            `;
        }
    }

    toolInstructions.innerHTML = `<h3>${title}</h3>${steps}`;
}

// -------------------------------------------------------------
// Tool Switching
// -------------------------------------------------------------

toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        clickPoints = []; // Reset current draw sequence
        clearPreview();
        updateInstructions();
    });
});

// -------------------------------------------------------------
// Clear & Export Handlers
// -------------------------------------------------------------

btnClear.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all shapes and clear the canvas?')) {
        shapes = [];
        nextShapeId = 1;
        clickPoints = [];
        closeEditPanel();
        renderCanvas();
        updateShapesList();
        clearPreview();
        updateInstructions();
    }
});

// Generate 2D ASCII character array output
function generateAsciiText() {
    // Initialize 2D array
    const canvas = [];
    for (let y = 0; y < HEIGHT; y++) {
        canvas[y] = [];
        for (let x = 0; x < WIDTH; x++) {
            canvas[y][x] = '_';
        }
    }

    // Rasterize vector shapes
    shapes.forEach(shape => {
        const pts = getShapePoints(shape);
        pts.forEach(pt => {
            if (inBounds(pt.x, pt.y)) {
                canvas[pt.y][pt.x] = '*';
            }
        });
    });

    // Convert to text block with borders
    let out = '+';
    for (let x = 0; x < WIDTH; x++) out += '-';
    out += '+\n';

    for (let y = 0; y < HEIGHT; y++) {
        out += '|';
        for (let x = 0; x < WIDTH; x++) {
            out += canvas[y][x];
        }
        out += '|\n';
    }

    out += '+';
    for (let x = 0; x < WIDTH; x++) out += '-';
    out += '+';

    return out;
}

btnExport.addEventListener('click', () => {
    const text = generateAsciiText();
    exportText.textContent = text;
    exportModal.style.display = 'flex';
});

btnCopyExport.addEventListener('click', () => {
    navigator.clipboard.writeText(exportText.textContent)
        .then(() => {
            const originalText = btnCopyExport.textContent;
            btnCopyExport.textContent = 'Copied!';
            btnCopyExport.style.backgroundColor = '#22c55e'; // Green
            setTimeout(() => {
                btnCopyExport.textContent = originalText;
                btnCopyExport.style.backgroundColor = '';
            }, 1500);
        })
        .catch(err => {
            alert('Failed to copy text: ' + err);
        });
});

btnCloseModal.addEventListener('click', () => {
    exportModal.style.display = 'none';
});

// Click outside modal content to close
exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
        exportModal.style.display = 'none';
    }
});

// -------------------------------------------------------------
// App Bootstrap Startup
// -------------------------------------------------------------

initGrid();
renderCanvas();
updateShapesList();
updateInstructions();
