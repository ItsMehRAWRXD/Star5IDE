/**
 * React Hook for Carmilla Encryption
 * Provides encryption/decryption functions that communicate with backend
 * Can work with local encryption or API-based encryption
 */

import { useState, useCallback, useEffect } from 'react';

export interface EncryptionHook {
  encrypt: (data: string, passphrase: string) => Promise<string>;
  decrypt: (encryptedData: string, passphrase: string) => Promise<string>;
  encryptBatch: (items: Array<{ id: string; data: string }>, passphrase: string) => Promise<Map<string, string>>;
  decryptBatch: (items: Array<{ id: string; data: string }>, passphrase: string) => Promise<Map<string, string>>;
  isAvailable: boolean;
  checkAvailability: () => Promise<void>;
  lastError: string | null;
}

// Check if we're in browser or Node environment
const isBrowser = typeof window !== 'undefined';

// API endpoint (adjust for your setup)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export function useEncryption(): EncryptionHook {
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Check if encryption service is available
  const checkAvailability = useCallback(async () => {
    if (!isBrowser) {
      // Server-side: try to import carmilla module
      try {
        const carmilla = await import('../crypto/carmilla');
        setIsAvailable(carmilla.checkOpenSSL());
      } catch {
        setIsAvailable(false);
      }
    } else {
      // Client-side: check API availability
      try {
        const response = await fetch(`${API_BASE}/encryption/status`);
        const data = await response.json();
        setIsAvailable(data.available === true);
      } catch {
        // If API is not available, try local encryption
        try {
          // Try to use Web Crypto API as fallback
          if (window.crypto && window.crypto.subtle) {
            setIsAvailable(true);
          } else {
            setIsAvailable(false);
          }
        } catch {
          setIsAvailable(false);
        }
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Encrypt data
  const encrypt = useCallback(async (data: string, passphrase: string): Promise<string> => {
    setLastError(null);
    
    try {
      if (!isBrowser) {
        // Server-side: use carmilla directly
        const carmilla = await import('../crypto/carmilla');
        return carmilla.encrypt(data, passphrase);
      } else {
        // Client-side: try API first
        try {
          const response = await fetch(`${API_BASE}/encryption/encrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targets: [{
                type: 'string',
                data,
                intent: 'encrypt'
              }],
              passphrase
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const result = await response.json();
          if (result.reports && result.reports[0] && result.reports[0].packaged) {
            return result.reports[0].packaged;
          }
          throw new Error('Invalid API response');
        } catch (apiError) {
          // Fallback to Web Crypto API
          if (window.crypto && window.crypto.subtle) {
            return await webCryptoEncrypt(data, passphrase);
          }
          throw apiError;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Encryption failed';
      setLastError(message);
      throw new Error(message);
    }
  }, []);

  // Decrypt data
  const decrypt = useCallback(async (encryptedData: string, passphrase: string): Promise<string> => {
    setLastError(null);
    
    try {
      if (!isBrowser) {
        // Server-side: use carmilla directly
        const carmilla = await import('../crypto/carmilla');
        
        // Check if it's a package
        try {
          const pack = carmilla.unpack(encryptedData);
          return carmilla.decrypt(pack.data, passphrase, pack.meta.salt);
        } catch {
          // Try direct decryption
          return carmilla.decrypt(encryptedData, passphrase);
        }
      } else {
        // Client-side: try API first
        try {
          const response = await fetch(`${API_BASE}/encryption/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targets: [{
                type: 'string',
                data: encryptedData,
                intent: 'decrypt'
              }],
              passphrase
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const result = await response.json();
          if (result.reports && result.reports[0] && result.reports[0].packaged) {
            return result.reports[0].packaged;
          }
          throw new Error('Invalid API response');
        } catch (apiError) {
          // Fallback to Web Crypto API
          if (window.crypto && window.crypto.subtle) {
            return await webCryptoDecrypt(encryptedData, passphrase);
          }
          throw apiError;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Decryption failed';
      setLastError(message);
      throw new Error(message);
    }
  }, []);

  // Batch encrypt
  const encryptBatch = useCallback(async (
    items: Array<{ id: string; data: string }>,
    passphrase: string
  ): Promise<Map<string, string>> => {
    const results = new Map<string, string>();
    
    // Process in parallel for speed
    const promises = items.map(async item => {
      try {
        const encrypted = await encrypt(item.data, passphrase);
        results.set(item.id, encrypted);
      } catch (error) {
        console.error(`Failed to encrypt item ${item.id}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }, [encrypt]);

  // Batch decrypt
  const decryptBatch = useCallback(async (
    items: Array<{ id: string; data: string }>,
    passphrase: string
  ): Promise<Map<string, string>> => {
    const results = new Map<string, string>();
    
    // Process in parallel
    const promises = items.map(async item => {
      try {
        const decrypted = await decrypt(item.data, passphrase);
        results.set(item.id, decrypted);
      } catch (error) {
        console.error(`Failed to decrypt item ${item.id}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }, [decrypt]);

  return {
    encrypt,
    decrypt,
    encryptBatch,
    decryptBatch,
    isAvailable,
    checkAvailability,
    lastError
  };
}

// Web Crypto API fallback functions
async function webCryptoEncrypt(data: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from passphrase
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

async function webCryptoDecrypt(encryptedData: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  
  // Derive key
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}