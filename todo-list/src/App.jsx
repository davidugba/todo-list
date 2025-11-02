import React, { useState, useEffect, useRef } from 'react';
import './App.css';


function App() {
  // 1. Persistence with localStorage
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  // Due date
  const [dueDate, setDueDate] = useState('');
  // Filter state
  const [filter, setFilter] = useState('all');
  // Edit state
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef(null);


  // 1. Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Add a new todo
  // Add a new todo with due date
  const addTodo = () => {
    if (inputValue.trim() !== '') {
      setTodos([
        ...todos,
        {
          text: inputValue,
          completed: false,
          dueDate: dueDate || null,
          id: Date.now(),
        },
      ]);
      setInputValue('');
      setDueDate('');
    }
  };


  // Toggle todo completion
  const toggleTodo = (index) => {
    const newTodos = [...todos];
    newTodos[index].completed = !newTodos[index].completed;
    setTodos(newTodos);
  };


  // Delete a todo
  const deleteTodo = (index) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
  };

  // Edit a todo
  const startEdit = (index) => {
    setEditIndex(index);
    setEditValue(todos[index].text);
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const saveEdit = (index) => {
    if (editValue.trim() !== '') {
      const newTodos = [...todos];
      newTodos[index].text = editValue;
      setTodos(newTodos);
      setEditIndex(null);
      setEditValue('');
    }
  };

  // Reminders: alert if a todo is due in the next minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      todos.forEach((todo) => {
        if (
          todo.dueDate &&
          !todo.completed &&
          !todo.reminded &&
          new Date(todo.dueDate) - now < 60000 &&
          new Date(todo.dueDate) - now > 0
        ) {
          alert(`Reminder: "${todo.text}" is due soon!`);
          todo.reminded = true;
          setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, reminded: true } : t)));
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [todos]);

  const cancelEdit = () => {
    setEditIndex(null);
    setEditValue('');
  };

  useEffect(() => {
    if (editIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editIndex]);

  // Filtered todos
  const getFilteredTodos = () => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  };

  // Bulk actions
  const clearCompleted = () => setTodos(todos.filter((t) => !t.completed));
  const markAllDone = () => setTodos(todos.map((t) => ({ ...t, completed: true })));

  // Drag and drop reordering
  const dragItem = useRef();
  const dragOverItem = useRef();
  const handleDragStart = (index) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    const items = [...getFilteredTodos()];
    const dragged = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    // Map back to original todos order
    const newOrder = [];
    items.forEach((item) => {
      const orig = todos.find((t) => t.id === item.id);
      if (orig) newOrder.push(orig);
    });
    setTodos(newOrder);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Accessibility: aria-labels, keyboard support, focus management
  return (
    <div className="container">
      <h1 className="header">Todo List</h1>
      <div className="inputContainer">
        <input
          className="input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new task"
          aria-label="Add a new task"
          onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }}
        />
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date"
          style={{ marginLeft: 8 }}
        />
        <button className="addButton" onClick={addTodo} aria-label="Add todo">Add</button>
      </div>
      {/* 3. Filters */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '10px 0' }}>
        <button
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}
        >All</button>
        <button
          onClick={() => setFilter('active')}
          aria-pressed={filter === 'active'}
          style={{ fontWeight: filter === 'active' ? 'bold' : 'normal' }}
        >Active</button>
        <button
          onClick={() => setFilter('completed')}
          aria-pressed={filter === 'completed'}
          style={{ fontWeight: filter === 'completed' ? 'bold' : 'normal' }}
        >Completed</button>
      </div>
      {/* 5. Bulk actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '10px 0' }}>
        <button onClick={clearCompleted} aria-label="Clear completed todos">Clear Completed</button>
        <button onClick={markAllDone} aria-label="Mark all as done">Mark All Done</button>
      </div>
      <ul className="list">
        {getFilteredTodos().map((todo, index) => (
          <li
            key={todo.id}
            className="listItem"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            style={{
              transition: 'background 0.3s, box-shadow 0.3s',
              background: todo.completed ? '#e6ffe6' : 'white',
              boxShadow: todo.completed ? '0 1px 6px rgba(40, 167, 69, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {editIndex === todos.indexOf(todo) ? (
              <>
                <input
                  ref={editInputRef}
                  className="input"
                  value={editValue}
                  onChange={handleEditChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(editIndex);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  aria-label="Edit todo"
                  style={{ marginBottom: 6 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => saveEdit(editIndex)} aria-label="Save edit">Save</button>
                  <button onClick={cancelEdit} aria-label="Cancel edit">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <span
                  className="todoText"
                  style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    outline: 'none',
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={todo.completed}
                  aria-label={todo.completed ? `Mark ${todo.text} as not completed` : `Mark ${todo.text} as completed`}
                  onClick={() => toggleTodo(todos.indexOf(todo))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleTodo(todos.indexOf(todo));
                  }}
                >
                  {todo.text}
                  {todo.dueDate && (
                    <span style={{ display: 'block', fontSize: '0.8em', color: '#888' }}>
                      Due: {new Date(todo.dueDate).toLocaleString()}
                    </span>
                  )}
                </span>
                <button
                  className="deleteButton"
                  onClick={() => deleteTodo(todos.indexOf(todo))}
                  aria-label={`Delete ${todo.text}`}
                >
                  Delete
                </button>
                <button
                  onClick={() => startEdit(todos.indexOf(todo))}
                  aria-label={`Edit ${todo.text}`}
                  style={{ marginLeft: 6 }}
                >
                  Edit
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;