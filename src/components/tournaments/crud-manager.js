// Helpers to manage tournament records and validate the editing keyword.

// The editing keyword is never stored in plain text: only a salted PBKDF2 hash
// lives in the bundle. To change the keyword, follow the steps in readme.md.
const KEYWORD_SALT = "741bc877ff682e3187b08f20c3ea12a5";
const KEYWORD_HASH = "ebde37321d62e198f49e69f9ec89e3a69d9a86d4d073b1c725dd7e14c7ff5912";
const KEYWORD_ITERATIONS = 210000;

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function hexToBytes(hex) {
    return new Uint8Array(hex.match(/.{2}/g).map((pair) => parseInt(pair, 16)));
}

export async function verifyCrudPassword(password) {
    if (!password || !window.crypto?.subtle) return false;

    const encoder = new TextEncoder();
    const key = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: hexToBytes(KEYWORD_SALT), iterations: KEYWORD_ITERATIONS, hash: "SHA-256" }, key, 256);

    return toHex(bits) === KEYWORD_HASH;
}

export function createCrudItem(collection, item) {
    return [item, ...collection];
}

export function updateCrudItem(collection, idKey, nextItem) {
    return collection.map((item) => (item[idKey] === nextItem[idKey] ? nextItem : item));
}

export function deleteCrudItem(collection, idKey, idValue) {
    return collection.filter((item) => item[idKey] !== idValue);
}

export function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
