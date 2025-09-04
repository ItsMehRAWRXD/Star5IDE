import express from "express";
import { Todo } from "../../shared/types";
import { encryptAndRepack, unpackAndDecrypt } from "../crypto/carmilla-openssl";

const router = express.Router();

// In-memory todo storage (in production, use a database)
let todos: Todo[] = [];
let nextId = 1;

/**
 * Get all todos
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    todos: todos.map(todo => ({
      ...todo,
      // Don't expose encrypted text, just indicate if it's encrypted
      text: todo.encrypted ? '[ENCRYPTED]' : todo.text
    }))
  });
});

/**
 * Create a new todo
 */
router.post('/', async (req, res) => {
  try {
    const { text, encrypt = false, passphrase } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (encrypt && !passphrase) {
      return res.status(400).json({ 
        error: 'Passphrase is required for encryption' 
      });
    }
    
    const now = new Date().toISOString();
    let finalText = text;
    let isEncrypted = false;
    
    // Encrypt if requested
    if (encrypt && passphrase) {
      try {
        finalText = await encryptAndRepack(text, passphrase, 'todo-item', {
          type: 'todo',
          created_at: now
        });
        isEncrypted = true;
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to encrypt todo',
          details: error.message
        });
      }
    }
    
    const todo: Todo = {
      id: nextId++,
      text: finalText,
      completed: false,
      encrypted: isEncrypted,
      created_at: now,
      updated_at: now
    };
    
    todos.push(todo);
    
    res.json({
      success: true,
      todo: {
        ...todo,
        text: todo.encrypted ? '[ENCRYPTED]' : todo.text
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create todo',
      details: error.message
    });
  }
});

/**
 * Update a todo
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text, completed, encrypt, passphrase } = req.body;
    
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const todo = todos[todoIndex];
    const now = new Date().toISOString();
    
    // Handle text updates
    if (text !== undefined) {
      if (encrypt && passphrase) {
        // Encrypt new text
        try {
          todo.text = await encryptAndRepack(text, passphrase, 'todo-item', {
            type: 'todo',
            updated_at: now
          });
          todo.encrypted = true;
        } catch (error) {
          return res.status(500).json({
            error: 'Failed to encrypt todo text',
            details: error.message
          });
        }
      } else {
        todo.text = text;
        todo.encrypted = false;
      }
    }
    
    // Handle completion status
    if (completed !== undefined) {
      todo.completed = completed;
    }
    
    todo.updated_at = now;
    
    res.json({
      success: true,
      todo: {
        ...todo,
        text: todo.encrypted ? '[ENCRYPTED]' : todo.text
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update todo',
      details: error.message
    });
  }
});

/**
 * Decrypt and view a todo
 */
router.post('/:id/decrypt', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    if (!todo.encrypted) {
      return res.json({
        success: true,
        todo: { ...todo, decrypted: true }
      });
    }
    
    try {
      const { data: decryptedText, meta } = await unpackAndDecrypt(todo.text, passphrase);
      
      res.json({
        success: true,
        todo: {
          ...todo,
          text: decryptedText,
          decrypted: true,
          meta
        }
      });
      
    } catch (error) {
      res.status(400).json({
        error: 'Failed to decrypt todo',
        details: error.message
      });
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to decrypt todo',
      details: error.message
    });
  }
});

/**
 * Delete a todo
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos.splice(todoIndex, 1);
  
  res.json({ success: true });
});

/**
 * Clear all todos
 */
router.delete('/', (req, res) => {
  todos = [];
  nextId = 1;
  
  res.json({ success: true });
});

/**
 * Get todo statistics
 */
router.get('/stats', (req, res) => {
  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    encrypted: todos.filter(t => t.encrypted).length,
    unencrypted: todos.filter(t => !t.encrypted).length
  };
  
  res.json({
    success: true,
    stats
  });
});

export default router;