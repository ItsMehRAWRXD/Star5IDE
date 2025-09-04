import React from 'react';
import { EncryptedTodoApp } from './components/EncryptedTodoApp';

function App() {
  return (
    <div className="app">
      <EncryptedTodoApp 
        passphrase="my-secure-todo-key"
        autoEncrypt={false}
      />
    </div>
  );
}

export default App;