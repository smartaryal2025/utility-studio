const fileInput = document.getElementById('file-input');
const gallery = document.getElementById('gallery');
const mainImage = document.getElementById('main-image');
const canvasWrapper = document.getElementById('canvas-wrapper'); 
const drawCanvas = document.getElementById('draw-canvas'); 
const canvasContainer = document.getElementById('editor-canvas-container');
const placeholderText = document.getElementById('placeholder-text');

const rightWorkspace = document.getElementById('right-workspace');
const btnFullscreen = document.getElementById('btn-fullscreen');

const btnToggleCrop = document.getElementById('btn-toggle-crop');
const btnCancelCrop = document.getElementById('btn-cancel-crop');
const btnRemoveBg = document.getElementById('btn-remove-bg');
const btnAddBg = document.getElementById('btn-add-bg'); 
const btnManualErase = document.getElementById('btn-manual-erase'); 
const btnManualBrush = document.getElementById('btn-manual-brush'); 
const btnUndo = document.getElementById('btn-undo'); 
const btnAddWm = document.getElementById('btn-add-wm');
const logoUpload = document.getElementById('logo-upload');
const labelLogoUpload = document.getElementById('label-logo-upload');
const wmSizeInput = document.getElementById('wm-size');
const btnPreviewPrint = document.getElementById('btn-preview-print');
const btnDownloadSingle = document.getElementById('btn-download-single');
const btnDownloadZip = document.getElementById('btn-download-zip');
const bulkEditsCheck = document.getElementById('apply-bulk-edits');

const formatSelect = document.getElementById('export-format');
const qualitySlider = document.getElementById('export-quality');
const targetKbInput = document.getElementById('target-kb');
const manualQualityGroup = document.getElementById('manual-quality-group');
const resizeWidthInput = document.getElementById('resize-width');
const resizeHeightInput = document.getElementById('resize-height');
const forceExactSize = document.getElementById('force-exact-size'); 
const brushSizeInput = document.getElementById('brush-size'); 

const filterBright = document.getElementById('filter-bright'), filterCont = document.getElementById('filter-cont'), filterSat = document.getElementById('filter-sat'), filterPreset = document.getElementById('filter-preset');
const statW = document.getElementById('stat-w'), statH = document.getElementById('stat-h'), statRatio = document.getElementById('stat-ratio'), statsBox = document.getElementById('img-stats-box');

const zoomValText = document.getElementById('zoom-val');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');

let imagesData = []; 
let activeImageId = null;
let cropper = null;
let drawMode = null; 
let currentZoom = 1;

const customCursor = document.createElement('div');
customCursor.style.cssText = 'display:none; position:fixed; pointer-events:none; border:1px solid white; box-shadow:0 0 0 1px black; border-radius:50%; z-index:99999; transform:translate(-50%, -50%);';
document.body.appendChild(customCursor);

if (typeof Sortable !== 'undefined') {
    new Sortable(gallery, { animation: 150 });
}

const cropIconHtml = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 3a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4H2a.5.5 0 0 1 0-1h8.5zm-5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 1 0v7.5H14a.5.5 0 0 1 0 1H5.5z"/></svg> Crop`;

// ==========================================
// ZOOM ENGINE
// ==========================================
function applyZoom() {
    zoomValText.innerText = Math.round(currentZoom * 100) + '%';
    canvasWrapper.style.transform = `scale(${currentZoom})`;
    
    if (currentZoom > 1) {
        canvasContainer.style.alignItems = 'flex-start';
        canvasContainer.style.justifyContent = 'flex-start';
        canvasWrapper.style.margin = '0';
        canvasWrapper.style.transformOrigin = 'top left';
    } else {
        canvasContainer.style.alignItems = 'center';
        canvasContainer.style.justifyContent = 'center';
        canvasWrapper.style.margin = 'auto';
        canvasWrapper.style.transformOrigin = 'center center';
    }
    updateCursorSize();
}

btnZoomIn.addEventListener('click', () => {
    if (!activeImageId) return;
    currentZoom += 0.2;
    applyZoom();
});

btnZoomOut.addEventListener('click', () => {
    if (!activeImageId) return;
    currentZoom = Math.max(0.2, currentZoom - 0.2);
    applyZoom();
});

btnFullscreen.addEventListener('click', () => {
    rightWorkspace.classList.toggle('fullscreen-mode');
    if (rightWorkspace.classList.contains('fullscreen-mode')) {
        btnFullscreen.innerHTML = "❐ Compact";
        document.body.style.overflow = "hidden";
    } else {
        btnFullscreen.innerHTML = "⛶ Expand";
        document.body.style.overflow = "auto";
    }
    setTimeout(updateCursorSize, 50); 
});

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

targetKbInput.addEventListener('input', () => {
    manualQualityGroup.style.opacity = targetKbInput.value ? '0.3' : '1';
    qualitySlider.disabled = !!targetKbInput.value;
});

function saveState(imgId) {
    const img = imagesData.find(i => i.id == imgId);
    if (img) {
        if (!img.history) img.history = [];
        img.history.push(img.src);
        btnUndo.disabled = false;
    }
}

btnUndo.addEventListener('click', () => {
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (activeImg && activeImg.history && activeImg.history.length > 0) {
        activeImg.src = activeImg.history.pop();
        window.loadIntoEditor(activeImageId);
    }
});

fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgObj = { id: Date.now() + Math.random().toString(36).substr(2, 9), name: file.name.split('.')[0], src: event.target.result, history: [] };
            imagesData.push(imgObj);
            renderGallery();
            if (mainImage.style.display === 'none' || !mainImage.src) loadIntoEditor(imgObj.id);
            btnDownloadZip.disabled = false;
        };
        reader.readAsDataURL(file);
    });
});

function renderGallery() {
    gallery.innerHTML = '';
    imagesData.forEach(img => {
        const div = document.createElement('div');
        div.className = `thumbnail-item ${img.id === activeImageId ? 'active' : ''}`;
        
        div.innerHTML = `
            <input type="checkbox" class="merge-checkbox" data-id="${img.id}" style="position: absolute; top: 4px; left: 4px; z-index: 2; cursor: pointer;">
            <img src="${img.src}" alt="${img.name}" onclick="loadIntoEditor('${img.id}')" style="cursor: pointer;">
            <span class="page-label">${img.name}</span>
        `;
        gallery.appendChild(div);
    });
}

window.loadIntoEditor = function loadIntoEditor(id) {
    const imgData = imagesData.find(i => i.id == id);
    if (!imgData) return;

    resetCropUI();
    
    drawMode = null; 
    updateDrawModeUI();

    activeImageId = imgData.id;
    btnUndo.disabled = !(imgData.history && imgData.history.length > 0);
    
    const tempImg = new Image();
    tempImg.onload = function() {
        const w = this.naturalWidth, h = this.naturalHeight, divisor = gcd(w, h);
        statW.textContent = w; statH.textContent = h; statRatio.textContent = `${w/divisor}:${h/divisor}`;
        statsBox.style.display = 'block';

        mainImage.src = imgData.src; 
        
        placeholderText.style.display = 'none';
        canvasWrapper.style.display = 'inline-block';
        
        btnToggleCrop.disabled = false; 
        btnRemoveBg.disabled = false;
        btnAddBg.disabled = false; 
        btnManualErase.disabled = false;
        btnManualBrush.disabled = false;
        btnAddWm.disabled = false; 
        btnPreviewPrint.disabled = false;
        btnDownloadSingle.disabled = false;
        logoUpload.disabled = false; 
        labelLogoUpload.classList.remove('disabled');
        
        updateLiveFilters();
        renderGallery(); 
    };
    tempImg.src = imgData.src;
}

function getFilterString() {
    const b = filterBright.value, c = filterCont.value, s = filterSat.value, p = filterPreset.value;
    let filterStr = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    if (p !== 'none') filterStr += ` ${p}`;
    return filterStr;
}

function updateLiveFilters() {
    const filterStr = getFilterString();
    mainImage.style.filter = filterStr;
    drawCanvas.style.filter = filterStr; 
    const cropperImg = document.querySelector('.cropper-canvas img');
    if (cropperImg) cropperImg.style.filter = filterStr;
}

document.querySelectorAll('.filter-input').forEach(input => { input.addEventListener('input', updateLiveFilters); });
document.getElementById('btn-reset-filters').addEventListener('click', () => {
    filterBright.value = 100; filterCont.value = 100; filterSat.value = 100; filterPreset.value = 'none';
    updateLiveFilters();
});

function resetCropUI() {
    if(cropper) { cropper.destroy(); cropper = null; }
    btnToggleCrop.innerHTML = cropIconHtml;
    btnToggleCrop.classList.replace('btn-success', 'btn-secondary');
    btnCancelCrop.style.display = 'none';
}

btnToggleCrop.addEventListener('click', () => {
    drawMode = null; updateDrawModeUI(); 
    if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        const newSrc = canvas.toDataURL('image/png'); 
        const activeImg = imagesData.find(i => i.id == activeImageId);
        if(activeImg) { 
            saveState(activeImageId); 
            activeImg.src = newSrc; 
            window.loadIntoEditor(activeImageId); 
        }
        resetCropUI();
        currentZoom = 1; applyZoom(); 
    } else {
        currentZoom = 1; applyZoom(); 
        cropper = new Cropper(mainImage, { viewMode: 1, background: false, zoomable: false });
        btnToggleCrop.innerHTML = 'Apply ✔';
        btnToggleCrop.classList.replace('btn-secondary', 'btn-success');
        btnCancelCrop.style.display = 'inline-flex';
        updateLiveFilters(); 
    }
});

btnCancelCrop.addEventListener('click', resetCropUI);


// ==========================================
// MANUAL DRAWING ENGINE (DYNAMIC DOM CURSOR)
// ==========================================
btnManualErase.addEventListener('click', () => { drawMode = drawMode === 'erase' ? null : 'erase'; updateDrawModeUI(); });
btnManualBrush.addEventListener('click', () => { drawMode = drawMode === 'brush' ? null : 'brush'; updateDrawModeUI(); });

let previewTimeout;

brushSizeInput.addEventListener('input', () => {
    updateCursorSize(true);
    
    const rect = canvasWrapper.getBoundingClientRect();
    
    customCursor.style.display = 'block';
    customCursor.style.left = (rect.left + rect.width / 2) + 'px';
    customCursor.style.top = (rect.top + rect.height / 2) + 'px';
    
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        if (!drawMode || !drawCanvas.matches(':hover')) {
            customCursor.style.display = 'none';
        }
    }, 1000); 
});

function updateCursorSize(forcePreview = false) {
    if (!drawMode && !forcePreview) {
        customCursor.style.display = 'none';
        return;
    }
    
    const targetElement = drawMode ? drawCanvas : mainImage;
    if (!targetElement || targetElement.naturalWidth === 0 && !drawMode) return;
    
    const size = parseInt(brushSizeInput.value) || 20;
    const rect = targetElement.getBoundingClientRect();
    const nativeWidth = drawMode ? drawCanvas.width : targetElement.naturalWidth;
    
    const scaleFactor = rect.width / nativeWidth; 
    const visualSize = size * scaleFactor; 
    
    customCursor.style.width = visualSize + 'px';
    customCursor.style.height = visualSize + 'px';
}

function updateDrawModeUI() {
    btnManualErase.classList.toggle('btn-success', drawMode === 'erase');
    btnManualErase.classList.toggle('btn-secondary', drawMode !== 'erase');
    btnManualBrush.classList.toggle('btn-success', drawMode === 'brush');
    btnManualBrush.classList.toggle('btn-secondary', drawMode !== 'brush');

    if (drawMode) {
        if (cropper) resetCropUI(); 
        
        drawCanvas.width = mainImage.naturalWidth;
        drawCanvas.height = mainImage.naturalHeight;
        const dCtx = drawCanvas.getContext('2d');
        dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        dCtx.drawImage(mainImage, 0, 0);
        
        drawCanvas.style.pointerEvents = 'auto';
        drawCanvas.style.cursor = 'none'; 
        drawCanvas.style.opacity = '1';
        mainImage.style.opacity = '0';
        
    } else {
        drawCanvas.style.pointerEvents = 'none';
        drawCanvas.style.cursor = 'default';
        drawCanvas.style.opacity = '0';
        mainImage.style.opacity = '1';
        customCursor.style.display = 'none';
    }
}

drawCanvas.addEventListener('pointermove', (e) => {
    if (drawMode) {
        updateCursorSize();
        customCursor.style.display = 'block';
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    }
    
    if (!isDrawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    
    const scaleX = drawCanvas.width / (rect.width / currentZoom);
    const scaleY = drawCanvas.height / (rect.height / currentZoom);
    
    const x = (e.clientX - rect.left) * scaleX / currentZoom;
    const y = (e.clientY - rect.top) * scaleY / currentZoom;
    
    const dCtx = drawCanvas.getContext('2d');
    dCtx.lineTo(x, y);
    dCtx.stroke();
});

drawCanvas.addEventListener('pointerleave', () => { customCursor.style.display = 'none'; });
drawCanvas.addEventListener('pointerenter', () => { if (drawMode) customCursor.style.display = 'block'; updateCursorSize(); });


let isDrawing = false;
drawCanvas.addEventListener('pointerdown', (e) => {
    if (!drawMode) return;
    isDrawing = true;
    saveState(activeImageId);
    
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / (rect.width / currentZoom);
    const scaleY = drawCanvas.height / (rect.height / currentZoom);
    
    const x = (e.clientX - rect.left) * scaleX / currentZoom;
    const y = (e.clientY - rect.top) * scaleY / currentZoom;
    
    const dCtx = drawCanvas.getContext('2d');
    dCtx.lineCap = 'round';
    dCtx.lineJoin = 'round';
    dCtx.lineWidth = parseInt(brushSizeInput.value) || 20;
    
    if (drawMode === 'erase') {
        dCtx.globalCompositeOperation = 'destination-out';
        dCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.strokeStyle = document.getElementById('new-bg-color').value;
    }
    
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    dCtx.lineTo(x, y);
    dCtx.stroke();
    
    drawCanvas.setPointerCapture(e.pointerId);
});

drawCanvas.addEventListener('pointerup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    drawCanvas.releasePointerCapture(e.pointerId);
    
    const newSrc = drawCanvas.toDataURL('image/png');
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (activeImg) {
        activeImg.src = newSrc;
        mainImage.src = newSrc; 
        if (drawMode === 'erase') document.getElementById('export-format').value = 'image/png';
    }
});


// ==========================================
// MAGIC ERASER ENGINE
// ==========================================
btnRemoveBg.addEventListener('click', () => {
    drawMode = null; updateDrawModeUI();
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (!activeImg) return;

    const originalText = btnRemoveBg.innerHTML;
    btnRemoveBg.innerHTML = "⏳ Erasing..."; 
    btnRemoveBg.disabled = true;

    setTimeout(() => {
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                const eraseHex = document.getElementById('color-to-erase').value;
                const bgR = parseInt(eraseHex.slice(1, 3), 16);
                const bgG = parseInt(eraseHex.slice(3, 5), 16);
                const bgB = parseInt(eraseHex.slice(5, 7), 16);
                
                const tolerance = parseInt(document.getElementById('bg-tolerance').value) || 30;

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i+3] === 0) continue;
                    
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    const distance = Math.sqrt(
                        Math.pow(r - bgR, 2) + 
                        Math.pow(g - bgG, 2) + 
                        Math.pow(b - bgB, 2)
                    );

                    if (distance <= tolerance) {
                        data[i+3] = 0; 
                    }
                }

                ctx.putImageData(imgData, 0, 0);
                const newSrc = canvas.toDataURL('image/png');

                saveState(activeImageId); 
                activeImg.src = newSrc;
                document.getElementById('export-format').value = 'image/png'; 
                window.loadIntoEditor(activeImageId);
            };
            img.src = activeImg.src;
            
        } catch (err) {
            alert("Error removing background: " + err.message);
        } finally {
            btnRemoveBg.innerHTML = originalText; 
            btnRemoveBg.disabled = false;
        }
    }, 50); 
});

// ==========================================
// BACKGROUND FILL ENGINE
// ==========================================
btnAddBg.addEventListener('click', () => {
    drawMode = null; updateDrawModeUI();
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (!activeImg) return;

    const originalText = btnAddBg.innerHTML;
    btnAddBg.innerHTML = "⏳ Filling..."; 
    btnAddBg.disabled = true;

    setTimeout(() => {
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = document.getElementById('new-bg-color').value;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                const newSrc = canvas.toDataURL('image/jpeg');

                saveState(activeImageId); 
                activeImg.src = newSrc;
                document.getElementById('export-format').value = 'image/jpeg'; 
                window.loadIntoEditor(activeImageId);
            };
            img.src = activeImg.src;
        } catch (err) {
            alert("Error filling background: " + err.message);
        } finally {
            btnAddBg.innerHTML = originalText; 
            btnAddBg.disabled = false;
        }
    }, 50);
});

// ==========================================
// NATIVE IMAGE JOINING
// ==========================================
async function executeMerge(direction) {
    const checkedBoxes = document.querySelectorAll('.merge-checkbox:checked');
    if (checkedBoxes.length < 2) return alert("Select at least 2 images to merge!");
    
    const reverseOrder = document.getElementById('merge-reverse').checked;
    
    const btn = document.getElementById(direction === 'vert' ? 'btn-merge-vert' : 'btn-merge-horz');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Merging..."; btn.disabled = true;

    const selectedImgs = [];
    for (let box of checkedBoxes) {
        const imgData = imagesData.find(i => i.id == box.dataset.id);
        const imgElement = new Image();
        await new Promise(res => { imgElement.onload = res; imgElement.src = imgData.src; });
        selectedImgs.push(imgElement);
    }

    if (reverseOrder) {
        selectedImgs.reverse();
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const GAP = 15;

    if (direction === 'vert') {
        const targetWidth = selectedImgs[0].naturalWidth;
        canvas.width = targetWidth;

        let totalHeight = 0;
        const processedImgs = selectedImgs.map(img => {
            const ratio = targetWidth / img.naturalWidth;
            const drawHeight = img.naturalHeight * ratio;
            totalHeight += drawHeight;
            return { img, drawHeight };
        });

        canvas.height = totalHeight + (GAP * (processedImgs.length - 1));

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = 0;
        processedImgs.forEach(({img, drawHeight}) => { 
            ctx.drawImage(img, 0, currentY, targetWidth, drawHeight); 
            currentY += drawHeight + GAP; 
        });
    } else {
        const targetHeight = selectedImgs[0].naturalHeight;
        canvas.height = targetHeight;

        let totalWidth = 0;
        const processedImgs = selectedImgs.map(img => {
            const ratio = targetHeight / img.naturalHeight;
            const drawWidth = img.naturalWidth * ratio;
            totalWidth += drawWidth;
            return { img, drawWidth };
        });

        canvas.width = totalWidth + (GAP * (processedImgs.length - 1));

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentX = 0;
        processedImgs.forEach(({img, drawWidth}) => { 
            ctx.drawImage(img, currentX, 0, drawWidth, targetHeight); 
            currentX += drawWidth + GAP; 
        });
    }

    const mergedId = Date.now() + Math.random().toString(36).substr(2, 9);
    imagesData.push({ id: mergedId, name: `Merged_${direction}`, src: canvas.toDataURL('image/png'), history: [] });
    
    checkedBoxes.forEach(b => b.checked = false);
    
    renderGallery();
    window.loadIntoEditor(mergedId);

    btn.innerHTML = originalText; btn.disabled = false;
}

document.getElementById('btn-merge-vert').addEventListener('click', () => executeMerge('vert'));
document.getElementById('btn-merge-horz').addEventListener('click', () => executeMerge('horz'));

// ==========================================
// WATERMARK DRAG AND DROP
// ==========================================
let activeDrag = null, activeResize = null, startX, startY, startWMSize;

function createOverlayNode(contentHTML, isText) {
    const wmNode = document.createElement('div');
    wmNode.className = `live-overlay selected ${isText ? 'text-type' : ''}`;
    wmNode.style.position = 'absolute';
    wmNode.style.zIndex = '1000';
    wmNode.style.userSelect = 'none';
    wmNode.style.touchAction = 'none'; 
    
    wmNode.innerHTML = contentHTML;
    wmNode.style.top = '40%'; wmNode.style.left = '40%';

    const img = wmNode.querySelector('.wm-image');
    if (img) img.draggable = false;

    const delBtn = document.createElement('button');
    delBtn.className = 'del-overlay-btn'; delBtn.innerHTML = '×';
    delBtn.onpointerdown = (e) => { e.stopPropagation(); wmNode.remove(); };
    
    const resizeBtn = document.createElement('div');
    resizeBtn.className = 'resize-handle'; resizeBtn.onpointerdown = startWmResize;

    wmNode.appendChild(delBtn); wmNode.appendChild(resizeBtn);
    wmNode.addEventListener('pointerdown', startWmDrag);
    canvasContainer.appendChild(wmNode);
    return wmNode;
}

btnAddWm.addEventListener('click', () => {
    const text = document.getElementById('wm-text').value || "Watermark";
    const color = document.getElementById('wm-color').value;
    const size = wmSizeInput.value || "32";
    
    const node = createOverlayNode(`<span class="wm-content">${text}</span>`, true);
    node.style.color = color; node.style.fontSize = `${size}px`;
});

logoUpload.addEventListener('change', function(e) {
    if(!this.files.length) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        createOverlayNode(`<img src="${ev.target.result}" class="wm-image" style="width: 150px; height: auto; pointer-events: none; display: block;" draggable="false">`, false);
    };
    reader.readAsDataURL(this.files[0]);
    this.value = ''; 
});

wmSizeInput.addEventListener('input', (e) => {
    const selected = document.querySelector('.live-overlay.selected.text-type');
    if (selected) selected.style.fontSize = `${e.target.value}px`;
});

canvasContainer.addEventListener('pointerdown', (e) => {
    if (e.target === canvasContainer || e.target === mainImage || e.target === drawCanvas || e.target.classList.contains('cropper-wrap-box')) {
        document.querySelectorAll('.live-overlay').forEach(el => el.classList.remove('selected'));
    }
});

function startWmDrag(e) {
    if (e.target.classList.contains('del-overlay-btn') || e.target.classList.contains('resize-handle')) return;
    
    e.preventDefault(); 
    e.stopPropagation(); 
    
    document.querySelectorAll('.live-overlay').forEach(el => el.classList.remove('selected'));
    activeDrag = this; activeDrag.classList.add('selected');
    
    if(activeDrag.classList.contains('text-type')) {
        wmSizeInput.value = parseInt(window.getComputedStyle(activeDrag).fontSize);
    }

    const rect = activeDrag.getBoundingClientRect();
    offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
    
    activeDrag.setPointerCapture(e.pointerId);
    activeDrag.addEventListener('pointermove', doWmDrag); 
    activeDrag.addEventListener('pointerup', stopWmDrag);
}

function doWmDrag(e) {
    if (!activeDrag) return;
    const containerRect = canvasContainer.getBoundingClientRect();
    activeDrag.style.left = `${e.clientX - containerRect.left - offsetX}px`;
    activeDrag.style.top = `${e.clientY - containerRect.top - offsetY}px`;
}

function stopWmDrag(e) { 
    if(!activeDrag) return;
    activeDrag.releasePointerCapture(e.pointerId);
    activeDrag.removeEventListener('pointermove', doWmDrag); 
    activeDrag.removeEventListener('pointerup', stopWmDrag);
    activeDrag = null; 
}

function startWmResize(e) {
    e.stopPropagation(); 
    e.preventDefault(); 
    activeResize = this.parentElement;
    startX = e.clientX; startY = e.clientY;
    
    if(activeResize.classList.contains('text-type')) {
        startWMSize = parseInt(window.getComputedStyle(activeResize).fontSize);
    } else {
        startWMSize = parseInt(window.getComputedStyle(activeResize.querySelector('.wm-image')).width);
    }
    
    activeResize.setPointerCapture(e.pointerId);
    activeResize.addEventListener('pointermove', doWmResize); 
    activeResize.addEventListener('pointerup', stopWmResize);
}

function doWmResize(e) {
    if (!activeResize) return;
    const deltaX = e.clientX - startX;
    const newSize = Math.max(15, startWMSize + deltaX); 
    
    if(activeResize.classList.contains('text-type')) {
        activeResize.style.fontSize = `${newSize}px`; 
        wmSizeInput.value = newSize; 
    } else {
        activeResize.querySelector('.wm-image').style.width = `${newSize}px`;
    }
}
function stopWmResize(e) { 
    if(!activeResize) return;
    activeResize.releasePointerCapture(e.pointerId);
    activeResize.removeEventListener('pointermove', doWmResize); 
    activeResize.removeEventListener('pointerup', stopWmResize);
    activeResize = null; 
}

function getExtension() {
    let val = formatSelect.value;
    if (val === 'image/jpeg') return 'jpg';
    if (val === 'image/svg+xml') return 'svg';
    return val.split('/')[1]; 
}

function bakeWatermarks(baseCanvas) {
    const overlays = document.querySelectorAll('.live-overlay');
    if (overlays.length === 0) return baseCanvas;

    const ctx = baseCanvas.getContext('2d');
    const imgRect = mainImage.getBoundingClientRect();

    overlays.forEach(wm => {
        const wmRect = wm.getBoundingClientRect();
        const percentX = (wmRect.left - imgRect.left) / imgRect.width;
        const percentY = (wmRect.top - imgRect.top) / imgRect.height;
        const percentWidth = wmRect.width / imgRect.width;
        const percentHeight = wmRect.height / imgRect.height;

        const drawX = percentX * baseCanvas.width;
        const drawY = percentY * baseCanvas.height;
        const drawW = percentWidth * baseCanvas.width;
        const drawH = percentHeight * baseCanvas.height;

        const textSpan = wm.querySelector('.wm-content');
        const imgElement = wm.querySelector('.wm-image');

        if (textSpan) {
            const scaleY = baseCanvas.height / imgRect.height;
            const fontSize = parseInt(window.getComputedStyle(wm).fontSize);
            ctx.font = `bold ${fontSize * scaleY}px Arial`;
            ctx.fillStyle = wm.style.color;
            ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 5 * scaleY; ctx.shadowOffsetX = 2 * scaleY; ctx.shadowOffsetY = 2 * scaleY;
            ctx.fillText(textSpan.textContent, drawX, drawY + (drawH * 0.75));
            ctx.shadowColor = "transparent";
        } else if (imgElement) {
            ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
        }
    });
    return baseCanvas;
}

function applyCompressionResize(sourceCanvas) {
    const maxWidth = parseInt(resizeWidthInput.value) || 0;
    const maxHeight = parseInt(resizeHeightInput.value) || 0;
    const isExact = forceExactSize.checked;
    let width = sourceCanvas.width, height = sourceCanvas.height;

    if (isExact && (maxWidth > 0 || maxHeight > 0)) {
        width = maxWidth > 0 ? maxWidth : width;
        height = maxHeight > 0 ? maxHeight : height;
    } 
    else if (maxWidth > 0 || maxHeight > 0) {
        const ratio = Math.min(maxWidth > 0 ? maxWidth / width : 1, maxHeight > 0 ? maxHeight / height : 1);
        if (ratio < 1) { width *= ratio; height *= ratio; }
    }
    
    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = width; compressedCanvas.height = height;
    compressedCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);
    return compressedCanvas;
}

function generateValidSVG(canvas) {
    const w = canvas.width, h = canvas.height;
    const base64PNG = canvas.toDataURL('image/png');
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${base64PNG}" width="${w}" height="${h}"/></svg>`;
    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
}

async function getTargetSizeDataURL(canvas, format, targetKB, manualQuality) {
    if (format === 'image/svg+xml') return generateValidSVG(canvas);
    
    if (!targetKB || targetKB <= 0 || (format !== 'image/jpeg' && format !== 'image/webp')) {
        return canvas.toDataURL(format, manualQuality);
    }
    
    const targetBytes = targetKB * 1024;
    let minQ = 0.05, maxQ = 1.0, bestDataUrl = canvas.toDataURL(format, 0.05);
    
    let maxData = canvas.toDataURL(format, 1.0);
    if (Math.round(maxData.length * 0.75) <= targetBytes) return maxData;

    for(let i=0; i<7; i++) {
        let midQ = (minQ + maxQ) / 2;
        let dataUrl = canvas.toDataURL(format, midQ);
        let bytes = Math.round(dataUrl.length * 0.75); 
        
        if (bytes <= targetBytes) {
            bestDataUrl = dataUrl;
            minQ = midQ; 
        } else {
            maxQ = midQ; 
        }
    }
    return bestDataUrl;
}

function processImagePipeline(img, isTargetActiveImage, applyGlobalEdits) {
    let baseCanvas = document.createElement('canvas');
    const ctx = baseCanvas.getContext('2d');

    if (isTargetActiveImage && cropper) {
        const cropped = cropper.getCroppedCanvas();
        baseCanvas.width = cropped.width; baseCanvas.height = cropped.height;
        if (applyGlobalEdits) ctx.filter = getFilterString();
        ctx.drawImage(cropped, 0, 0);
    } else {
        baseCanvas.width = img.naturalWidth; baseCanvas.height = img.naturalHeight;
        if (applyGlobalEdits) ctx.filter = getFilterString();
        ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
    }
    
    ctx.filter = 'none'; 
    if (applyGlobalEdits) baseCanvas = bakeWatermarks(baseCanvas);
    return applyCompressionResize(baseCanvas);
}

btnPreviewPrint.addEventListener('click', () => {
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (!activeImg) return;
    
    const originalText = btnPreviewPrint.innerHTML;
    btnPreviewPrint.innerHTML = "⏳ Generating..."; 
    btnPreviewPrint.disabled = true;

    const img = new Image();
    img.onload = async () => {
        const finalCanvas = processImagePipeline(img, true, true);
        const format = formatSelect.value;
        const manualQuality = parseFloat(qualitySlider.value);
        const targetKB = parseFloat(targetKbInput.value);
        
        let dataUrl = await getTargetSizeDataURL(finalCanvas, format, targetKB, manualQuality);

        const win = window.open('');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Image - Utility Studio</title>
                <style>
                    body { margin: 0; padding: 0; background: #e2e8f0; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; overflow-x: hidden; }
                    .no-print { width: 100%; background: #0f172a; padding: 15px; color: white; display: flex; justify-content: center; gap: 20px; z-index: 1000; box-sizing: border-box; align-items: center; position: sticky; top: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3); flex-wrap: wrap; }
                    .page-container { width: 210mm; height: 297mm; background: white; position: relative; margin: 30px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; }
                    img { position: absolute; top: 50px; left: 50px; cursor: grab; transform-origin: top left; user-select: none; max-width: none; max-height: none; }
                    img:active { cursor: grabbing; }
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { background: white; display: block; margin: 0; }
                        .no-print { display: none !important; }
                        .page-container { margin: 0; box-shadow: none; width: 100%; height: 100%; overflow: visible; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <label style="font-size: 14px; font-weight: bold;">Size Scale: 
                        <input type="range" id="scale" min="10" max="300" value="100" oninput="updateUI()"> 
                        <span id="scale-val">100%</span>
                    </label>
                    <button onclick="centerImage()" style="padding: 6px 12px; background: #38bdf8; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">🎯 Center Image</button>
                    <button onclick="window.print()" style="padding: 6px 16px; background: #10b981; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">🖨️ Print A4</button>
                    <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">(Click and drag the image on the paper below to position it)</span>
                </div>
                
                <div class="page-container" id="p-container">
                    <img id="p-img" src="${dataUrl}" draggable="false">
                </div>

                <script>
                    const img = document.getElementById('p-img');
                    const container = document.getElementById('p-container');
                    let isDragging = false;
                    let startX, startY, initialLeft, initialTop;
                    let origWidth = 0;

                    img.onload = () => { 
                        origWidth = img.naturalWidth; 
                        updateUI(); 
                        centerImage(); 
                    };

                    function updateUI() {
                        const scale = document.getElementById('scale').value;
                        document.getElementById('scale-val').innerText = scale + '%';
                        img.style.width = (origWidth * (scale / 100)) + 'px';
                    }

                    function centerImage() {
                        const cw = container.clientWidth;
                        const ch = container.clientHeight;
                        const iw = img.getBoundingClientRect().width;
                        const ih = img.getBoundingClientRect().height;
                        img.style.left = (cw / 2 - iw / 2) + 'px';
                        img.style.top = (ch / 2 - ih / 2) + 'px';
                    }

                    img.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        initialLeft = parseFloat(window.getComputedStyle(img).left) || 0;
                        initialTop = parseFloat(window.getComputedStyle(img).top) || 0;
                        e.preventDefault(); 
                    });

                    window.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;
                        const dx = e.clientX - startX;
                        const dy = e.clientY - startY;
                        img.style.left = (initialLeft + dx) + 'px';
                        img.style.top = (initialTop + dy) + 'px';
                    });

                    window.addEventListener('mouseup', () => { isDragging = false; });
                </script>
            </body>
            </html>
        `);
        win.document.close();
        
        btnPreviewPrint.innerHTML = originalText; 
        btnPreviewPrint.disabled = false;
    };
    img.src = activeImg.src;
});

btnDownloadSingle.addEventListener('click', () => {
    const activeImg = imagesData.find(i => i.id == activeImageId);
    if (!activeImg) return;
    
    btnDownloadSingle.innerHTML = "⏳ Saving..."; btnDownloadSingle.disabled = true;

    const img = new Image();
    img.onload = async () => {
        const finalCanvas = processImagePipeline(img, true, true);
        const format = formatSelect.value;
        const manualQuality = parseFloat(qualitySlider.value);
        const targetKB = parseFloat(targetKbInput.value);
        
        let dataUrl = await getTargetSizeDataURL(finalCanvas, format, targetKB, manualQuality);

        const link = document.createElement('a');
        link.download = `${activeImg.name}_edited.${getExtension()}`;
        link.href = dataUrl; link.click();
        
        btnDownloadSingle.innerHTML = "💾 Save"; btnDownloadSingle.disabled = false;
    };
    img.src = activeImg.src;
});

btnDownloadZip.addEventListener('click', async () => {
    if (imagesData.length === 0) return;
    btnDownloadZip.textContent = "Processing..."; btnDownloadZip.disabled = true;

    const zip = new JSZip();
    const format = formatSelect.value;
    const manualQuality = parseFloat(qualitySlider.value);
    const targetKB = parseFloat(targetKbInput.value);
    const ext = getExtension();
    const applyEditsToAll = bulkEditsCheck.checked;

    for (let i = 0; i < imagesData.length; i++) {
        const imgData = imagesData[i];
        const img = new Image();
        await new Promise(res => { img.onload = res; img.src = imgData.src; });

        const isTargetActiveImage = (imgData.id == activeImageId);
        const applyGlobalEdits = applyEditsToAll || isTargetActiveImage;

        const finalCanvas = processImagePipeline(img, isTargetActiveImage, applyGlobalEdits);
        let dataUrl = await getTargetSizeDataURL(finalCanvas, format, targetKB, manualQuality);
        
        const base64Data = dataUrl.split(',')[1];
        zip.file(`${imgData.name}_${i+1}.${ext}`, base64Data, {base64: true});
    }

    const content = await zip.generateAsync({type:"blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "Batch_Edited_Images.zip";
    link.click();

    btnDownloadZip.textContent = "📦 Export All (.zip)"; btnDownloadZip.disabled = false;
});