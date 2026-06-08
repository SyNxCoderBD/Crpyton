import { encrypt, decrypt } from 'crypto-utils';

// Defensive element selection
const getEl = (id) => document.getElementById(id);

const passwordInput = getEl('password');
const useDefaultCheckbox = getEl('use-default-key');
const textInput = getEl('text-input');
const encryptBtn = getEl('encrypt-btn');
const decryptBtn = getEl('decrypt-btn');
const outputContainer = getEl('output-container');
const outputText = getEl('output-text');
const copyBtn = getEl('copy-btn');
const togglePasswordBtn = getEl('toggle-password');
const toast = getEl('toast');

const DEFAULT_KEY = "CRYPTON_DEFAULT_KEY_2024";

// Sound Effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let successBuffer, errorBuffer;

async function loadSounds() {
    const loadSound = async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    };

    try {
        successBuffer = await loadSound('success.mp3');
        errorBuffer = await loadSound('error.mp3');
    } catch (e) {
        console.warn('Audio could not be loaded', e);
    }
}

function playSound(buffer) {
    if (!buffer) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// UI Helpers
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function updateOutput(text) {
    if (text) {
        outputText.textContent = text;
        outputContainer.classList.remove('hidden');
    } else {
        outputContainer.classList.add('hidden');
    }
}

// Event Listeners
if (useDefaultCheckbox && passwordInput) {
    useDefaultCheckbox.addEventListener('change', () => {
        passwordInput.disabled = useDefaultCheckbox.checked;
        if (useDefaultCheckbox.checked) {
            passwordInput.value = '••••••••••••';
        } else {
            passwordInput.value = '';
        }
    });
}

if (encryptBtn) {
    encryptBtn.addEventListener('click', async () => {
    const useDefault = useDefaultCheckbox ? useDefaultCheckbox.checked : false;
    const password = useDefault ? DEFAULT_KEY : (passwordInput ? passwordInput.value : '');
    const text = textInput ? textInput.value : '';

    if (!useDefault && !password) {
        showToast('Please enter a secret key', 'error');
        playSound(errorBuffer);
        return;
    }
    if (!text) {
        showToast('Please enter a message', 'error');
        playSound(errorBuffer);
        return;
    }

    try {
        const result = await encrypt(text, password);
        updateOutput(result);
        showToast('Encrypted successfully!', 'success');
        playSound(successBuffer);
    } catch (err) {
        showToast('Encryption failed', 'error');
        playSound(errorBuffer);
    }
});
}

if (decryptBtn) {
    decryptBtn.addEventListener('click', async () => {
    const useDefault = useDefaultCheckbox ? useDefaultCheckbox.checked : false;
    const password = useDefault ? DEFAULT_KEY : (passwordInput ? passwordInput.value : '');
    const text = textInput ? textInput.value : '';

    if (!useDefault && !password) {
        showToast('Please enter a secret key', 'error');
        playSound(errorBuffer);
        return;
    }
    if (!text) {
        showToast('Please enter the encrypted text', 'error');
        playSound(errorBuffer);
        return;
    }

    try {
        const result = await decrypt(text, password);
        updateOutput(result);
        showToast('Decrypted successfully!', 'success');
        playSound(successBuffer);
    } catch (err) {
        showToast(err.message, 'error');
        playSound(errorBuffer);
    }
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
            playSound(successBuffer);
        }).catch(() => {
            showToast('Failed to copy', 'error');
            playSound(errorBuffer);
        });
    }
    });
}

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.style.color = type === 'text' ? 'var(--primary)' : 'var(--text-muted)';
    });
}

// Initialize
loadSounds();