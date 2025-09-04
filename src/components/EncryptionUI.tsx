import React, { useState, useCallback } from 'react';

interface EncryptionTarget {
  id: string;
  type: 'file' | 'obj' | 'buffer';
  path?: string;
  key?: string;
  data?: string;
  intent: 'encrypt' | 'do-not-encrypt' | 'cannot-encrypt';
  selected: boolean;
}

interface EncryptionResult {
  type: string;
  path?: string;
  key?: string;
  intent: string;
  status: 'encrypted' | 'encryption failed' | 'skipped' | 'cannot encrypt';
  packaged?: string;
  error?: string;
  reason?: string;
  meta?: any;
}

interface PatchConfig {
  patches: string[];
  randomizeOrder?: boolean;
  addFakePatches?: boolean;
  preserveOriginal?: boolean;
}

export const EncryptionUI: React.FC = () => {
  const [targets, setTargets] = useState<EncryptionTarget[]>([]);
  const [passphrase, setPassphrase] = useState('');
  const [results, setResults] = useState<EncryptionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Patch system state
  const [patchConfig, setPatchConfig] = useState<PatchConfig>({
    patches: ['console.log("Patched!");'],
    randomizeOrder: false,
    addFakePatches: true,
    preserveOriginal: true
  });
  const [patchResults, setPatchResults] = useState<any>(null);

  // Add new encryption target
  const addTarget = useCallback(() => {
    const newTarget: EncryptionTarget = {
      id: Date.now().toString(),
      type: 'file',
      intent: 'encrypt',
      selected: true
    };
    setTargets(prev => [...prev, newTarget]);
  }, []);

  // Update target
  const updateTarget = useCallback((id: string, updates: Partial<EncryptionTarget>) => {
    setTargets(prev => prev.map(target => 
      target.id === id ? { ...target, ...updates } : target
    ));
  }, []);

  // Remove target
  const removeTarget = useCallback((id: string) => {
    setTargets(prev => prev.filter(target => target.id !== id));
  }, []);

  // Toggle target selection
  const toggleTarget = useCallback((id: string) => {
    setTargets(prev => prev.map(target => 
      target.id === id ? { ...target, selected: !target.selected } : target
    ));
  }, []);

  // Encrypt selected targets
  const encryptSelected = useCallback(async () => {
    if (!passphrase) {
      setError('Please enter a passphrase');
      return;
    }

    const selectedTargets = targets.filter(t => t.selected);
    if (selectedTargets.length === 0) {
      setError('Please select at least one target');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/encrypt-selective', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: selectedTargets.map(t => ({
            type: t.type,
            path: t.path,
            key: t.key,
            data: t.data,
            intent: t.intent
          })),
          passphrase,
          options: {
            timestamp: new Date().toISOString(),
            source: 'web-ui'
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || 'Encryption failed');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [targets, passphrase]);

  // Apply patches to file
  const applyPatches = useCallback(async (filePath: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/patch/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          config: patchConfig,
          context: {
            window: typeof window !== 'undefined' ? window : undefined,
            document: typeof document !== 'undefined' ? document : undefined
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPatchResults(data);
      } else {
        setError(data.error || 'Patch application failed');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [patchConfig]);

  // Scan file for Car(); markers
  const scanFile = useCallback(async (filePath: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/patch/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Found ${data.count} Car(); markers at lines: ${data.locations.join(', ')}`);
      } else {
        setError(data.error || 'Scan failed');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Carmilla Encryption & Patch System</h1>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Encryption Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Selective Encryption</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label>
            Passphrase:
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button onClick={addTarget} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Add Target
          </button>
          <button 
            onClick={encryptSelected} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4caf50', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? 'Encrypting...' : 'Encrypt Selected'}
          </button>
        </div>

        {/* Targets List */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
          <h3>Encryption Targets</h3>
          {targets.map(target => (
            <div key={target.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: target.selected ? '#e8f5e8' : '#f5f5f5',
              borderRadius: '4px'
            }}>
              <input
                type="checkbox"
                checked={target.selected}
                onChange={() => toggleTarget(target.id)}
                style={{ marginRight: '10px' }}
              />
              
              <select
                value={target.type}
                onChange={(e) => updateTarget(target.id, { type: e.target.value as any })}
                style={{ marginRight: '10px', padding: '5px' }}
              >
                <option value="file">File</option>
                <option value="obj">Object</option>
                <option value="buffer">Buffer</option>
              </select>

              <select
                value={target.intent}
                onChange={(e) => updateTarget(target.id, { intent: e.target.value as any })}
                style={{ marginRight: '10px', padding: '5px' }}
              >
                <option value="encrypt">Encrypt</option>
                <option value="do-not-encrypt">Do Not Encrypt</option>
                <option value="cannot-encrypt">Cannot Encrypt</option>
              </select>

              {target.type === 'file' && (
                <input
                  type="text"
                  placeholder="File path"
                  value={target.path || ''}
                  onChange={(e) => updateTarget(target.id, { path: e.target.value })}
                  style={{ marginRight: '10px', padding: '5px', flex: 1 }}
                />
              )}

              {target.type === 'obj' && (
                <input
                  type="text"
                  placeholder="Object key"
                  value={target.key || ''}
                  onChange={(e) => updateTarget(target.id, { key: e.target.value })}
                  style={{ marginRight: '10px', padding: '5px', flex: 1 }}
                />
              )}

              <button
                onClick={() => removeTarget(target.id)}
                style={{ 
                  padding: '5px 10px', 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Encryption Results</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
              {results.map((result, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  marginBottom: '10px',
                  backgroundColor: result.status === 'encrypted' ? '#e8f5e8' : 
                                 result.status === 'encryption failed' ? '#ffebee' : '#fff3e0',
                  borderRadius: '4px'
                }}>
                  <strong>{result.type}:</strong> {result.path || result.key}<br/>
                  <strong>Status:</strong> {result.status}<br/>
                  {result.error && <><strong>Error:</strong> {result.error}<br/></>}
                  {result.reason && <><strong>Reason:</strong> {result.reason}<br/></>}
                  {result.packaged && (
                    <details>
                      <summary>Packaged Data</summary>
                      <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                        {result.packaged.substring(0, 200)}...
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Patch System Section */}
      <div>
        <h2>Car(); Patch System</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Patch Configuration</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={patchConfig.randomizeOrder}
                onChange={(e) => setPatchConfig(prev => ({ ...prev, randomizeOrder: e.target.checked }))}
                style={{ marginRight: '5px' }}
              />
              Randomize patch order
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={patchConfig.addFakePatches}
                onChange={(e) => setPatchConfig(prev => ({ ...prev, addFakePatches: e.target.checked }))}
                style={{ marginRight: '5px' }}
              />
              Add fake patches (anti-reverse engineering)
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Patch Code</h3>
          <textarea
            value={patchConfig.patches.join('\n')}
            onChange={(e) => setPatchConfig(prev => ({ 
              ...prev, 
              patches: e.target.value.split('\n').filter(line => line.trim()) 
            }))}
            style={{ width: '100%', height: '100px', padding: '10px' }}
            placeholder="Enter patch code, one per line"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>File Operations</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="File path to scan/patch"
              id="filePath"
              style={{ padding: '5px', flex: 1 }}
            />
            <button
              onClick={() => {
                const filePath = (document.getElementById('filePath') as HTMLInputElement)?.value;
                if (filePath) scanFile(filePath);
              }}
              style={{ padding: '5px 15px' }}
            >
              Scan for Car();
            </button>
            <button
              onClick={() => {
                const filePath = (document.getElementById('filePath') as HTMLInputElement)?.value;
                if (filePath) applyPatches(filePath);
              }}
              disabled={loading}
              style={{ 
                padding: '5px 15px', 
                backgroundColor: '#2196f3', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Apply Patches
            </button>
          </div>
        </div>

        {/* Patch Results */}
        {patchResults && (
          <div style={{ marginTop: '20px' }}>
            <h3>Patch Results</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
              <p><strong>Patches Applied:</strong> {patchResults.patchesApplied}</p>
              {patchResults.errors && patchResults.errors.length > 0 && (
                <div style={{ color: '#c62828' }}>
                  <strong>Errors:</strong>
                  <ul>
                    {patchResults.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {patchResults.executionResult && (
                <details>
                  <summary>Execution Result</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(patchResults.executionResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncryptionUI;