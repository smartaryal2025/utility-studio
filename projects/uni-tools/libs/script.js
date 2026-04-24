let isPreetiToUnicode = true;
let isKishorEngineActive = false;
const appHeader = document.querySelector('.app-header');

// --- DOM Elements ---
const btnP2U = document.getElementById('mode-p2u');
const btnU2P = document.getElementById('mode-u2p');
const inputBadge = document.getElementById('input-badge');
const outputBadge = document.getElementById('output-badge');
const clearBtn = document.getElementById('clear-btn');
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const fileUpload = document.getElementById('file-upload');
const fileNameDisplay = document.getElementById('file-name-display');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const errorMsg = document.getElementById('error-msg');
const toast = document.getElementById('toast');

// ==========================================
// ★ HIDDEN EASTER EGG: KISHOR ENGINE ★
// ==========================================

// 1. Keyboard Trigger (For PC)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault(); 
        toggleKishorEngine();
    }
});

// 2. Mobile/Tablet Touch Trigger (Tap Title 5 Times)
let tapCount = 0;
let tapTimer;

// Prevent the text from highlighting when you tap it quickly on a phone
appHeader.style.userSelect = "none"; 
appHeader.style.cursor = "pointer";

appHeader.addEventListener('click', () => {
    tapCount++;
    
    // Reset the count if they stop tapping for 1.5 seconds
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
        tapCount = 0;
    }, 1500);

    // If they hit 5 quick taps, activate the engine!
    if (tapCount >= 5) {
        toggleKishorEngine();
        tapCount = 0; // Reset after successful activation
    }
});

function toggleKishorEngine() {
    isKishorEngineActive = !isKishorEngineActive;

    if (isKishorEngineActive) {
        appHeader.textContent = "Kishor Engine Activated";
        appHeader.style.color = "#10b981"; // Bright Green
        btnP2U.textContent = "Kishor ➔ Unicode";
        btnU2P.textContent = "Unicode ➔ Kishor";
        showToast("Kishor Engine Activated!");
    } else {
        appHeader.textContent = "Unicode Tools";
        appHeader.style.color = ""; // THE FIX: Remove inline style to restore original CSS theme
        btnP2U.textContent = "Preeti ➔ Unicode";
        btnU2P.textContent = "Unicode ➔ Preeti";
        showToast("Standard Engine Restored");
    }

    // Refresh UI badges and recalculate the text
    switchMode(isPreetiToUnicode);
    triggerConversion();
}

// ==========================================
// 1. DICTIONARIES (Strictly mapped & updated for all edge cases)
// ==========================================

const preetiToUnicodeMap = {
    "–": "-", "÷": "/", "F": "ँ", "+": "ं", "M": "ः", "c": "अ", "cf": "आ", "cFf": "आँ", "c+f": "आं", "O": "इ", "O{": "ई", "p": "उ", "pm": "ऊ", "C": "ऋ", "P": "ए", "P]": "ऐ", "c‘f": "ऑ", "cf‘": "ऑ", "c]f": "ओ", "cf]": "ओ", "c}f": "औ", "cf}": "औ",
    "s": "क", "s‘": "कॅ", "S": "क्", "Qm": "क्त", "qm": "क्र", "If": "क्ष", "I": "क्ष्", "v": "ख", "V": "ख्", "u": "ग", "U": "ग्", "3": "घ", "£": "घ्",
    "ª": "ङ", "Í": "ङ्क", "Î": "ङ्ख", "Ë": "ङ्ग", "‹": "ङ्घ", "r": "च", "R": "च्", "5": "छ", "5«": "छ्र", "h": "ज", "H": "ज्", "1": "ज्ञ", "¡": "ज्ञ्",
    "´": "झ", "em": "झ", "eFm": "झाँ", "e+m": "झां", "e'm": "झु", "e\"m": "झू", "e[m": "झृ", "e‘m": "झॅ", "e]m": "झे", "e}m": "झै", "‰": "झ्", "e\\m": "झ्",
    "`": "ञ", "~": "ञ्", "6": "ट", "§": "ट्ट", "Ý": "टठ", "6«": "ट्र", "7": "ठ", "¶": "ठ्ठ", "7«": "ठ्र", "8": "ड", "•": "ड्ड", "°": "ड्ढ", "8«": "ड्र", "9": "ढ", "9«": "ढ्र",
    "0": "ण्", "0f": "ण", "t": "त", "T": "त्", "Q": "त्त", "q": "त्र", "y": "थ", "Y": "थ्",
    "b": "द", "¢": "द्घ", "2": "द्द", "4": "द्ध", "ß": "द्म", "B": "द्य", "›": "द्र", "å": "द्व", "w": "ध", "W": "ध्", "„": "ध्र", "g": "न", "G": "न्", "Ì": "न्न",
    "k": "प", "K": "प्", "km": "फ", "kFm": "फँ", "k+m": "फं", "k'm": "फु", "k\"m": "फू", "k[m": "फृ", "k‘m": "फॅ", "k]m": "फे", "k}m": "फै", "ˆ": "फ्", "k\\m": "फ्", "k|m": "फ्र",
    "a": "ब", "A": "ब्", "e": "भ", "E": "भ्", "d": "म", "D": "म्", "o": "य", "/": "र", "?": "रु", "¿": "रू", "¥": "र्‍",
    "n": "ल", "N˜": "ल", "N": "ल्", "j": "व", "J": "व्", "z": "श", "Z": "श्", ">": "श्र", "i": "ष्", "if": "ष", ";": "स", ":": "स्", "x": "ह", "Å": "हृ", "X": "ह्",
    "˜": "ऽ", "f": "ा", "L": "ी", "'": "ु", "\"": "ू", "[": "ृ", "]": "े", "}": "ै", "f‘": "ॉ", "\\": "्", "Ø": "्य", "|": "्र", "8Þ": "ड़", "9Þ": "ढ़", "Þ": "़",
    
    // Explicit Consonant + Ra Combos
    "s|": "क्र", "v|": "ख्र", "u|": "ग्र", "3|": "घ्र", "w|": "ध्र", "r|": "च्र", "h|": "ज्र", "´|": "झ्र", "y|": "थ्र", "g|": "न्र", "k|": "प्र", "a|": "ब्र", "e|": "भ्र", "d|": "म्र", "o|": "य्र", "/|": "र्र", "n|": "ल्र", "j|": "व्र", "if|": "ष्र", ";|": "स्र", "x|": "ह्र",
    
    // Restored Missing Preeti target
    "C[": "ॠ",
    
    // Multi-character Vowel fixes (O-kar and Au-kar)
    "f]": "ो", "f}": "ौ",
    
    // Global Punctuation from VBA
    "=": ".", "_": ")", "Ö": "=", "Ù": ";", "…": "‘", "Ú": "’", "Û": "!", "Ü": "%", "æ": "“", "Æ": "”", "±": "+", "-": "(", "<": "?", "ç": "ॐ",
    
    // Numbers
    ".": "।", "..": "॥", ")": "०", "!": "१", "@": "२", "#": "३", "$": "४", "%": "५", "^": "६", "&": "७", "*": "८", "(": "९"
};

const unicodeToPreetiMap = {
    "़": "Þ", "×": "×", "॥": "..", "÷": "/", "।": ".",
    "०": ")", "१": "!", "२": "@", "३": "#", "४": "$", "५": "%", "६": "^", "७": "&", "८": "*", "९": "(",
    "फ्र": "k|m", "फ": "km", "क्त": "Qm", "क्र": "qm", "ज्ञ्": "¡", "द्घ": "¢", "ज्ञ": "1", "द्द": "2", "द्ध": "4", "श्र": ">", "रु": "?", "द्य": "B", "क्ष्": "I", "क्ष": "If", "त्त": "Q", "द्म": "ß", "त्र": "q", "ध्र": "„", "ङ्घ": "‹", "ड्ड": "•", "द्र": "›", "ट्ट": "§", "ड्ढ": "°", "ठ्ठ": "¶", "रू": "¿", "हृ": "Å", "ङ्ग": "Ë", "न्न": "Ì", "ङ्क": "Í", "ङ्ख": "Î", "टठ": "Ý", "द्व": "å", "ट्र": "6«", "ठ्र": "7«", "ड्र": "8«", "ढ्र": "9«", "्र": "|", "ड़": "8Þ", "ढ़": "9Þ",
    
    // Separated Half-Ng Character Mappings & Ra-combos (Prevents joining)
    "ङ्ख्र": "ª\\v|", "ङ्ग्र": "ª\\u|", "ङ्घ्र": "ª\\3|",
    "ङ्ख्": "ª\\v\\", "ङ्ग्": "ª\\u\\", "ङ्घ्": "ª\\3\\",
    
    // Fix for specific complex half-clusters (Prevents aggressive splitting)
    "त्र्य": "q\\o",
    
    // Full base alphabet mappings
    "क्": "S", "क": "s", "ख्": "V", "ख": "v", "ग्": "U", "ग": "u", "घ्": "£", "घ": "3", "ङ": "ª", "च्": "R", "च": "r", "छ": "5", "ज्": "H", "ज": "h", "झ्": "‰", "झ": "´", "ञ्": "~", "ञ": "`", "ट": "6", "ठ": "7", "ड": "8", "ढ": "9", "ण्": "0", "ण": "0f", "त्": "T", "त": "t", "थ्": "Y", "थ": "y", "द": "b", "ध्": "W", "ध": "w", "न्": "G", "न": "g", "प्": "K", "प": "k", "फ्": "ˆ", "ब्": "A", "ब": "a", "भ्": "E", "भ": "e", "म्": "D", "म": "d", "य": "o", "र": "/", "ल्": "N", "ल": "n", "व्": "J", "व": "j", "श्": "Z", "श": "z", "ष्": "i", "ष": "if", "स्": ":", "स": ";", "ह्": "X", "ह": "x", "्य": "Ø",
    "ऑ": "cf‘", "औ": "cf}", "ओ": "cf]", "आ": "cf", "अ": "c", "ई": "O{", "इ": "O", "ऊ": "pm", "उ": "p", "ऋ": "C", "ऐ": "P]", "ए": "P", "ॉ": "f‘", "ू": "\"", "ु": "'", "ं": "+", "ा": "f", "ृ": "[", "्": "\\", "े": "]", "ै": "}", "ँ": "F", "ी": "L", "ः": "M", "ो": "f]", "ौ": "f}", "र्‍य": "¥o", "र्‍": "¥",
    
    // Explicit Consonant + Ra Combos
    "ग्र": "u|", "घ्र": "3|", "च्र": "r|", "ज्र": "h|", "झ्र": "´|", "थ्र": "y|", "न्र": "g|", "प्र": "k|", "ब्र": "a|", "भ्र": "e|", "म्र": "d|", "य्र": "o|", "र्र": "/|", "ल्र": "n|", "व्र": "j|", "ष्र": "if|", "स्र": ";|", "ह्र": "x|",
    
    // Corrected edge case targets based on Preeti availability
    "ह्व": "Xj", "ह्न": "Xg", "ह्ण": "X0f", "ऽ": "˜", "ॠ": "C[",
    
    // Strict Punctuation overrides
    "–": "-", "-": "–", "(": "-", ")": "_", "‘": "…", "’": "Ú", "“": "æ", "”": "Æ", "!": "Û", "%": "Ü", "=": "Ö", ";": "Ù", "?": "<", "ॐ": "ç", "/": "÷", "+": "±", ":": "M"
};

// ==========================================
// 2. CONVERSION ALGORITHMS
// ==========================================

// Helper: Safely escape regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate single-pass, length-sorted regex matchers
const p2uRegex = new RegExp(Object.keys(preetiToUnicodeMap).sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'), 'g');
const u2pRegex = new RegExp(Object.keys(unicodeToPreetiMap).sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'), 'g');

function preetiToUnicode(text) {
    let result = text;

    // 0. Pre-Pass Fixes for Punctuation and Misplaced 'm' modifiers
    result = result.replace(/k(['"\]\}\[\{\\\F+‘Lf]+)m/g, "km$1");
    result = result.replace(/e(['"\]\}\[\{\\\F+‘Lf]+)m/g, "em$1");

    // 1. One-Pass Exact Dictionary Match
    result = result.replace(p2uRegex, match => preetiToUnicodeMap[match]);

    // 1.5 POST-DICTIONARY COLON FIX
    result = result.replace(/(^|\s)ः/g, "$1:");

    // 2. Fix Positional: Short 'i' (Move 'l' to right and convert to 'ि')
    let positionOfI = result.indexOf('l');
    while (positionOfI !== -1) {
        let charRight = result.charAt(positionOfI + 1);
        result = result.replace('l' + charRight, charRight + 'ि');
        positionOfI = result.indexOf('l');
    }

    // 3. Fix Positional "Wrong EE"
    result = result.replace(/ि्(.)/g, "्$1ि");
    result = result.replace(/िं्(.)/g, "्$1िं");

    // 4. Fix Positional: Reph (Move '{' to left and convert to 'र्')
    result = result.replace(/(.)([ािीुूृेैोौंःँॅ]*){/g, "र्$1$2");

    // 5. Cleanup stray separated vowel modifiers
    result = result.replace(/ाे/g, "ो");
    result = result.replace(/ाै/g, "ौ");

    return result;
}

function unicodeToPreeti(text) {
    let result = text;

    // 1. Pre-Process End-of-Word Halants:
    result = result.replace(/(.)्(?=\s|[.,;!?।॥)\]}"']|$)/g, "$1\\");

    // 2. Fix Positional: Short 'i' (Move 'ि' to the left and convert to 'l')
    result = result.replace(/((?:.[्])*.)ि/g, "l$1");

    // 3. Fix Positional: Reph (Move 'र्' to the right and convert to '{')
    result = result.replace(/(^|[^्])र्(?!\u200D)((?:.[्])*.)([ािीुूृेैोौंःँॅ]?)/g, "$1$2$3{");

    // 4. One-Pass Exact Dictionary Match
    result = result.replace(u2pRegex, match => unicodeToPreetiMap[match]);

    // 5. Cleanup edge cases specific to Preeti typographies
    result = result.replace(/s\(/g, "s"); 

    return result;
}

// ==========================================
// 3. EVENT LISTENERS & UI LOGIC
// ==========================================

function switchMode(toPreetiToUnicode) {
    isPreetiToUnicode = toPreetiToUnicode;
    
    // Determine the correct label based on Easter Egg state
    const primaryLabel = isKishorEngineActive ? "Kishor" : "Preeti";
    
    if (isPreetiToUnicode) {
        btnP2U.classList.add('active');
        btnU2P.classList.remove('active');
        inputBadge.textContent = primaryLabel;
        outputBadge.textContent = "Unicode";
        
        inputText.classList.add('preeti-text');
        inputText.classList.remove('unicode-text');
        outputText.classList.remove('preeti-text');
        outputText.classList.add('unicode-text');
    } else {
        btnU2P.classList.add('active');
        btnP2U.classList.remove('active');
        inputBadge.textContent = "Unicode";
        outputBadge.textContent = "Preeti";
        
        inputText.classList.remove('preeti-text');
        inputText.classList.add('unicode-text');
        outputText.classList.add('preeti-text');
        outputText.classList.remove('unicode-text');
    }
    
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
    errorMsg.classList.add('hidden');
}

btnP2U.addEventListener('click', () => switchMode(true));
btnU2P.addEventListener('click', () => switchMode(false));

function triggerConversion() {
    const text = inputText.value;
    if (!text.trim()) {
        errorMsg.classList.remove('hidden');
        outputText.value = '';
        return;
    }
    errorMsg.classList.add('hidden');
    
    if (isKishorEngineActive) {
        // Route to functions inside kishor.js
        if (typeof kishorToUnicode === 'function' && typeof unicodeToKishor === 'function') {
            outputText.value = isPreetiToUnicode ? kishorToUnicode(text) : unicodeToKishor(text);
        } else {
            outputText.value = "System Error: Functions kishorToUnicode() or unicodeToKishor() not found in kishor.js";
        }
    } else {
        // Fixed: The missing closing bracket `}` is now right here where it belongs!
        outputText.value = isPreetiToUnicode ? preetiToUnicode(text) : unicodeToPreeti(text);
    }
}

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    errorMsg.classList.add('hidden');
    inputText.focus(); 
});

inputText.addEventListener('input', triggerConversion);

const downloadTxtBtn = document.getElementById('download-txt-btn');
const downloadDocBtn = document.getElementById('download-doc-btn');

fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = file.name;

    if (file.name.endsWith('.doc')) {
        inputText.value = "System Note: Legacy .doc binary files cannot be read in the browser. Please resave your file as .docx or .txt, or paste the text directly.";
        return;
    }

    if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    inputText.value = result.value;
                    errorMsg.classList.add('hidden');
                    triggerConversion();
                })
                .catch(function(err) {
                    inputText.value = "Error parsing .docx file: " + err.message;
                });
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        inputText.value = event.target.result;
        errorMsg.classList.add('hidden');
        triggerConversion();
    };
    reader.readAsText(file);
    e.target.value = ''; 
});

copyBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    navigator.clipboard.writeText(outputText.value).then(() => {
        showToast("Copied to clipboard!");
    });
});

downloadTxtBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    const blob = new Blob([outputText.value], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isPreetiToUnicode ? 'unicode_output.txt' : 'preeti_output.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("Text file downloaded!");
});

downloadDocBtn.addEventListener('click', () => {
    if (!outputText.value) return;
    
    const textContent = outputText.value.replace(/\n/g, '<br>');
    const wordHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>Exported Document</title>
        </head>
        <body>
            ${textContent}
        </body>
        </html>
    `;
    
    const blob = new Blob(['\ufeff', wordHTML], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isPreetiToUnicode ? 'unicode_output.doc' : 'preeti_output.doc';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("Word document downloaded!");
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    switchMode(isPreetiToUnicode); 
});