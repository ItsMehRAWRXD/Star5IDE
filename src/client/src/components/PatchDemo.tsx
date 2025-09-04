import React, { useState } from 'react';

interface PatchPoint {
  line: number;
  column: number;
  originalLine: string;
}

interface PatchResult {
  originalCode: string;
  patchedCode: string;
  patchPoints: PatchPoint[];
  patches: string[];
  executionResult?: any;
  error?: string;
}

const PatchDemo: React.FC = () => {
  const [sourceCode, setSourceCode] = useState(`function demoFunction() {
  console.log("Starting demo function");
  Car();
  
  const data = { message: "Hello World", timestamp: Date.now() };
  Car();
  
  console.log("Processing data:", data);
  Car();
  
  return data;
}

// Execute the demo
const result = demoFunction();
console.log("Final result:", result);`);
  
  const [patches, setPatches] = useState([
    'console.log("🚗 First patch injected!");',
    'data.patched = true; console.log("🔧 Data modified by patch");',
    'console.log("⚡ Third patch executed at:", new Date().toISOString());'
  ]);
  
  const [result, setResult] = useState<PatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const findMarkers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patch/find-markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('info', `Found ${data.count} Car(); markers in code`);
        setResult({ ...result, patchPoints: data.markers } as PatchResult);
      } else {
        showMessage('error', data.error || 'Failed to find markers');
      }
    } catch (error) {
      showMessage('error', 'Network error while finding markers');
    } finally {
      setLoading(false);
    }
  };

  const applyPatches = async () => {
    if (!sourceCode || patches.length === 0) {
      showMessage('error', 'Source code and patches are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patch/apply-patches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode, patches })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
        showMessage('success', `Applied ${data.result.patches.length} patches to ${data.result.patchPoints.length} markers`);
      } else {
        showMessage('error', data.error || 'Failed to apply patches');
      }
    } catch (error) {
      showMessage('error', 'Network error while applying patches');
    } finally {
      setLoading(false);
    }
  };

  const executePatched = async () => {
    if (!sourceCode || patches.length === 0) {
      showMessage('error', 'Source code and patches are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patch/execute-patched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceCode, 
          patches,
          context: { customVar: 'Hello from context!' }
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
        if (data.result.error) {
          showMessage('error', `Execution error: ${data.result.error}`);
        } else {
          showMessage('success', 'Code patched and executed successfully in isolated VM!');
        }
      } else {
        showMessage('error', data.error || 'Failed to execute patched code');
      }
    } catch (error) {
      showMessage('error', 'Network error while executing patched code');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patch/generate-patches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 })
      });

      const data = await response.json();
      if (data.success) {
        setPatches(data.patches);
        showMessage('success', `Generated ${data.patches.length} random patches`);
      } else {
        showMessage('error', data.error || 'Failed to generate patches');
      }
    } catch (error) {
      showMessage('error', 'Network error while generating patches');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patch/demo-code');
      const data = await response.json();
      if (data.success) {
        setSourceCode(data.demoCode);
        showMessage('success', `Loaded demo code with ${data.markers.length} Car(); markers`);
      } else {
        showMessage('error', 'Failed to load demo code');
      }
    } catch (error) {
      showMessage('error', 'Network error while loading demo code');
    } finally {
      setLoading(false);
    }
  };

  const addPatch = () => {
    setPatches([...patches, 'console.log("New patch added!");']);
  };

  const removePatch = (index: number) => {
    setPatches(patches.filter((_, i) => i !== index));
  };

  const updatePatch = (index: number, value: string) => {
    const newPatches = [...patches];
    newPatches[index] = value;
    setPatches(newPatches);
  };

  return (
    <div className="component-container">
      <h2>⚡ Car(); Patch System Demo</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Demonstrate in-memory code patching using Car(); markers. 
        Place Car(); on its own line anywhere in your code to create injection points.
      </p>

      {message && (
        <div className={`status-message status-${message.type}`}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {/* Source Code Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>📝 Source Code</h3>
            <button onClick={loadDemoCode} className="btn btn-secondary" disabled={loading}>
              📋 Load Demo
            </button>
          </div>
          <div className="form-group">
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              rows={12}
              placeholder="Enter JavaScript code with Car(); markers..."
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={findMarkers} className="btn btn-secondary" disabled={loading}>
              🔍 Find Car(); Markers
            </button>
            <button onClick={applyPatches} className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Applying...' : '🔧 Apply Patches'}
            </button>
            <button onClick={executePatched} className="btn btn-success" disabled={loading}>
              {loading ? '⏳ Executing...' : '▶️ Execute Patched'}
            </button>
          </div>
        </div>

        {/* Patches Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>🔧 Patch Code</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={generateRandomPatches} className="btn btn-secondary" disabled={loading}>
                🎲 Random
              </button>
              <button onClick={addPatch} className="btn btn-secondary">
                ➕ Add Patch
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patches.map((patch, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={patch}
                  onChange={(e) => updatePatch(index, e.target.value)}
                  placeholder="Enter patch code..."
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}
                  disabled={loading}
                />
                <button
                  onClick={() => removePatch(index)}
                  className="btn btn-danger"
                  style={{ padding: '0.5rem' }}
                  disabled={loading}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '6px', fontSize: '0.9rem' }}>
            💡 <strong>Tip:</strong> Each patch will replace a Car(); marker in order. 
            Use console.log(), variable assignments, or any valid JavaScript.
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div style={{ gridColumn: '1 / -1' }}>
            <h3>📊 Patch Results</h3>
            
            {/* Markers Found */}
            {result.patchPoints && result.patchPoints.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4>🎯 Car(); Markers Found:</h4>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px' }}>
                  {result.patchPoints.map((point, index) => (
                    <div key={index} style={{ marginBottom: '0.5rem' }}>
                      <strong>Line {point.line}:</strong> <code>{point.originalLine.trim()}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patched Code */}
            {result.patchedCode && (
              <div style={{ marginBottom: '1rem' }}>
                <h4>🔧 Patched Code:</h4>
                <pre style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  maxHeight: '300px',
                  border: '1px solid #dee2e6'
                }}>
                  {result.patchedCode}
                </pre>
              </div>
            )}

            {/* Execution Result */}
            {result.executionResult !== undefined && (
              <div style={{ marginBottom: '1rem' }}>
                <h4>▶️ Execution Result:</h4>
                <pre style={{
                  background: result.error ? '#f8d7da' : '#d4edda',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  border: result.error ? '1px solid #f5c6cb' : '1px solid #c3e6cb'
                }}>
                  {result.error || JSON.stringify(result.executionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Technical Info */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#e8f5e8', 
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#2e7d32' }}>🔧 How Car(); Patch System Works</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#2e7d32' }}>
          <li><strong>Marker Detection:</strong> Scans code for Car(); on new lines</li>
          <li><strong>In-Memory Patching:</strong> Replaces markers with patch code (never touches disk)</li>
          <li><strong>Isolated Execution:</strong> Runs patched code in secure VM context</li>
          <li><strong>Security Validation:</strong> Blocks dangerous operations (fs, child_process, etc.)</li>
          <li><strong>Dynamic Injection:</strong> Perfect for debugging, testing, or runtime modifications</li>
          <li><strong>No Side Effects:</strong> Original source files remain unchanged</li>
        </ul>
      </div>
    </div>
  );
};

export default PatchDemo;