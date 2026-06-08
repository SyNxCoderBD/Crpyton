/**
 * Utility functions for AES-GCM encryption and decryption using Web Crypto API.
 */

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives a cryptographic key from a password and salt.
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts plaintext using a password.
 * Returns a Base64 string containing salt + iv + ciphertext.
 */
export async function encrypt(plaintext, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const key = await deriveKey(password, salt);
    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    );

    const encryptedContentArr = new Uint8Array(encryptedContent);
    const result = new Uint8Array(salt.length + iv.length + encryptedContentArr.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedContentArr, salt.length + iv.length);

    return btoa(String.fromCharCode(...result));
}

/**
 * Decrypts a Base64 string using a password.
 */
export async function decrypt(base64Data, password) {
    try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const salt = bytes.slice(0, SALT_LENGTH);
        const iv = bytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = bytes.slice(SALT_LENGTH + IV_LENGTH);

        const key = await deriveKey(password, salt);
        const decryptedContent = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        throw new Error('Decryption failed. Invalid key or corrupted data.');
    }
}