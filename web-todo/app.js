(() => {
  const storageKey = 'web_todo_items_v2';
  /** @typedef {{ id:string, text:string, completed:boolean, createdAt:number, updatedAt:number, category:string, priority:string, dueDate:string }} Todo */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const form = $('#todo-form');
  const input = $('#todo-input');
  const list = $('#todo-list');
  const count = $('#count');
  const hideCompleted = $('#toggle-completed');
  const clearCompletedBtn = $('#clear-completed');
  const categorySelect = $('#category-select');
  const prioritySelect = $('#priority-select');
  const dueDateInput = $('#due-date');
  const searchInput = $('#search-input');
  const filterCategory = $('#filter-category');
  const filterPriority = $('#filter-priority');
  const exportBtn = $('#export-btn');
  const importBtn = $('#import-btn');
  const importFile = $('#import-file');
  const themeToggle = $('#theme-toggle');
  const helpModal = $('#help-modal');
  const closeHelp = $('#close-help');
  
  let draggedItem = null;
  let draggedIndex = null;

  function loadTodos() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(Boolean);
    } catch {
      return [];
    }
  }

  /** @param {Todo[]} todos */
  function saveTodos(todos) {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }

  /** @returns {Todo[]} */
  function getTodos() {
    return loadTodos();
  }

  /** @param {Partial<Todo>} patch */
  function createTodo(patch) {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      text: '',
      completed: false,
      createdAt: now,
      updatedAt: now,
      category: '',
      priority: 'medium',
      dueDate: '',
      ...patch,
    };
  }

  function render() {
    const todos = getTodos();
    let filtered = todos;
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(t => t.text.toLowerCase().includes(searchTerm));
    }
    
    // Apply category filter
    const categoryFilter = filterCategory.value;
    if (categoryFilter) {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // Apply priority filter
    const priorityFilter = filterPriority.value;
    if (priorityFilter) {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    // Apply completed filter
    if (hideCompleted.checked) {
      filtered = filtered.filter(t => !t.completed);
    }
    
    // Sort by priority and due date
    filtered.sort((a, b) => {
      // Priority order: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    });
    
    list.innerHTML = '';
    filtered.forEach((todo, index) => {
      const item = renderItem(todo);
      item.dataset.index = index;
      list.appendChild(item);
    });
    const remaining = todos.filter(t => !t.completed).length;
    count.textContent = `${remaining} item${remaining === 1 ? '' : 's'} left`;
  }

  /** @param {Todo} todo */
  function renderItem(todo) {
    const li = document.createElement('li');
    li.className = 'item' + (todo.completed ? ' completed' : '') + ' priority-' + todo.priority;
    li.dataset.id = todo.id;
    li.draggable = true;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.ariaLabel = 'Toggle completed';

    const content = document.createElement('div');
    content.className = 'content';
    
    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = todo.text;
    text.contentEditable = 'true';
    text.role = 'textbox';
    text.ariaLabel = 'Edit task';
    
    const meta = document.createElement('div');
    meta.className = 'meta';
    
    if (todo.category) {
      const category = document.createElement('span');
      category.className = 'category';
      category.textContent = todo.category;
      meta.appendChild(category);
    }
    
    if (todo.priority && todo.priority !== 'medium') {
      const priority = document.createElement('span');
      priority.className = 'priority';
      priority.textContent = todo.priority;
      meta.appendChild(priority);
    }
    
    if (todo.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = 'due-date';
      const date = new Date(todo.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateTime = new Date(todo.dueDate);
      dueDateTime.setHours(0, 0, 0, 0);
      
      if (dueDateTime < today) {
        dueDate.classList.add('overdue');
      } else if (dueDateTime.getTime() === today.getTime()) {
        dueDate.classList.add('today');
      }
      
      dueDate.textContent = date.toLocaleDateString();
      meta.appendChild(dueDate);
    }
    
    content.appendChild(text);
    if (meta.children.length > 0) {
      content.appendChild(meta);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = 'Delete';

    actions.appendChild(delBtn);
    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    checkbox.addEventListener('change', () => updateTodo(todo.id, { completed: checkbox.checked }));
    delBtn.addEventListener('click', () => removeTodo(todo.id));

    let saveTimeout;
    text.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => updateTodo(todo.id, { text: text.textContent || '' }), 300);
    });

    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        text.blur();
      }
    });

    // Drag and drop events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    return li;
  }

  /** @param {string} id @param {Partial<Todo>} patch */
  function updateTodo(id, patch) {
    const todos = getTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return;
    todos[idx] = { ...todos[idx], ...patch, updatedAt: Date.now() };
    saveTodos(todos);
    render();
  }

  function addTodoFromInput() {
    const text = (input.value || '').trim();
    if (!text) return;
    const todos = getTodos();
    todos.unshift(createTodo({ 
      text,
      category: categorySelect.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value
    }));
    saveTodos(todos);
    input.value = '';
    categorySelect.value = '';
    prioritySelect.value = 'medium';
    dueDateInput.value = '';
    render();
  }

  /** @param {string} id */
  function removeTodo(id) {
    const todos = getTodos().filter(t => t.id !== id);
    saveTodos(todos);
    render();
  }

  function clearCompleted() {
    const todos = getTodos().filter(t => !t.completed);
    saveTodos(todos);
    render();
  }

  // Drag and drop handlers
  function handleDragStart(e) {
    draggedItem = e.target;
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  function handleDragEnter(e) {
    if (e.target.classList.contains('item')) {
      e.target.classList.add('drag-over');
    }
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragLeave(e) {
    if (e.target.classList.contains('item')) {
      e.target.classList.remove('drag-over');
    }
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (draggedItem !== e.target && e.target.classList.contains('item')) {
      const targetIndex = parseInt(e.target.dataset.index);
      const todos = getTodos();
      const filtered = hideCompleted.checked ? todos.filter(t => !t.completed) : todos;
      
      // Reorder the filtered array
      const [movedItem] = filtered.splice(draggedIndex, 1);
      filtered.splice(targetIndex, 0, movedItem);
      
      // Update the full todos array
      if (hideCompleted.checked) {
        // Rebuild the full array with the new order
        const completedTodos = todos.filter(t => t.completed);
        saveTodos([...filtered, ...completedTodos]);
      } else {
        saveTodos(filtered);
      }
      
      render();
    }
    
    return false;
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    $$('.drag-over').forEach(item => item.classList.remove('drag-over'));
    draggedItem = null;
    draggedIndex = null;
  }

  // Export/Import functions
  function exportTodos() {
    const todos = getTodos();
    const dataStr = JSON.stringify(todos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `todos-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  function importTodos(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const todos = JSON.parse(e.target.result);
        if (Array.isArray(todos)) {
          saveTodos(todos);
          render();
          alert('Todos imported successfully!');
        } else {
          alert('Invalid file format');
        }
      } catch (err) {
        alert('Error importing file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
  
  // Events
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodoFromInput();
  });
  hideCompleted.addEventListener('change', render);
  clearCompletedBtn.addEventListener('click', clearCompleted);
  searchInput.addEventListener('input', render);
  filterCategory.addEventListener('change', render);
  filterPriority.addEventListener('change', render);
  exportBtn.addEventListener('click', exportTodos);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importTodos(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    // Ctrl/Cmd + N to focus new todo input
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      input.focus();
    }
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportTodos();
    }
    // Ctrl/Cmd + I to import
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      importFile.click();
    }
    // Escape to clear search or close modal
    if (e.key === 'Escape') {
      if (helpModal.style.display === 'flex') {
        helpModal.style.display = 'none';
      } else if (document.activeElement === searchInput) {
        searchInput.value = '';
        render();
      }
    }
    // Ctrl/Cmd + ? to show help
    if ((e.ctrlKey || e.metaKey) && e.key === '?') {
      e.preventDefault();
      helpModal.style.display = 'flex';
    }
  });

  // Help modal
  closeHelp.addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
  
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.style.display = 'none';
    }
  });

  // Theme management
  function loadTheme() {
    const theme = localStorage.getItem('todo_theme') || 'dark';
    document.body.className = theme === 'light' ? 'light-theme' : '';
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    document.body.className = isLight ? '' : 'light-theme';
    localStorage.setItem('todo_theme', isLight ? 'dark' : 'light');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
  }

  themeToggle.addEventListener('click', toggleTheme);

  // Init
  loadTheme();
  render();
})();

