// Global Variables and State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
let webViewers = JSON.parse(localStorage.getItem('webViewers')) || [];
let currentNoteId = null;
let contextMenuNoteId = null;
let timerInterval;
let timeLeft;
let isTimerRunning = false;

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Initialize theme
    initializeTheme();
    
    // Initialize components based on current page
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index.html':
            initializeTasks();
            break;
        case 'notes.html':
            initializeNotes();
            break;
        case 'timer.html':
            initializeTimer();
            break;
        case 'chatroom.html':
            initializeChatroom();
            break;
    }

    // Common initializations
    initializeSidebar();
    initializeQuickLinks();
    initializeWebViewers();
    
    // Hide loading screen
    setTimeout(hideLoadingScreen, 1000);
}

function getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

// Theme Management
function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
    }
}

function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', !isDark);
}

// Sidebar Management
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        document.querySelector('.menu-btn').addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 0);
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => modal.style.opacity = '1', 0);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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
// Task Management
function initializeTasks() {
    renderTasks();
    renderCalendar();
    
    // Add event listeners for task form
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }
}

function handleTaskSubmit(event) {
    event.preventDefault();
    
    const editId = event.target.getAttribute('data-edit-id');
    const task = {
        id: editId ? parseInt(editId) : Date.now(),
        name: document.getElementById('taskName').value,
        startDate: document.getElementById('startDate').value,
        startTime: document.getElementById('startTime').value,
        endDate: document.getElementById('endDate').value,
        endTime: document.getElementById('endTime').value,
        description: document.getElementById('taskDescription').value,
        links: document.getElementById('taskLinks').value.split(',').map(link => link.trim()),
        priority: document.getElementById('taskPriority').value,
        labels: document.getElementById('taskLabels').value.split(',').map(label => label.trim()),
        createdAt: editId ? tasks.find(t => t.id === parseInt(editId)).createdAt : new Date().toISOString()
    };

    if (editId) {
        const index = tasks.findIndex(t => t.id === parseInt(editId));
        tasks[index] = task;
        showNotification('Task updated successfully!');
    } else {
        tasks.push(task);
        showNotification('Task added successfully!');
    }

    saveTasks();
    renderTasks();
    closeModal('addTaskModal');
    event.target.reset();
    event.target.removeAttribute('data-edit-id');
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
    updateTaskCounts(sortedTasks);
}

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

    // Set form to edit mode
    document.getElementById('taskForm').setAttribute('data-edit-id', id);
    document.getElementById('modalTitle').textContent = 'Edit Task';
    
    openModal('addTaskModal');
}

function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    showNotification('Task deleted successfully!');
}

function toggleTimeInput(type) {
    const timeInput = document.getElementById(`${type}Time`);
    const toggle = document.getElementById(`${type}TimeToggle`);
    if (timeInput && toggle) {
        timeInput.disabled = !toggle.checked;
    }
}

function updateTaskCounts(sortedTasks) {
    const categorizedCount = document.getElementById('categorizedCount');
    const uncategorizedCount = document.getElementById('uncategorizedCount');
    
    if (categorizedCount && uncategorizedCount) {
        categorizedCount.textContent = sortedTasks.filter(task => task.startDate || task.endDate).length;
        uncategorizedCount.textContent = sortedTasks.filter(task => !task.startDate && !task.endDate).length;
    }
}

function searchTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;

    searchResults.innerHTML = '';
    
    const filteredTasks = tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.labels.some(label => label.toLowerCase().includes(searchTerm))
    );

    filteredTasks.forEach(task => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        resultElement.innerHTML = `
            <h4>${task.name}</h4>
            <p>${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</p>
        `;
        resultElement.addEventListener('click', () => {
            closeModal('searchModal');
            // Scroll to task
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth' });
                taskElement.classList.add('highlight');
                setTimeout(() => taskElement.classList.remove('highlight'), 2000);
            }
        });
        searchResults.appendChild(resultElement);
    });
}
// Calendar Management
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthLabel = document.getElementById('currentMonth');
    if (monthLabel) {
        monthLabel.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    }

    calendar.innerHTML = `
        <div class="calendar-header-row">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                .map(day => `<div class="calendar-cell header">${day}</div>`)
                .join('')}
        </div>
    `;

    let currentDatePointer = new Date(firstDay);
    currentDatePointer.setDate(currentDatePointer.getDate() - firstDay.getDay());

    while (currentDatePointer <= lastDay || currentDatePointer.getDay() !== 0) {
        const dateCell = document.createElement('div');
        dateCell.className = 'calendar-cell';
        
        if (currentDatePointer.getMonth() === month) {
            dateCell.classList.add('current-month');
            
            // Highlight today
            if (currentDatePointer.toDateString() === new Date().toDateString()) {
                dateCell.classList.add('today');
            }
        }
        
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.startDate);
            return taskDate.toDateString() === currentDatePointer.toDateString();
        });

        dateCell.innerHTML = `
            <span class="date-number">${currentDatePointer.getDate()}</span>
            ${dayTasks.length > 0 ? `
                <div class="task-indicator" title="${dayTasks.length} tasks">
                    <span class="task-count">${dayTasks.length}</span>
                </div>
            ` : ''}
        `;

        if (dayTasks.length > 0) {
            dateCell.addEventListener('click', () => showDayTasks(dayTasks, currentDatePointer));
        }

        calendar.appendChild(dateCell);
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
    }
}

function showDayTasks(tasks, date) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Tasks for ${date.toLocaleDateString()}</h2>
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
                        <div class="task-labels">
                            ${task.labels.map(label => `
                                <span class="label">${label}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 0);
}

// Notes Management
function initializeNotes() {
    renderNotes();
    
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }

    // Initialize SimpleMDE if available
    if (typeof SimpleMDE !== 'undefined' && document.getElementById('noteContent')) {
        window.simplemde = new SimpleMDE({ 
            element: document.getElementById('noteContent'),
            spellChecker: false,
            autosave: {
                enabled: true,
                unique_id: "noteEditor"
            }
        });
    }
}

function handleNoteSubmit(event) {
    event.preventDefault();
    
    const note = {
        id: currentNoteId || Date.now(),
        title: document.getElementById('noteTitle').value,
        category: document.getElementById('noteCategory').value,
        content: window.simplemde ? window.simplemde.value() : document.getElementById('noteContent').value,
        tags: document.getElementById('noteTags').value.split(',').map(tag => tag.trim()),
        color: document.querySelector('input[name="noteColor"]:checked').value,
        createdAt: currentNoteId ? notes.find(n => n.id === currentNoteId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (currentNoteId) {
        const index = notes.findIndex(n => n.id === currentNoteId);
        notes[index] = note;
        showNotification('Note updated successfully!');
    } else {
        notes.push(note);
        showNotification('Note added successfully!');
    }

    saveNotes();
    renderNotes();
    closeModal('noteModal');
    currentNoteId = null;
    event.target.reset();
    if (window.simplemde) {
        window.simplemde.value('');
    }
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotes() {
    const notesContainer = document.getElementById('notesContainer');
    if (!notesContainer) return;

    notesContainer.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
    });
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.style.backgroundColor = note.color;
    div.innerHTML = `
        <div class="note-header">
            <h3>${note.title}</h3>
            <span class="category-badge">${note.category}</span>
        </div>
        <div class="note-content">
            ${marked(note.content.substring(0, 150))}
            ${note.content.length > 150 ? '...' : ''}
        </div>
        <div class="note-tags">
            ${note.tags.map(tag => `
                <span class="tag">${tag}</span>
            `).join('')}
        </div>
        <div class="note-footer">
            <span class="note-date">${formatDate(note.updatedAt)}</span>
            <div class="note-actions">
                <button onclick="editNote(${note.id})" class="btn-icon">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNote(${note.id})" class="btn-icon btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Add context menu event listener
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, note.id);
    });

    return div;
}

// Timer Management
function initializeTimer() {
    const savedStats = JSON.parse(localStorage.getItem('timerStats')) || {
        completedCount: 0,
        totalTime: 0,
        streak: 0
    };

    updateTimerStats(savedStats);
    setupTimerControls();
}

function setupTimerControls() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (startBtn && pauseBtn && resetBtn) {
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
    }
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.querySelector('.timer-display').classList.add('timer-active');

        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
                updateProgress(timeLeft);
            } else {
                completeTimer();
            }
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.querySelector('.timer-display').classList.remove('timer-active');
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = originalTime;
    updateTimerDisplay();
    updateProgress(timeLeft);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.querySelector('.timer-display').classList.remove('timer-active');
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('time').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgress(timeLeft) {
    const progress = timeLeft / originalTime;
    const circumference = 2 * Math.PI * 140;
    const offset = circumference - (progress * circumference);
    document.querySelector('.progress-ring circle.progress').style.strokeDashoffset = offset;
}

function completeTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    playNotification();
    updateTimerStats();
    resetTimer();
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatTime(timeString) {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Export/Import Data Management
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
            showNotification('Error importing data. Please check the file format.', 'error');
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
