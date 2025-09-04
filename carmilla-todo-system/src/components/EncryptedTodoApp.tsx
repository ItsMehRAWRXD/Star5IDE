/**
 * Encrypted Todo Application with Carmilla OpenSSL
 * Features:
 * - Add, remove, toggle todos
 * - Encrypt/decrypt individual todos or all todos
 * - Local storage with encryption
 * - Point-and-click area selection for encryption
 * - Detailed encryption reporting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEncryption } from '../hooks/useEncryption';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  encrypted: boolean;
  encryptedData?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface EncryptionStatus {
  todoId: number;
  status: 'encrypted' | 'decrypted' | 'failed';
  error?: string;
  timestamp: string;
}

interface TodoAppProps {
  passphrase?: string;
  autoEncrypt?: boolean;
}

export const EncryptedTodoApp: React.FC<TodoAppProps> = ({ 
  passphrase = 'default-todo-key',
  autoEncrypt = false 
}) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [encryptionReports, setEncryptionReports] = useState<EncryptionStatus[]>([]);
  const [showReports, setShowReports] = useState(false);
  const [userPassphrase, setUserPassphrase] = useState(passphrase);
  const [showPassphrase, setShowPassphrase] = useState(false);
  
  const { encrypt, decrypt, isAvailable, checkAvailability } = useEncryption();

  // Load todos from localStorage on mount
  useEffect(() => {
    const loadTodos = async () => {
      const stored = localStorage.getItem('encrypted-todos');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTodos(parsed);
        } catch (error) {
          console.error('Failed to load todos:', error);
        }
      }
    };
    
    loadTodos();
    checkAvailability();
  }, [checkAvailability]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('encrypted-todos', JSON.stringify(todos));
    }
  }, [todos]);

  // Add new todo
  const addTodo = useCallback(async () => {
    if (newTodo.trim()) {
      const now = new Date().toISOString();
      const todo: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        encrypted: false,
        createdAt: now,
        modifiedAt: now
      };
      
      // Auto-encrypt if enabled
      if (autoEncrypt && isAvailable) {
        try {
          const encrypted = await encrypt(todo.text, userPassphrase);
          todo.encrypted = true;
          todo.encryptedData = encrypted;
          todo.text = '[ENCRYPTED]';
        } catch (error) {
          console.error('Auto-encryption failed:', error);
        }
      }
      
      setTodos(prev => [...prev, todo]);
      setNewTodo('');
    }
  }, [newTodo, autoEncrypt, isAvailable, encrypt, userPassphrase]);

  // Toggle todo completion
  const toggleTodo = useCallback((id: number) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed, modifiedAt: new Date().toISOString() }
        : todo
    ));
  }, []);

  // Delete todo
  const deleteTodo = useCallback((id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    setSelectedTodos(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Toggle selection
  const toggleSelection = useCallback((id: number) => {
    setSelectedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Encrypt selected todos
  const encryptSelected = useCallback(async () => {
    if (!isAvailable) {
      alert('Encryption not available. Check backend connection.');
      return;
    }
    
    const reports: EncryptionStatus[] = [];
    const timestamp = new Date().toISOString();
    
    for (const id of selectedTodos) {
      const todo = todos.find(t => t.id === id);
      if (todo && !todo.encrypted) {
        try {
          const encrypted = await encrypt(todo.text, userPassphrase);
          
          setTodos(prev => prev.map(t => 
            t.id === id 
              ? { 
                  ...t, 
                  encrypted: true, 
                  encryptedData: encrypted,
                  text: '[ENCRYPTED]',
                  modifiedAt: timestamp
                }
              : t
          ));
          
          reports.push({
            todoId: id,
            status: 'encrypted',
            timestamp
          });
        } catch (error) {
          reports.push({
            todoId: id,
            status: 'failed',
            error: error.message,
            timestamp
          });
        }
      }
    }
    
    setEncryptionReports(prev => [...prev, ...reports]);
    setSelectedTodos(new Set());
  }, [selectedTodos, todos, isAvailable, encrypt, userPassphrase]);

  // Decrypt selected todos
  const decryptSelected = useCallback(async () => {
    if (!isAvailable) {
      alert('Decryption not available. Check backend connection.');
      return;
    }
    
    const reports: EncryptionStatus[] = [];
    const timestamp = new Date().toISOString();
    
    for (const id of selectedTodos) {
      const todo = todos.find(t => t.id === id);
      if (todo && todo.encrypted && todo.encryptedData) {
        try {
          const decrypted = await decrypt(todo.encryptedData, userPassphrase);
          
          setTodos(prev => prev.map(t => 
            t.id === id 
              ? { 
                  ...t, 
                  encrypted: false, 
                  text: decrypted,
                  encryptedData: undefined,
                  modifiedAt: timestamp
                }
              : t
          ));
          
          reports.push({
            todoId: id,
            status: 'decrypted',
            timestamp
          });
        } catch (error) {
          reports.push({
            todoId: id,
            status: 'failed',
            error: error.message,
            timestamp
          });
        }
      }
    }
    
    setEncryptionReports(prev => [...prev, ...reports]);
    setSelectedTodos(new Set());
  }, [selectedTodos, todos, isAvailable, decrypt, userPassphrase]);

  // Clear all todos
  const clearAll = useCallback(() => {
    if (confirm('Clear all todos? This cannot be undone.')) {
      setTodos([]);
      setSelectedTodos(new Set());
      localStorage.removeItem('encrypted-todos');
    }
  }, []);

  // Export todos
  const exportTodos = useCallback(() => {
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [todos]);

  return (
    <div className="encrypted-todo-app">
      <style jsx>{`
        .encrypted-todo-app {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .title {
          font-size: 2.5em;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
          color: #666;
          margin-top: 5px;
        }
        
        .encryption-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.85em;
          margin-top: 10px;
          background: ${isAvailable ? '#4caf50' : '#f44336'};
          color: white;
        }
        
        .passphrase-section {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .passphrase-input {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .passphrase-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .add-todo-section {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .add-todo-section input {
          flex: 1;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          transition: border-color 0.3s;
        }
        
        .add-todo-section input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .btn {
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 500;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        
        .btn-danger {
          background: #f44336;
          color: white;
        }
        
        .btn-success {
          background: #4caf50;
          color: white;
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 14px;
        }
        
        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .todo-list {
          list-style: none;
          padding: 0;
        }
        
        .todo-item {
          display: flex;
          align-items: center;
          padding: 15px;
          background: white;
          border: 2px solid #eee;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.3s;
        }
        
        .todo-item:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .todo-item.selected {
          background: #f0f4ff;
          border-color: #667eea;
        }
        
        .todo-item.encrypted {
          background: #fff3e0;
          border-color: #ff9800;
        }
        
        .todo-checkbox {
          width: 20px;
          height: 20px;
          margin-right: 15px;
          cursor: pointer;
        }
        
        .todo-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .todo-text {
          font-size: 16px;
          color: #333;
        }
        
        .todo-text.completed {
          text-decoration: line-through;
          color: #999;
        }
        
        .todo-text.encrypted {
          font-family: monospace;
          color: #ff9800;
        }
        
        .todo-meta {
          font-size: 12px;
          color: #999;
          margin-top: 5px;
        }
        
        .todo-actions {
          display: flex;
          gap: 10px;
        }
        
        .icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        
        .icon-btn:hover {
          transform: scale(1.1);
        }
        
        .reports {
          margin-top: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        
        .report-item {
          padding: 10px;
          margin-bottom: 10px;
          background: white;
          border-radius: 4px;
          border-left: 4px solid #667eea;
        }
        
        .report-item.failed {
          border-left-color: #f44336;
        }
        
        .report-item.success {
          border-left-color: #4caf50;
        }
        
        .stats {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          padding: 15px;
          background: #f0f0f0;
          border-radius: 8px;
        }
        
        .stat {
          flex: 1;
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      `}</style>
      
      <div className="header">
        <h1 className="title">Encrypted Todo App</h1>
        <p className="subtitle">Powered by Carmilla OpenSSL Encryption</p>
        <span className="encryption-status">
          {isAvailable ? '🔒 Encryption Available' : '⚠️ Encryption Unavailable'}
        </span>
      </div>
      
      <div className="passphrase-section">
        <div className="passphrase-input">
          <label>Encryption Passphrase:</label>
          <input
            type={showPassphrase ? 'text' : 'password'}
            value={userPassphrase}
            onChange={(e) => setUserPassphrase(e.target.value)}
            placeholder="Enter passphrase"
          />
          <button 
            className="btn btn-small btn-secondary"
            onClick={() => setShowPassphrase(!showPassphrase)}
          >
            {showPassphrase ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <div className="add-todo-section">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <button className="btn btn-primary" onClick={addTodo}>
          Add Todo
        </button>
      </div>
      
      <div className="controls">
        <button 
          className="btn btn-success btn-small"
          onClick={encryptSelected}
          disabled={selectedTodos.size === 0 || !isAvailable}
        >
          🔒 Encrypt Selected ({selectedTodos.size})
        </button>
        <button 
          className="btn btn-secondary btn-small"
          onClick={decryptSelected}
          disabled={selectedTodos.size === 0 || !isAvailable}
        >
          🔓 Decrypt Selected ({selectedTodos.size})
        </button>
        <button 
          className="btn btn-secondary btn-small"
          onClick={() => setShowReports(!showReports)}
        >
          📊 {showReports ? 'Hide' : 'Show'} Reports
        </button>
        <button 
          className="btn btn-secondary btn-small"
          onClick={exportTodos}
          disabled={todos.length === 0}
        >
          💾 Export
        </button>
        <button 
          className="btn btn-danger btn-small"
          onClick={clearAll}
          disabled={todos.length === 0}
        >
          🗑️ Clear All
        </button>
      </div>
      
      <ul className="todo-list">
        {todos.map(todo => (
          <li 
            key={todo.id} 
            className={`todo-item ${selectedTodos.has(todo.id) ? 'selected' : ''} ${todo.encrypted ? 'encrypted' : ''}`}
          >
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={selectedTodos.has(todo.id)}
              onChange={() => toggleSelection(todo.id)}
            />
            <div className="todo-content">
              <span 
                className={`todo-text ${todo.completed ? 'completed' : ''} ${todo.encrypted ? 'encrypted' : ''}`}
                onClick={() => toggleTodo(todo.id)}
                style={{ cursor: 'pointer' }}
              >
                {todo.text}
              </span>
              <span className="todo-meta">
                Created: {new Date(todo.createdAt).toLocaleString()} | 
                Modified: {new Date(todo.modifiedAt).toLocaleString()}
                {todo.encrypted && ' | 🔒 Encrypted'}
              </span>
            </div>
            <div className="todo-actions">
              <button 
                className="icon-btn"
                style={{ background: '#f44336', color: 'white' }}
                onClick={() => deleteTodo(todo.id)}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      {todos.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
          No todos yet. Add one above to get started!
        </p>
      )}
      
      <div className="stats">
        <div className="stat">
          <div className="stat-value">{todos.length}</div>
          <div className="stat-label">Total Todos</div>
        </div>
        <div className="stat">
          <div className="stat-value">{todos.filter(t => t.completed).length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat">
          <div className="stat-value">{todos.filter(t => t.encrypted).length}</div>
          <div className="stat-label">Encrypted</div>
        </div>
      </div>
      
      {showReports && encryptionReports.length > 0 && (
        <div className="reports">
          <h3>Encryption Reports</h3>
          {encryptionReports.slice(-10).reverse().map((report, index) => (
            <div 
              key={index} 
              className={`report-item ${report.status === 'failed' ? 'failed' : 'success'}`}
            >
              <strong>Todo #{report.todoId}</strong> - 
              Status: {report.status} - 
              Time: {new Date(report.timestamp).toLocaleTimeString()}
              {report.error && <div style={{ color: 'red' }}>Error: {report.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};