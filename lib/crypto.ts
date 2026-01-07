/**
 * Hybrid Encryption Module: AES-256-GCM + RSA-OAEP
 * 
 * Client-side: Encrypts data before sending to server
 * Server-side: Decrypts data after receiving
 * 
 * Flow:
 * 1. Generate random AES key (sessionKey)
 * 2. Encrypt data with AES key
 * 3. Encrypt AES key with RSA public key
 * 4. Send: { encryptedData, encryptedKey, iv, authTag }
 */

// ============================================
// CLIENT-SIDE (Browser) - WebCrypto API
// ============================================

/**
 * Encrypted data payload
 */
export interface EncryptedPayload {
  encryptedData: string;  // Base64
  encryptedKey: string;   // Base64
  iv: string;             // Base64
}

/**
 * Converts PEM to ArrayBuffer for WebCrypto
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 to ArrayBuffer
 */
export async function encryptPayload(
  data: Record<string, unknown>,
  publicKeyPem: string
): Promise<EncryptedPayload> {
  // 1. Generate random AES-256 key
  const sessionKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  // 2. Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt JSON data with AES key
  const jsonData = JSON.stringify(data);
  const encodedData = new TextEncoder().encode(jsonData);
  
  const encryptedDataBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sessionKey,
    encodedData
  );

  // 4. Import RSA public key
  const publicKeyBuffer = pemToArrayBuffer(publicKeyPem);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  // 5. Export AES key and encrypt it with RSA key
  const rawSessionKey = await crypto.subtle.exportKey("raw", sessionKey);
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawSessionKey
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedDataBuffer),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// ============================================
// SERVER-SIDE (Node.js) - Node Crypto
// ============================================

/**
 * [SERVER-SIDE] Decrypts payload received from client
 * Used in Server Actions
 */
export async function decryptPayload<T = Record<string, unknown>>(
  payload: EncryptedPayload,
  privateKeyPem: string
): Promise<T> {
  // Dynamic import of node:crypto (server-side only)
  const crypto = await import("node:crypto");

  // 1. Convert Base64 to Buffers
  const encryptedData = Buffer.from(payload.encryptedData, "base64");
  const encryptedKey = Buffer.from(payload.encryptedKey, "base64");
  const iv = Buffer.from(payload.iv, "base64");

  // 2. Decrypt AES key with RSA private key
  const sessionKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedKey
  );

  // 3. Separate data and authTag (GCM appends authTag at the end)
  // In WebCrypto authTag is automatically appended to ciphertext
  const authTagLength = 16;
  const ciphertext = encryptedData.subarray(0, encryptedData.length - authTagLength);
  const authTag = encryptedData.subarray(encryptedData.length - authTagLength);

  // 4. Decrypt data with AES key
  const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey, iv);
  decipher.setAuthTag(authTag);

  const decryptedData = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  // 5. Parse JSON
  const jsonString = decryptedData.toString("utf8");
  return JSON.parse(jsonString) as T;
}

/**
 * [SERVER-SIDE] Generates RSA key pair
 * Used once to generate keys for the application
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const crypto = await import("node:crypto");

  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      }
    );
  });
}
