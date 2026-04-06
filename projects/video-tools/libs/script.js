const terminal = document.getElementById('terminal');
const processBtn = document.getElementById('processBtn');
const stopBtn = document.getElementById('stopBtn');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileQueue = document.getElementById('fileQueue');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const progressWrapper = document.getElementById('progressWrapper');
const progressFill = document.getElementById('progressFill');

const btnDownloadSingle = document.getElementById('btn-download-single');
const btnDownloadZip = document.getElementById('btn-download-zip');

const previewContainer = document.getElementById('previewContainer');
const videoPreview = document.getElementById('videoPreview');
const sliderStart = document.getElementById('sliderStart');
const sliderEnd = document.getElementById('sliderEnd');
const trimStartInput = document.getElementById('trimStart');
const trimEndInput = document.getElementById('trimEnd');
const audioInput = document.getElementById('audioInput');

const toggleCropBtn = document.getElementById('toggleCropBtn');
const cropOverlay = document.getElementById('cropOverlay');
const cropBox = document.getElementById('cropBox');
const clearCropBtn = document.getElementById('clearCropBtn');

let selectedFiles = [];
let batchOutputs = [];
let activeFfmpeg = null; 

let isCropping = false;
let isDragging = false;
let startX, startY;

function log(msg, type = 'log-info') {
    const p = document.createElement('p'); 
    p.className = type; 
    p.innerHTML = `<span class="term-prompt">~</span> ${msg}`;
    terminal.appendChild(p); 
    terminal.scrollTop = terminal.scrollHeight;
}

function formatTime(seconds) {
    const d = new Date(null);
    d.setSeconds(seconds);
    return d.toISOString().slice(11, 19);
}

function setupPreview(file) {
    if (file && file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        previewContainer.style.display = 'flex'; 
        previewContainer.style.flexDirection = 'column';

        videoPreview.onloadedmetadata = () => {
            const dur = videoPreview.duration;
            sliderStart.max = dur;
            sliderEnd.max = dur;
            sliderStart.value = 0;
            sliderEnd.value = dur;
            trimStartInput.value = formatTime(0);
            trimEndInput.value = formatTime(dur);
        };
    } else {
        previewContainer.style.display = 'none';
        videoPreview.src = "";
    }
}

clearQueueBtn.addEventListener('click', () => {
    selectedFiles = [];
    fileQueue.innerHTML = '';
    fileInput.value = '';
    setupPreview(null);
    
    batchOutputs = [];
    btnDownloadSingle.disabled = true;
    btnDownloadZip.disabled = true;
    
    log('Processing queue cleared.', 'log-warning');
});

function handleFiles(files) {
    const newFiles = Array.from(files);
    selectedFiles = [...selectedFiles, ...newFiles];
    
    fileQueue.innerHTML = '';
    selectedFiles.forEach((f, index) => {
        fileQueue.innerHTML += `<div class="file-item"><span>${index + 1}. ${f.name}</span><span style="color:var(--text-secondary)">${(f.size/1048576).toFixed(1)}MB</span></div>`;
    });
    log(`Queued total of ${selectedFiles.length} file(s).`);
    
    if (selectedFiles.length > 0) setupPreview(selectedFiles[0]);
}

sliderStart.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const endVal = parseFloat(sliderEnd.value);
    if (val >= endVal) { sliderStart.value = endVal - 0.1; } 
    videoPreview.currentTime = sliderStart.value;
    trimStartInput.value = formatTime(sliderStart.value);
});

sliderEnd.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const startVal = parseFloat(sliderStart.value);
    if (val <= startVal) { sliderEnd.value = startVal + 0.1; } 
    videoPreview.currentTime = sliderEnd.value;
    trimEndInput.value = formatTime(sliderEnd.value);
});

toggleCropBtn.addEventListener('click', () => {
    isCropping = !isCropping;
    if (isCropping) {
        videoPreview.pause();
        cropOverlay.style.display = 'block';
        toggleCropBtn.innerHTML = '✖ Cancel Cropping';
        toggleCropBtn.style.color = 'var(--color-error)';
    } else {
        cropOverlay.style.display = 'none';
        toggleCropBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Draw Crop Area';
        toggleCropBtn.style.color = '';
    }
});

clearCropBtn.addEventListener('click', () => {
    document.getElementById('cropW').value = '';
    document.getElementById('cropH').value = '';
    document.getElementById('cropX').value = '';
    document.getElementById('cropY').value = '';
    cropBox.style.display = 'none';
});

// --- NEW: Unified Mouse & Touch Event Handlers ---
function getCoords(e, rect) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function handleCropStart(e) {
    const rect = cropOverlay.getBoundingClientRect();
    const coords = getCoords(e, rect);
    startX = coords.x;
    startY = coords.y;
    isDragging = true;
    
    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
    cropBox.style.display = 'block';
}

function handleCropMove(e) {
    if (!isDragging) return;
    e.preventDefault(); // Crucial: prevents mobile screen from scrolling while drawing
    const rect = cropOverlay.getBoundingClientRect();
    const coords = getCoords(e, rect);

    const width = Math.abs(coords.x - startX);
    const height = Math.abs(coords.y - startY);
    const left = Math.min(coords.x, startX);
    const top = Math.min(coords.y, startY);

    cropBox.style.width = width + 'px';
    cropBox.style.height = height + 'px';
    cropBox.style.left = left + 'px';
    cropBox.style.top = top + 'px';
}

function handleCropEnd() {
    if (!isDragging) return;
    isDragging = false;
    calculateTrueVideoCrop();
}

// Attach Mouse Events
cropOverlay.addEventListener('mousedown', handleCropStart);
cropOverlay.addEventListener('mousemove', handleCropMove);
cropOverlay.addEventListener('mouseup', handleCropEnd);

// Attach Touch Events (Mobile Support)
cropOverlay.addEventListener('touchstart', handleCropStart, { passive: false });
cropOverlay.addEventListener('touchmove', handleCropMove, { passive: false });
cropOverlay.addEventListener('touchend', handleCropEnd);
// ------------------------------------------------

function calculateTrueVideoCrop() {
    const rect = videoPreview.getBoundingClientRect();
    const vW = videoPreview.videoWidth;
    const vH = videoPreview.videoHeight;
    if (!vW || !vH) return;

    const videoRatio = vW / vH;
    const elementRatio = rect.width / rect.height;

    let renderW, renderH, offsetX = 0, offsetY = 0;

    if (videoRatio > elementRatio) {
        renderW = rect.width;
        renderH = rect.width / videoRatio;
        offsetY = (rect.height - renderH) / 2;
    } else {
        renderH = rect.height;
        renderW = rect.height * videoRatio;
        offsetX = (rect.width - renderW) / 2;
    }

    const boxLeft = parseFloat(cropBox.style.left);
    const boxTop = parseFloat(cropBox.style.top);
    const boxW = parseFloat(cropBox.style.width);
    const boxH = parseFloat(cropBox.style.height);

    const clampX = Math.max(offsetX, Math.min(boxLeft, offsetX + renderW));
    const clampY = Math.max(offsetY, Math.min(boxTop, offsetY + renderH));
    const clampW = Math.min(boxW, offsetX + renderW - clampX);
    const clampH = Math.min(boxH, offsetY + renderH - clampY);

    if (clampW <= 0 || clampH <= 0) {
        clearCropBtn.click();
        return;
    }

    const scaleX = vW / renderW;
    const scaleY = vH / renderH;

    document.getElementById('cropX').value = Math.round((clampX - offsetX) * scaleX);
    document.getElementById('cropY').value = Math.round((clampY - offsetY) * scaleY);
    document.getElementById('cropW').value = Math.round(clampW * scaleX);
    document.getElementById('cropH').value = Math.round(clampH * scaleY);
    
    toggleCropBtn.click();
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = "var(--accent-primary)"; });
dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = "var(--border-color)"; });
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.style.borderColor = "var(--border-color)"; handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

btnDownloadSingle.addEventListener('click', () => {
    if (batchOutputs.length > 0) {
        const url = URL.createObjectURL(batchOutputs[0].blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = batchOutputs[0].filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

btnDownloadZip.addEventListener('click', async () => {
    if (batchOutputs.length > 1) {
        log('Bundling ZIP archive...', 'log-warning');
        const zip = new JSZip();
        batchOutputs.forEach(item => {
            zip.file(item.filename, item.blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipUrl = URL.createObjectURL(zipBlob);
        
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = "MediaStudio_Batch.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        log('ZIP download successfully triggered.', 'log-success');
    }
});

stopBtn.addEventListener('click', () => {
    if (activeFfmpeg) {
        try { activeFfmpeg.terminate(); log('Execution halted by user.', 'log-warning'); } catch (err) {}
        progressWrapper.style.display = 'none';
        stopBtn.style.display = 'none';
        processBtn.style.display = 'block';
        processBtn.disabled = false;
    }
});

processBtn.addEventListener('click', async () => {
    if (typeof crossOriginIsolated === 'undefined' || !crossOriginIsolated) {
        log('FATAL: Browser headers missing. Ensure Cloudflare _headers file is deployed.', 'log-error'); return;
    }
    if (!selectedFiles.length) return log('Error: Queue empty.', 'log-error');

    processBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    progressWrapper.style.display = 'block';
    progressFill.style.width = '0%';
    progressFill.textContent = '0%';
    
    batchOutputs = [];
    btnDownloadSingle.disabled = true;
    btnDownloadZip.disabled = true;

    try {
        const { FFmpeg } = window.FFmpegWASM;
        const { toBlobURL, fetchFile } = window.FFmpegUtil;
        
        activeFfmpeg = new FFmpeg();

        activeFfmpeg.on('log', ({ message }) => { if (!message.includes('Aborted')) log(message, 'log-info'); });
        activeFfmpeg.on('progress', ({ progress }) => { 
            const displayString = `${Math.max(0, Math.min(100, progress * 100)).toFixed(1)}%`;
            progressFill.style.width = displayString;
            progressFill.textContent = displayString;
        });

        log('Booting media engine components...', 'log-info');
        const localBase = 'libs';
        const cloudBase = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd';

        try {
            await activeFfmpeg.load({
                coreURL: await toBlobURL(`${localBase}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${localBase}/ffmpeg-core.wasm`, 'application/wasm'),
                classWorkerURL: await toBlobURL(`${localBase}/814.ffmpeg.js`, 'text/javascript')
            });
            log('Engine initialized.', 'log-success');
        } catch (error) {
            log('Connecting to secure cloud engine...', 'log-warning'); 
            await activeFfmpeg.load({
                coreURL: await toBlobURL(`${cloudBase}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${cloudBase}/ffmpeg-core.wasm`, 'application/wasm'),
                classWorkerURL: await toBlobURL(`${cloudBase}/814.ffmpeg.js`, 'text/javascript')
            });
            log('Cloud engine initialized.', 'log-success');
        }

        const format = document.getElementById('outputFormat').value;
        const compress = document.getElementById('compressCheck').checked;
        const muteOriginal = document.getElementById('muteCheck').checked;
        const customAudioFile = audioInput.files[0];
        
        const trimStart = document.getElementById('trimStart').value.trim();
        const trimEnd = document.getElementById('trimEnd').value.trim();
        const cropW = document.getElementById('cropW').value;
        const cropH = document.getElementById('cropH').value;
        const cropX = document.getElementById('cropX').value;
        const cropY = document.getElementById('cropY').value;

        let audioExt = '';

        if (customAudioFile) {
            log(`Loading custom audio track: ${customAudioFile.name}`);
            audioExt = customAudioFile.name.split('.').pop();
            await activeFfmpeg.writeFile(`custom_bg.${audioExt}`, await fetchFile(customAudioFile));
        }

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            log(`Executing build: ${file.name}`);
            
            const inName = `input_${i}.${file.name.split('.').pop()}`;
            const outName = `output_${i}.${format}`;
            const finalFilename = `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}_processed.${format}`;

            await activeFfmpeg.writeFile(inName, await fetchFile(file));
            
            let args = ['-i', inName];

            if (customAudioFile) {
                args.push('-i', `custom_bg.${audioExt}`);
            }

            if (trimStart && trimStart !== '00:00:00') args.push('-ss', trimStart);
            if (trimEnd && sliderEnd.value < videoPreview.duration) args.push('-to', trimEnd);

            let vfFilters = [];
            if (cropW || cropH || cropX || cropY) {
                vfFilters.push(`crop=${cropW || 'in_w'}:${cropH || 'in_h'}:${cropX || '0'}:${cropY || '0'}`);
            }

            if (format === 'mp3') { 
                args.push('-vn', '-c:a', 'libmp3lame', '-q:a', '2'); 
            } else if (format === 'aac') { 
                args.push('-vn', '-c:a', 'aac'); 
            } else if (format === 'gif') { 
                vfFilters.push('fps=10,scale=320:-1:flags=lanczos'); 
            } else {
                if (compress) {
                    args.push('-vcodec', 'libx264', '-crf', '28', '-preset', 'fast');
                }
                
                if (customAudioFile) {
                    args.push('-map', '0:v:0'); 
                    args.push('-map', '1:a:0'); 
                    args.push('-shortest');     
                } else if (muteOriginal) {
                    args.push('-an');           
                }
            }

            if (vfFilters.length > 0) args.push('-vf', vfFilters.join(','));
            
            args.push(outName);
            
            await activeFfmpeg.exec(args);
            const data = await activeFfmpeg.readFile(outName);
            
            let mimeType = `video/${format}`;
            if (['mp3', 'aac'].includes(format)) mimeType = `audio/${format}`;
            if (format === 'gif') mimeType = 'image/gif';

            const blob = new Blob([data.buffer], { type: mimeType });
            
            batchOutputs.push({ filename: finalFilename, blob: blob });
            log(`Build Completed: ${file.name}`, 'log-success');
        }
        
        setTimeout(() => { progressWrapper.style.display = 'none'; }, 2000);

        if (batchOutputs.length > 0) {
            btnDownloadSingle.disabled = false;
        }
        if (batchOutputs.length > 1) {
            btnDownloadZip.disabled = false;
        }

    } catch (err) {
        if (!err.message || !err.message.includes('terminated')) log(`System Exception: ${err.message || err}`, 'log-error');
    } finally {
        stopBtn.style.display = 'none';
        processBtn.style.display = 'block';
        processBtn.disabled = false;
    }
});