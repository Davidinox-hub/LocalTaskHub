async function loginUser(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) {
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('loginError').textContent = 'Invalid credentials';
  }
}

async function loadTasks() {
  const res = await fetch('/api/tasks');
  const tasks = await res.json();
  displayTasks(tasks);
}

function displayTasks(tasks) {
  const tbody = document.querySelector('#taskTable tbody');
  tbody.innerHTML = '';
  const statusFilter = document.getElementById('filterStatus').value;
  const priorityFilter = document.getElementById('filterPriority').value;
  tasks
    .filter(t => !statusFilter || t.status === statusFilter)
    .filter(t => !priorityFilter || t.priority === priorityFilter)
    .forEach(task => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${task.title}</td>
        <td>${task.description || ''}</td>
        <td>${task.dueDate || ''}</td>
        <td>${task.status || ''}</td>
        <td>${task.priority || ''}</td>
        <td>${task.assignedTo || ''}</td>
        <td><button onclick="editTask(${task.id})">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });
}

async function addTask(event) {
  event.preventDefault();
  const task = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    assignedTo: document.getElementById('assignedTo').value
  };
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (res.ok) {
    document.getElementById('taskForm').reset();
    loadTasks();
  } else {
    alert('Task with this title already exists');
  }
}

async function editTask(id) {
  const status = prompt('Status (Todo, In Progress, Completed)');
  const dueDate = prompt('Due Date (YYYY-MM-DD)');
  const priority = prompt('Priority (High, Medium, Low)');
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, dueDate, priority })
  });
  loadTasks();
}

async function exportCsv() {
  const res = await fetch('/api/export/csv');
  const text = await res.text();
  const blob = new Blob([text], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'backup.csv';
  link.click();
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', loginUser);
  }
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    document.getElementById('exportBtn').addEventListener('click', exportCsv);
    document.getElementById('filterStatus').addEventListener('change', loadTasks);
    document.getElementById('filterPriority').addEventListener('change', loadTasks);
    taskForm.addEventListener('submit', addTask);
    loadTasks();
  }
});
