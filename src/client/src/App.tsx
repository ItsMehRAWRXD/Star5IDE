import React, { useState } from 'react';
import TodoApp from './components/TodoApp';
import EncryptionDemo from './components/EncryptionDemo';
import PatchDemo from './components/PatchDemo';
import './App.css';

type Tab = 'todos' | 'encryption' | 'patch';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('todos');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚗 Carmilla Todo App</h1>
        <p>Encrypted Task Management with OpenSSL & Car(); Patch System</p>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'todos' ? 'active' : ''}
          onClick={() => setActiveTab('todos')}
        >
          📋 Todo List
        </button>
        <button 
          className={activeTab === 'encryption' ? 'active' : ''}
          onClick={() => setActiveTab('encryption')}
        >
          🔐 Encryption
        </button>
        <button 
          className={activeTab === 'patch' ? 'active' : ''}
          onClick={() => setActiveTab('patch')}
        >
          ⚡ Patch System
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'todos' && <TodoApp />}
        {activeTab === 'encryption' && <EncryptionDemo />}
        {activeTab === 'patch' && <PatchDemo />}
      </main>

      <footer className="app-footer">
        <p>
          Powered by Carmilla OpenSSL encryption • Car(); patch system • 
          <a href="/api/health" target="_blank" rel="noopener noreferrer">
            API Status
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;