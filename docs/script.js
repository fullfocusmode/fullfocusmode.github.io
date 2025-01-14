// Global Variables
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
let webViewers = JSON.parse(localStorage.getItem('webViewers')) || [];
let timerInterval;
let timeLeft;

// Sidebar Toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Task Management
function openAddTaskModal() {
    openModal('addTaskModal');
}

function addTask(event) {
    event.preventDefault();
    const task = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        startDate: document.getElementById('startDate').value,
        startTime: document.getElementById('startTime').value,
        endDate: document.getElementById('endDate').value,
        endTime: document.getElementById('endTime').value,
        description: document.getElementById('taskDescription').value,
        links: document.getElementById('taskLinks').value.split(',').map(link => link.trim()),
        priority: document.getElementById('taskPriority').value,
        labels: document.getElementById('taskLabels').value.split(',').map(label => label.trim())
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    closeModal('addTaskModal');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const categorized = document.getElementById('categorizedTasks');
    const uncategorized = document.getElementById('uncategorizedTasks');
    
    if (!categorized || !uncategorized) return;

    categorized.innerHTML = '';
    uncategorized.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        if (task.startDate || task.endDate) {
            categorized.appendChild(taskElement);
        } else {
            uncategorized.appendChild(taskElement);
        }
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.innerHTML = `
        <h3>${task.name}</h3>
        <p>${task.description}</p>
        ${task.startDate ? `<p>Start: ${task.startDate} ${task.startTime}</p>` : ''}
        ${task.endDate ? `<p>End: ${task.endDate} ${task.endTime}</p>` : ''}
        <div class="task-labels">
            ${task.labels.map(label => `<span class="label">${label}</span>`).join('')}
        </div>
        <div class="task-priority ${task.priority}">${task.priority}</div>
        <button onclick="deleteTask(${task.id})">Delete</button>
    `;
    return div;
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Notes Management
function openAddNoteModal() {
    openModal('addNoteModal');
}

function addNote(event) {
    event.preventDefault();
    const note = {
        id: Date.now(),
        title: document.getElementById('noteTitle').value,
        description: document.getElementById('noteDescription').value
    };

    notes.push(note);
    saveNotes();
    renderNotes();
    closeModal('addNoteModal');
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotes() {
    const notesGrid = document.getElementById('notesGrid');
    if (!notesGrid) return;

    notesGrid.innerHTML = '';
    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesGrid.appendChild(noteElement);
    });
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.description}</p>
        <button onclick="deleteNote(${note.id})">Delete</button>
    `;
    return div;
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

// Timer Functions
function startTimer() {
    if (!timerInterval) {
        const minutes = parseInt(document.getElementById('minutes').textContent);
        const seconds = parseInt(document.getElementById('seconds').textContent);
        timeLeft = minutes * 60 + seconds;
        
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                alert('Timer finished!');
                return;
            }
            
            timeLeft--;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 25 * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

function setCustomTime() {
    const minutes = parseInt(document.getElementById('customMinutes').value);
    if (minutes > 0 && minutes <= 60) {
        timeLeft = minutes * 60;
        updateTimerDisplay();
    }
}

// Quick Links Management
function addQuickLink() {
    const title = prompt('Enter link title:');
    const url = prompt('Enter URL:');
    if (title && url) {
        quickLinks.push({ title, url });
        saveQuickLinks();
        renderQuickLinks();
    }
}

function saveQuickLinks() {
    localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
}

function renderQuickLinks() {
    const container = document.getElementById('quickLinksContainer');
    if (!container) return;

    container.innerHTML = '';
    quickLinks.forEach(link => {
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.target = '_blank';
        linkElement.textContent = link.title;
        container.appendChild(linkElement);
    });
}

// Web Viewer Management
function addWebViewer() {
    const title = prompt('Enter embed title:');
    const url = prompt('Enter embed URL:');
    if (title && url) {
        webViewers.push({ title, url });
        saveWebViewers();
        renderWebViewers();
    }
}

function saveWebViewers() {
    localStorage.setItem('webViewers', JSON.stringify(webViewers));
}

function renderWebViewers() {
    const container = document.getElementById('webViewerContainer');
    if (!container) return;

    container.innerHTML = '';
    webViewers.forEach(viewer => {
        const button = document.createElement('button');
        button.textContent = viewer.title;
        button.onclick = () => showEmbed(viewer.url);
        container.appendChild(button);
    });
}

function showEmbed(url) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <iframe src="${url}" width="100%" height="500px"></iframe>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Settings Functions
function openSettings() {
    openModal('settingsModal');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function exportData() {
    const data = {
        tasks,
        notes,
        quickLinks,
        webViewers
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fullfocus-data.json';
    a.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        tasks = data.tasks || [];
        notes = data.notes || [];
        quickLinks = data.quickLinks || [];
        webViewers = data.webViewers || [];
        saveTasks();
        saveNotes();
        saveQuickLinks();
        saveWebViewers();
        location.reload();
    };
    input.click();
}

function clearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    renderNotes();
    renderQuickLinks();
    renderWebViewers();
    
    // Initialize dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    // Add event listeners
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', addTask);
    }
    
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', addNote);
    }
});

// Time toggle functions
function toggleTimeInput(type) {
    const timeInput = document.getElementById(`${type}Time`);
    const toggle = document.getElementById(`${type}TimeToggle`);
    timeInput.disabled = !toggle.checked;
}
