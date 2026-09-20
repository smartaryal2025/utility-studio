/* =========================================================
   KEYBOARD LOGIC & EVENT LISTENERS
   Isolated to prevent global event pollution in Uni-Tools
   ========================================================= */

const typeBox = document.getElementById('typeBox');
const customMenu = document.getElementById('customMenu');
const keyboardUI = document.getElementById('keyboard');

// Virtual Modifier States
let vShift = false;
let vAltGr = false;
let vCtrl = false;
let vAlt = false;
let vCaps = false;

// Physical Modifier States
let pShift = false;
let pAltGr = false;
let pCtrl = false;
let pAlt = false;
let pAltRightDown = false; 

let isDynamicLabels = true;

// Toggles
document.getElementById('btnToggleLabels').addEventListener('click', (e) => {
    isDynamicLabels = !isDynamicLabels;
    if (isDynamicLabels) {
        keyboardUI.classList.add('state-dynamic');
        e.target.textContent = 'Normal Labels Mode';
    } else {
        keyboardUI.classList.remove('state-dynamic');
        e.target.textContent = 'Dynamic Labels Mode';
    }
});

document.getElementById('btnFullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('btnFullscreen');
    if (document.fullscreenElement) {
        btn.textContent = 'Exit Full Screen';
    } else {
        btn.textContent = 'Full Screen';
    }
});

function updateModState() {
    const activeShift = vShift || pShift;
    const activeCtrl = vCtrl || pCtrl;
    const activeAlt = vAlt || pAlt;
    const activeAltGr = vAltGr || pAltGr;

    document.querySelectorAll('[data-mod="shift"]').forEach(k => k.classList.toggle('virtual-active', vShift));
    
    keyboardUI.classList.remove('state-base', 'state-shift', 'state-altgr', 'state-saltgr');

    if (activeShift && activeAltGr) {
        keyboardUI.classList.add('state-saltgr');
    } else if (activeAltGr) {
        keyboardUI.classList.add('state-altgr');
    } else if (activeShift) {
        keyboardUI.classList.add('state-shift');
    } else {
        keyboardUI.classList.add('state-base');
    }
}

function insertChar(char) {
    if (char === undefined || char === null) return;
    typeBox.focus();

    if (!document.execCommand('insertText', false, char)) {
        const s = typeBox.selectionStart;
        const e = typeBox.selectionEnd;
        typeBox.value = typeBox.value.substring(0, s) + char + typeBox.value.substring(e);
        typeBox.selectionStart = typeBox.selectionEnd = s + char.length;
    }
}

async function executeVirtualCtrl(code) {
    switch (code) {
        case 'KeyA': typeBox.select(); break;
        case 'KeyC':
            if (typeBox.selectionStart !== typeBox.selectionEnd) {
                try { await navigator.clipboard.writeText(typeBox.value.substring(typeBox.selectionStart, typeBox.selectionEnd)); } catch (err) {}
            }
            break;
        case 'KeyX':
            if (typeBox.selectionStart !== typeBox.selectionEnd) {
                try {
                    const s = typeBox.selectionStart;
                    const eEnd = typeBox.selectionEnd;
                    await navigator.clipboard.writeText(typeBox.value.substring(s, eEnd));
                    if (!document.execCommand('delete')) {
                        typeBox.value = typeBox.value.substring(0, s) + typeBox.value.substring(eEnd);
                        typeBox.selectionStart = typeBox.selectionEnd = s;
                    }
                } catch (err) {}
            }
            break;
        case 'KeyV':
            try { insertChar(await navigator.clipboard.readText()); } catch (err) {}
            break;
        case 'KeyZ': document.execCommand('undo'); break;
        case 'KeyY': document.execCommand('redo'); break;
    }
    vCtrl = false;
    document.querySelectorAll('.ctrl').forEach(k => k.classList.remove('active-mod'));
    updateModState();
}

function hideCustomMenu() { customMenu.style.display = 'none'; }

function showCustomMenu(e) {
    customMenu.style.display = 'block';
    let x, y;
    if (e && e.clientX !== undefined) {
        x = e.clientX; y = e.clientY;
    } else {
        const rect = typeBox.getBoundingClientRect();
        x = rect.left + rect.width / 2; y = rect.top + rect.height / 2;
    }

    const menuRect = customMenu.getBoundingClientRect();
    if (x + menuRect.width > window.innerWidth) x = window.innerWidth - menuRect.width - 10;
    if (y + menuRect.height > window.innerHeight) y = window.innerHeight - menuRect.height - 10;

    customMenu.style.left = `${x}px`; customMenu.style.top = `${y}px`;
}

customMenu.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.menuAction;
    const s = typeBox.selectionStart;
    const eEnd = typeBox.selectionEnd;

    if (action === 'cut' && s !== eEnd) {
        try {
            await navigator.clipboard.writeText(typeBox.value.substring(s, eEnd));
            if (!document.execCommand('delete')) {
                typeBox.value = typeBox.value.substring(0, s) + typeBox.value.substring(eEnd);
                typeBox.selectionStart = typeBox.selectionEnd = s;
            }
        } catch(err) {}
    } else if (action === 'copy' && s !== eEnd) {
        try { await navigator.clipboard.writeText(typeBox.value.substring(s, eEnd)); } catch(err) {}
    } else if (action === 'paste') {
        try { insertChar(await navigator.clipboard.readText()); } catch (err) {}
    } else if (action === 'selectAll') {
        typeBox.select();
    }

    hideCustomMenu();
    typeBox.focus(); 
});

document.addEventListener('mousedown', (e) => {
    if (!customMenu.contains(e.target) && !e.target.closest('[data-mod="menu"]')) hideCustomMenu();
});

typeBox.addEventListener('contextmenu', (e) => {
    e.preventDefault(); showCustomMenu(e);
});

document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('mousedown', (e) => { e.preventDefault(); });

    key.addEventListener('click', async () => {
        const mod = key.dataset.mod;

        if (mod === 'shift') { 
            vShift = !vShift; 
            document.querySelectorAll('[data-mod="shift"]').forEach(k => k.classList.toggle('active-mod', vShift));
            updateModState(); return; 
        }
        if (mod === 'altgr') { 
            vAltGr = !vAltGr; 
            document.querySelectorAll('[data-mod="altgr"]').forEach(k => k.classList.toggle('active-mod', vAltGr));
            updateModState(); return; 
        }
        if (mod === 'ctrl')  { 
            vCtrl = !vCtrl; 
            document.querySelectorAll('.ctrl').forEach(k => k.classList.toggle('active-mod', vCtrl));
            updateModState(); return; 
        }
        if (mod === 'alt')   { 
            vAlt = !vAlt; 
            document.querySelectorAll('.alt[data-code="AltLeft"]').forEach(k => k.classList.toggle('active-mod', vAlt));
            updateModState(); return; 
        }
        if (mod === 'caps') {
            vCaps = !vCaps; key.classList.toggle('active-mod', vCaps);
            typeBox.dataset.caps = vCaps ? 'on' : 'off'; return;
        }
        if (mod === 'menu') { showCustomMenu(); return; }

        const code = key.dataset.code;
        if (!code) return;

        if (vCtrl || pCtrl) { await executeVirtualCtrl(code); return; }

        if (key.dataset.action === 'backspace') {
            typeBox.focus();
            if (!document.execCommand('delete')) {
                const s = typeBox.selectionStart; const eEnd = typeBox.selectionEnd;
                if (s === eEnd && s > 0) {
                    typeBox.value = typeBox.value.substring(0, s - 1) + typeBox.value.substring(eEnd);
                    typeBox.selectionStart = typeBox.selectionEnd = s - 1;
                } else if (s !== eEnd) {
                    typeBox.value = typeBox.value.substring(0, s) + typeBox.value.substring(eEnd);
                    typeBox.selectionStart = typeBox.selectionEnd = s;
                }
            }
            return;
        }

        if (key.dataset.action === 'tab') { insertChar('\t'); return; }
        if (key.dataset.action === 'enter') { insertChar('\n'); return; }

        const activeShift = vShift || pShift;
        const activeAltGr = vAltGr || pAltGr;

        let char = '';
        if (activeShift && activeAltGr) char = key.dataset.saltgr;
        else if (activeAltGr) char = key.dataset.altgr;
        else if (activeShift) char = key.dataset.shift;
        else char = key.dataset.base;

        if (char !== undefined && !vCtrl && !vAlt && !pAlt && !pCtrl) {
            insertChar(char);

            if (vShift || vAltGr || vCtrl || vAlt) {
                vShift = vAltGr = vCtrl = vAlt = false;
                document.querySelectorAll('.active-mod').forEach(k => {
                    if (k.dataset.mod !== 'caps') k.classList.remove('active-mod');
                });
                updateModState();
            }
        }
    });
});

function trackPhysicalModifiers(e) {
    if (e.type === 'keydown' && e.code === 'AltRight') pAltRightDown = true;
    if (e.type === 'keyup' && e.code === 'AltRight') pAltRightDown = false;

    pShift = e.shiftKey;
    pCtrl = e.ctrlKey;
    pAltGr = e.getModifierState('AltGraph') || (e.ctrlKey && e.altKey) || pAltRightDown;
    pAlt = e.altKey && !pAltGr;

    if (e.code === 'CapsLock') {
        vCaps = e.getModifierState('CapsLock');
        const capsKey = document.querySelector('[data-mod="caps"]');
        if (capsKey) capsKey.classList.toggle('active-mod', vCaps);
        typeBox.dataset.caps = vCaps ? 'on' : 'off';
    }
    updateModState();
}

document.addEventListener('keydown', (e) => {
    const key = document.querySelector(`.key[data-code="${e.code}"]`);
    if (key && e.code !== 'CapsLock') {
        if (key.classList.contains('special-key')) {
            key.classList.add('active-mod');
        } else {
            key.classList.add('hardware-active');
        }
    }
    trackPhysicalModifiers(e);
});

document.addEventListener('keyup', (e) => {
    const key = document.querySelector(`.key[data-code="${e.code}"]`);
    if (key && e.code !== 'CapsLock') {
        key.classList.remove('active-mod');
        key.classList.remove('hardware-active');
    }
    trackPhysicalModifiers(e);
});

typeBox.addEventListener('keydown', async (e) => {
    if (e.code === 'ContextMenu') {
        e.preventDefault(); showCustomMenu(e); return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) {
        const isAltGr = e.getModifierState('AltGraph') || (e.ctrlKey && e.altKey) || pAltRightDown;
        if (!isAltGr) return; 
    }

    const key = document.querySelector(`.key[data-code="${e.code}"]`);
    if (!key || !key.dataset.base) return;

    const activeShift = vShift || pShift;
    const activeAltGr = vAltGr || pAltGr;

    let char = '';
    if (activeShift && activeAltGr) char = key.dataset.saltgr;
    else if (activeAltGr) char = key.dataset.altgr;
    else if (activeShift) char = key.dataset.shift;
    else char = key.dataset.base;

    if (char !== undefined && char !== '') {
        e.preventDefault();
        insertChar(char);

        if (vShift || vAltGr || vCtrl || vAlt) {
            vShift = vAltGr = vCtrl = vAlt = false;
            document.querySelectorAll('.active-mod').forEach(k => {
                if (k.dataset.mod !== 'caps') k.classList.remove('active-mod');
            });
            updateModState();
        }
    }
});