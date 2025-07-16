const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { Parser } = require('json2csv');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ tasks: [], collaborators: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.collaborators.find(u => u.username === username && u.password === password);
  res.json({ success: !!user });
});

app.get('/api/tasks', (req, res) => {
  const db = readDB();
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = req.body;
  const db = readDB();
  if (db.tasks.find(t => t.title === newTask.title)) {
    return res.status(400).json({ error: 'Task already exists' });
  }
  const nextId = db.tasks.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
  newTask.id = nextId;
  db.tasks.push(newTask);
  writeDB(db);
  res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const updates = req.body;
  const db = readDB();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  Object.assign(task, updates);
  writeDB(db);
  res.json(task);
});

app.get('/api/export/csv', (req, res) => {
  const db = readDB();
  const taskParser = new Parser();
  const collabParser = new Parser();
  const tasksCsv = taskParser.parse(db.tasks);
  const collabCsv = collabParser.parse(db.collaborators);
  const combined = `Tasks\n${tasksCsv}\n\nCollaborators\n${collabCsv}\n`;
  res.setHeader('Content-Disposition', 'attachment; filename="backup.csv"');
  res.type('text/csv');
  res.send(combined);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
