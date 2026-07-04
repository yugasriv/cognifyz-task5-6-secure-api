// server.js
// Task 5: RESTful API + Front-End Interaction
// Task 6: Database Integration + User Authentication

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite'); // Node's built-in SQLite (Node 22+)
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'cognifyz-secret-key-change-in-production'; // for real deployment, use env var

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- DATABASE SETUP (Task 6.1: Integrate a database) ----------
const db = new DatabaseSync(path.join(__dirname, 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );
`);

// ---------- AUTH MIDDLEWARE (Task 6.2 + 6.3: Auth + secure endpoints) ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ---------- AUTH ROUTES ----------
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hashed);
    const token = jwt.sign({ id: Number(result.lastInsertRowid), username }, JWT_SECRET, { expiresIn: '2h' });
    res.status(201).json({ message: 'User registered', token, username });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ message: 'Login successful', token, username: user.username });
});

// ---------- CRUD API (Task 5.1: RESTful endpoints, Task 6.3: secured) ----------

// CREATE
app.post('/api/items', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const stmt = db.prepare('INSERT INTO items (title, description, owner_id) VALUES (?, ?, ?)');
  const result = stmt.run(title, description || '', req.user.id);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(item);
});

// READ ALL (only items belonging to logged-in user)
app.get('/api/items', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM items WHERE owner_id = ? ORDER BY id DESC').all(req.user.id);
  res.json(rows);
});

// READ ONE
app.get('/api/items/:id', authenticateToken, (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// UPDATE
app.put('/api/items/:id', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  const existing = db.prepare('SELECT * FROM items WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  db.prepare('UPDATE items SET title = ?, description = ? WHERE id = ?')
    .run(title ?? existing.title, description ?? existing.description, req.params.id);
  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Item deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
