// Global Variables and State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
let webViewers = JSON.parse(localStorage.getItem('webViewers')) || [];
let currentMonth = new Date();
let timerInterval;
let timeLeft;

// Loading Screen
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
        initializeApp();
    }, 1000);
});

function initializeApp() {
    renderTasks();
    renderNotes();
    renderQuickLinks();
    renderWebViewers();
    renderCalendar();
    initializeTheme();
    attachEventListeners();
}

// Theme Management
function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    if (document.getElementById('darkModeToggle')) {
        document.getElementById('darkModeToggle').checked = darkMode;
    }
}

function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', !isDark);
}

// Sidebar Management
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.style.opacity = '1', 0);
    } else {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 300);
}

// Task Management
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.innerHTML = `
        <div class="task-header">
            <h3>${task.name}</h3>
            <span class="priority-badge ${task.priority}">${task.priority}</span>
        </div>
        <p class="task-description">${task.description || 'No description'}</p>
        ${task.startDate ? `
            <div class="task-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(task.startDate)}
                ${task.startTime ? formatTime(task.startTime) : ''}
            </div>
        ` : ''}
        ${task.endDate ? `
            <div class="task-date">
                <i class="fas fa-calendar-check"></i>
                ${formatDate(task.endDate)}
                ${task.endTime ? formatTime(task.endTime) : ''}
            </div>
        ` : ''}
        <div class="task-labels">
            ${task.labels.map(label => `
                <span class="label">${label}</span>
            `).join('')}
        </div>
        <div class="task-actions">
            <button onclick="editTask(${task.id})" class="btn-icon">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTask(${task.id})" class="btn-icon btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add animation class
    div.classList.add('fade-in');
    return div;
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
        labels: document.getElementById('taskLabels').value.split(',').map(label => label.trim()),
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    closeModal('addTaskModal');
    showNotification('Task added successfully!');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Populate modal with task data
    document.getElementById('taskName').value = task.name;
    document.getElementById('startDate').value = task.startDate;
    document.getElementById('startTime').value = task.startTime;
    document.getElementById('endDate').value = task.endDate;
    document.getElementById('endTime').value = task.endTime;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskLinks').value = task.links.join(', ');
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskLabels').value = task.labels.join(', ');

    // Show modal with edit mode
    openModal('addTaskModal');
    document.getElementById('taskForm').setAttribute('data-edit-id', id);
}

function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    showNotification('Task deleted successfully!');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCalendar(); // Update calendar when tasks change
}

function renderTasks() {
    const categorized = document.getElementById('categorizedTasks');
    const uncategorized = document.getElementById('uncategorizedTasks');
    
    if (!categorized || !uncategorized) return;

    categorized.innerHTML = '';
    uncategorized.innerHTML = '';

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
    });

    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        if (task.startDate || task.endDate) {
            categorized.appendChild(taskElement);
        } else {
            uncategorized.appendChild(taskElement);
        }
    });

    // Update task counts
    document.getElementById('categorizedCount').textContent = 
        sortedTasks.filter(task => task.startDate || task.endDate).length;
    document.getElementById('uncategorizedCount').textContent = 
        sortedTasks.filter(task => !task.startDate && !task.endDate).length;
}

// Calendar Management
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    document.getElementById('currentMonth').textContent = 
        `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;

    calendar.innerHTML = `
        <div class="calendar-header-row">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                .map(day => `<div class="calendar-cell header">${day}</div>`)
                .join('')}
        </div>
    `;

    let currentDate = new Date(firstDay);
    currentDate.setDate(currentDate.getDate() - firstDay.getDay());

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
        const dateCell = document.createElement('div');
        dateCell.className = 'calendar-cell';
        
        if (currentDate.getMonth() === month) {
            dateCell.classList.add('current-month');
        }
        
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.startDate);
            return taskDate.getDate() === currentDate.getDate() &&
                   taskDate.getMonth() === currentDate.getMonth() &&
                   taskDate.getFullYear() === currentDate.getFullYear();
        });

        dateCell.innerHTML = `
            <span class="date-number">${currentDate.getDate()}</span>
            ${dayTasks.length > 0 ? `
                <div class="task-indicator">
                    <span class="task-count">${dayTasks.length}</span>
                </div>
            ` : ''}
        `;

        if (dayTasks.length > 0) {
            dateCell.addEventListener('click', () => showDayTasks(dayTasks));
        }

        calendar.appendChild(dateCell);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function showDayTasks(tasks) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Tasks for ${tasks[0].startDate}</h2>
                <button onclick="this.closest('.modal').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="day-tasks">
                ${tasks.map(task => `
                    <div class="task-card">
                        <h3>${task.name}</h3>
                        <p>${task.description || 'No description'}</p>
                        ${task.startTime ? `<p>Time: ${task.startTime}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 0);
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatTime(timeString) {
    return timeString;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 100);
}

// Data Management
function exportData() {
    const data = {
        tasks,
        notes,
        quickLinks,
        webViewers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fullfocus-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const data = JSON.parse(text);
            
            tasks = data.tasks || [];
            notes = data.notes || [];
            quickLinks = data.quickLinks || [];
            webViewers = data.webViewers || [];
            
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('notes', JSON.stringify(notes));
            localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
            localStorage.setItem('webViewers', JSON.stringify(webViewers));
            
            initializeApp();
            showNotification('Data imported successfully!');
        } catch (error) {
            showNotification('Error importing data. Please check the file format.');
        }
    };
    
    input.click();
}

function clearData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    
    localStorage.clear();
    tasks = [];
    notes = [];
    quickLinks = [];
    webViewers = [];
    
    initializeApp();
    showNotification('All data cleared successfully!');
}

// Event Listeners
function attachEventListeners() {
    // Form submissions
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', addTask);
    }

    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    closeModal(modal.id);
                }
            });
            closeSidebar();
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);
