const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const dbFile = path.join(__dirname, 'db.json');
let db = { tasks: [], collaborators: [] };

function loadDB() {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    db = JSON.parse(data);
  } catch (err) {
    db = { tasks: [], collaborators: [] };
  }
}

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

loadDB();

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.collaborators.find(
    (c) => c.username === username && c.password === password
  );
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/tasks', (req, res) => {
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = req.body;
  if (db.tasks.some((t) => t.id === newTask.id || t.title === newTask.title)) {
    return res.status(400).json({ error: 'Task already exists' });
  }
  newTask.id = newTask.id || Date.now().toString();
  db.tasks.push(newTask);
  saveDB();
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const task = db.tasks.find((t) => t.id == id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (updates.status !== undefined) task.status = updates.status;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
  saveDB();
  res.json(task);
});

app.get('/api/export/csv', (req, res) => {
  const tasksParser = new Parser();
  const collaboratorsParser = new Parser();
  const tasksCsv = tasksParser.parse(db.tasks);
  const collaboratorsCsv = collaboratorsParser.parse(db.collaborators);
  res.header('Content-Type', 'text/csv');
  res.send(`# Tasks\n${tasksCsv}\n\n# Collaborators\n${collaboratorsCsv}\n`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

