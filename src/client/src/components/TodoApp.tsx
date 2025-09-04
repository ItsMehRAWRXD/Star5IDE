import React, { useState, useEffect } from 'react';
import { Todo } from '../../../shared/types';

interface TodoAppProps {}

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  encrypted: number;
  unencrypted: number;
}

const TodoApp: React.FC<TodoAppProps> = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [encryptNew, setEncryptNew] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load todos and stats on component mount
  useEffect(() => {
    loadTodos();
    loadStats();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      if (data.success) {
        setTodos(data.todos);
      }
    } catch (error) {
      showMessage('error', 'Failed to load todos');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/todos/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    if (encryptNew && !passphrase) {
      showMessage('error', 'Passphrase is required for encryption');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newTodoText,
          encrypt: encryptNew,
          passphrase: encryptNew ? passphrase : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setTodos([...todos, data.todo]);
        setNewTodoText('');
        setPassphrase('');
        loadStats();
        showMessage('success', `Todo ${encryptNew ? 'encrypted and ' : ''}added successfully`);
      } else {
        showMessage('error', data.error || 'Failed to add todo');
      }
    } catch (error) {
      showMessage('error', 'Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });

      const data = await response.json();
      if (data.success) {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        loadStats();
      }
    } catch (error) {
      showMessage('error', 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setTodos(todos.filter(t => t.id !== id));
        loadStats();
        showMessage('success', 'Todo deleted');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete todo');
    }
  };

  const decryptTodo = async (id: number) => {
    if (!decryptPassphrase) {
      showMessage('error', 'Passphrase is required for decryption');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/todos/${id}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: decryptPassphrase })
      });

      const data = await response.json();
      if (data.success) {
        // Update the todo in the list with decrypted text
        setTodos(todos.map(t => t.id === id ? { ...data.todo, decrypted: true } : t));
        setDecryptPassphrase('');
        showMessage('success', 'Todo decrypted successfully');
      } else {
        showMessage('error', data.error || 'Failed to decrypt todo');
      }
    } catch (error) {
      showMessage('error', 'Failed to decrypt todo');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTodos = async () => {
    if (!confirm('Are you sure you want to delete all todos?')) return;

    try {
      const response = await fetch('/api/todos', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setTodos([]);
        loadStats();
        showMessage('success', 'All todos cleared');
      }
    } catch (error) {
      showMessage('error', 'Failed to clear todos');
    }
  };

  return (
    <div className="component-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>📋 Todo List with Encryption</h2>
        {stats && (
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <span>📝 Total: {stats.total}</span>
            <span>✅ Done: {stats.completed}</span>
            <span>⏳ Pending: {stats.pending}</span>
            <span>🔐 Encrypted: {stats.encrypted}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`status-message status-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Add Todo Form */}
      <form onSubmit={addTodo} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <div className="form-group">
          <label htmlFor="newTodo">New Todo:</label>
          <input
            id="newTodo"
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Enter your todo..."
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={encryptNew}
              onChange={(e) => setEncryptNew(e.target.checked)}
              disabled={loading}
            />
            🔐 Encrypt this todo
          </label>
        </div>

        {encryptNew && (
          <div className="form-group">
            <label htmlFor="passphrase">Encryption Passphrase:</label>
            <input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase for encryption..."
              disabled={loading}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading || !newTodoText.trim()}>
            {loading ? '⏳ Adding...' : '➕ Add Todo'}
          </button>
          {todos.length > 0 && (
            <button type="button" className="btn btn-danger" onClick={clearAllTodos}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </form>

      {/* Decrypt Form */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="decryptPassphrase">Decrypt Passphrase:</label>
            <input
              id="decryptPassphrase"
              type="password"
              value={decryptPassphrase}
              onChange={(e) => setDecryptPassphrase(e.target.value)}
              placeholder="Enter passphrase to decrypt todos..."
              disabled={loading}
            />
          </div>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#856404' }}>
          💡 Click the 🔓 button next to encrypted todos to decrypt them with this passphrase.
        </p>
      </div>

      {/* Todo List */}
      <div className="todo-list">
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📝 No todos yet!</p>
            <p>Add your first todo above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: todo.completed ? '#f8f9fa' : 'white',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  opacity: todo.completed ? 0.7 : 1
                }}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  {todo.completed ? '✅' : '⭕'}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ 
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    fontWeight: todo.encrypted ? 'bold' : 'normal',
                    color: todo.encrypted ? '#6f42c1' : 'inherit'
                  }}>
                    {todo.text}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    {todo.encrypted && '🔐 Encrypted'} • 
                    Created: {new Date(todo.created_at).toLocaleString()}
                    {todo.updated_at !== todo.created_at && (
                      <> • Updated: {new Date(todo.updated_at).toLocaleString()}</>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {todo.encrypted && (
                    <button
                      onClick={() => decryptTodo(todo.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      disabled={loading || !decryptPassphrase}
                      title="Decrypt this todo"
                    >
                      🔓
                    </button>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    title="Delete this todo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Storage Info */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px', fontSize: '0.9rem' }}>
        <p style={{ margin: 0, color: '#1565c0' }}>
          💾 <strong>Storage:</strong> Todos are stored in server memory (restart to clear). 
          Encrypted todos use Carmilla OpenSSL encryption with unique salt/IV per todo.
        </p>
      </div>
    </div>
  );
};

export default TodoApp;