import React, { useState } from 'react';

interface EncryptionResult {
  success: boolean;
  packaged?: string;
  data?: string;
  meta?: any;
  error?: string;
  details?: string;
}

const EncryptionDemo: React.FC = () => {
  const [plaintext, setPlaintext] = useState('Hello, Carmilla! This is a secret message.');
  const [passphrase, setPassphrase] = useState('mySecretKey123');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const encryptData = async () => {
    if (!plaintext || !passphrase) {
      showMessage('error', 'Both plaintext and passphrase are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/encryption/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: plaintext,
          passphrase,
          meta: {
            demo: true,
            timestamp: new Date().toISOString(),
            source: 'encryption-demo'
          }
        })
      });

      const result: EncryptionResult = await response.json();
      if (result.success && result.packaged) {
        setEncryptedData(result.packaged);
        setMetadata(result.meta);
        showMessage('success', 'Data encrypted successfully with Carmilla OpenSSL!');
      } else {
        showMessage('error', result.error || 'Encryption failed');
      }
    } catch (error) {
      showMessage('error', 'Network error during encryption');
    } finally {
      setLoading(false);
    }
  };

  const decryptData = async () => {
    if (!encryptedData || !passphrase) {
      showMessage('error', 'Both encrypted data and passphrase are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/encryption/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packaged: encryptedData,
          passphrase
        })
      });

      const result: EncryptionResult = await response.json();
      if (result.success && result.data !== undefined) {
        setDecryptedData(result.data);
        showMessage('success', 'Data decrypted successfully!');
      } else {
        showMessage('error', result.error || 'Decryption failed');
      }
    } catch (error) {
      showMessage('error', 'Network error during decryption');
    } finally {
      setLoading(false);
    }
  };

  const inspectPackage = async () => {
    if (!encryptedData) {
      showMessage('error', 'No encrypted data to inspect');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/encryption/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packaged: encryptedData })
      });

      const result = await response.json();
      if (result.success) {
        setMetadata(result.meta);
        showMessage('info', `Package inspected: ${result.dataLength} bytes of encrypted data`);
      } else {
        showMessage('error', result.error || 'Inspection failed');
      }
    } catch (error) {
      showMessage('error', 'Network error during inspection');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPlaintext('Hello, Carmilla! This is a secret message.');
    setEncryptedData('');
    setDecryptedData('');
    setMetadata(null);
    setMessage(null);
  };

  return (
    <div className="component-container">
      <h2>🔐 Carmilla OpenSSL Encryption Demo</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Test the native OpenSSL encryption with unique salt/IV per operation, 
        metadata packaging, and anti-reverse engineering features.
      </p>

      {message && (
        <div className={`status-message status-${message.type}`}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Input Section */}
        <div>
          <h3>📝 Input Data</h3>
          <div className="form-group">
            <label htmlFor="plaintext">Plaintext to Encrypt:</label>
            <textarea
              id="plaintext"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              rows={4}
              placeholder="Enter text to encrypt..."
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="passphrase">Passphrase:</label>
            <input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter encryption passphrase..."
              disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={encryptData}
              className="btn btn-primary"
              disabled={loading || !plaintext || !passphrase}
            >
              {loading ? '⏳ Encrypting...' : '🔐 Encrypt'}
            </button>
            <button
              onClick={clearAll}
              className="btn btn-secondary"
              disabled={loading}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Encrypted Data Section */}
        <div>
          <h3>🔒 Encrypted Data</h3>
          <div className="form-group">
            <label>Carmilla Package (Base64):</label>
            <textarea
              value={encryptedData}
              onChange={(e) => setEncryptedData(e.target.value)}
              rows={6}
              placeholder="Encrypted data will appear here..."
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={decryptData}
              className="btn btn-success"
              disabled={loading || !encryptedData || !passphrase}
            >
              {loading ? '⏳ Decrypting...' : '🔓 Decrypt'}
            </button>
            <button
              onClick={inspectPackage}
              className="btn btn-secondary"
              disabled={loading || !encryptedData}
            >
              🔍 Inspect
            </button>
          </div>
        </div>

        {/* Decrypted Data Section */}
        {decryptedData && (
          <div>
            <h3>✅ Decrypted Data</h3>
            <div className="form-group">
              <label>Recovered Plaintext:</label>
              <textarea
                value={decryptedData}
                readOnly
                rows={4}
                style={{ 
                  backgroundColor: '#d4edda', 
                  border: '2px solid #28a745',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div style={{ padding: '1rem', background: '#d4edda', borderRadius: '6px', fontSize: '0.9rem' }}>
              ✅ <strong>Success!</strong> Data encrypted and decrypted successfully. 
              Each encryption uses unique salt/IV for maximum security.
            </div>
          </div>
        )}

        {/* Metadata Section */}
        {metadata && (
          <div>
            <h3>📊 Package Metadata</h3>
            <pre style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              overflow: 'auto',
              border: '1px solid #dee2e6'
            }}>
              {JSON.stringify(metadata, null, 2)}
            </pre>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <p><strong>Method:</strong> {metadata.method || 'openssl'}</p>
              <p><strong>Chain:</strong> {metadata.chain?.join(' → ') || 'openssl'}</p>
              <p><strong>Timestamp:</strong> {metadata.timestamp}</p>
              {metadata.fake_calls && (
                <p><strong>Anti-RE:</strong> {metadata.fake_calls.length} fake calls executed</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Info */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1565c0' }}>🔧 Technical Details</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1565c0' }}>
          <li><strong>Algorithm:</strong> AES-256-CBC with random salt</li>
          <li><strong>Unique Per Run:</strong> Each encryption generates new salt/IV</li>
          <li><strong>Anti-Reverse Engineering:</strong> Random fake OpenSSL calls executed</li>
          <li><strong>Metadata:</strong> Timestamp, chain info, and custom fields included</li>
          <li><strong>No Dependencies:</strong> Pure Node.js + OpenSSL binary</li>
          <li><strong>Plug-and-Play:</strong> Works in any Node.js/TypeScript project</li>
        </ul>
      </div>
    </div>
  );
};

export default EncryptionDemo;