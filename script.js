function initEmbedViewer() {
    document.querySelectorAll('.modal .cancel').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Storage management
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    append: (key, value) => {
        const current = Storage.get(key) || [];
        current.push(value);
        Storage.set(key, current);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Load sidebar
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebarContainer').innerHTML = data;
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('#sidebar a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
            initSidebar();
        });

    // State management
    let tasks = Storage.get('tasks') || [];
    let quickLinks = Storage.get('quickLinks') || [];
    let embeds = Storage.get('embeds') || [];
    let completedTasks = Storage.get('completedTasks') || {};
    let selectedTaskId = null;

    // DOM Elements
    let currentDate = new Date();
    const datetime = document.getElementById('datetime');
    const categorizedTasks = document.getElementById('categorizedTasks');
    const uncategorizedTasks = document.getElementById('uncategorizedTasks');
    const calendar = document.getElementById('calendar');
    const taskForm = document.getElementById('taskForm');
    const quickLinkForm = document.getElementById('quickLinkForm');
    const searchInput = document.getElementById('searchTasks');

    cleanupCompletedTasks();

    // Initialize sidebar functionality
    function initSidebar() {
        document.getElementById('openSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.add('active');
        });

        document.getElementById('closeSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('active');
        });

        document.getElementById('addQuickLink')?.addEventListener('click', () => {
            showModal('quickLinkModal');
        });

        document.getElementById('addEmbed')?.addEventListener('click', () => {
            showModal('embedModal');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            showModal('settingsModal');
        });

        document.getElementById('addTaskBtn').addEventListener('click', () => {
            selectedTaskId = null;
            document.getElementById('taskForm').reset();
            showModal('taskModal');
        });

    }

    // Initialize data from localStorage
    function initializeData() {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
        embeds = JSON.parse(localStorage.getItem('embeds')) || [];
        completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    }
    
    function renderTasks(filteredTasks = tasks) {
        const categorizedContainer = document.getElementById('categorizedTasks');
        const uncategorizedContainer = document.getElementById('uncategorizedTasks');
        
        if (!categorizedContainer || !uncategorizedContainer) return;
        
        categorizedContainer.innerHTML = '';
        uncategorizedContainer.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.startTime) {
                categorizedContainer.appendChild(taskElement);
            } else {
                uncategorizedContainer.appendChild(taskElement);
            }
        });
    }

    function initModalHandlers() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modal.id);
            });
        });
    }

    function initSearch() {
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const searchResults = searchTasks(e.target.value);
                renderTasks(searchResults);
            }, 300);
        });
    }

    function changeMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        renderCalendar();
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'normal'}`;
        
        const title = document.createElement('h3');
        title.textContent = task.name;
        
        const details = document.createElement('div');
        if (task.startTime && task.endTime) {
            details.innerHTML = `
                <p>Time: ${new Date(task.startTime).toLocaleString()} - 
                   ${new Date(task.endTime).toLocaleString()}</p>
            `;
        }
        
        if (task.description) {
            details.innerHTML += `<p>${task.description}</p>`;
        }
        
        if (task.links) {
            const links = task.links.split(',').map(link => 
                `<a href="${link.trim()}" target="_blank">${link.trim()}</a>`
            ).join(', ');
            details.innerHTML += `<p>Links: ${links}</p>`;
        }

        if (task.labels && task.labels.length) {
            const labels = document.createElement('div');
            labels.className = 'task-labels';
            labels.innerHTML = task.labels.map(label => 
                `<span class="label">${label}</span>`
            ).join('');
            details.appendChild(labels);
        }

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const completeBtn = document.createElement('button');
        completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
        completeBtn.className = 'btn-small';
        completeBtn.onclick = () => toggleTaskComplete(task.id);
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn-small';
        editBtn.onclick = () => editTask(task.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small delete';
        deleteBtn.onclick = () => {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
                renderCalendar();
            }
        };
        
        actions.appendChild(completeBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        div.appendChild(title);
        div.appendChild(details);
        div.appendChild(actions);
        return div;
    }

    // Modify the task form HTML
    document.getElementById('startTime').removeAttribute('required');
    document.getElementById('endTime').removeAttribute('required');
    
    // Update the addTask function
    function addTask(formData) {
        const taskId = Date.now();
        const task = {
            id: taskId,
            ...formData
        };
        tasks.push(task);
        Storage.set('tasks', tasks);
        renderTasks();
        renderCalendar();
    }

    
    // Calendar functionality
    function renderCalendar() {
        const calendarDiv = document.getElementById('calendar');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
    
        const monthNames = ["January", "February", "March", "April", "May", "June",
                           "July", "August", "September", "October", "November", "December"];
    
        let calendarHTML = `
            <div class="calendar-navigation">
                <button id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                <button id="nextMonth"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-header">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
        `;
    
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
    
        let dayCount = 1;
        const weeks = Math.ceil((daysInMonth + startingDay) / 7);
    
        for (let week = 0; week < weeks; week++) {
            calendarHTML += '<div class="calendar-week">';
            for (let day = 0; day < 7; day++) {
                if ((week === 0 && day < startingDay) || dayCount > daysInMonth) {
                    calendarHTML += '<div class="calendar-day empty"></div>';
                } else {
                    const date = new Date(currentYear, currentMonth, dayCount);
                    const isToday = date.toDateString() === today.toDateString();
                    const hasTask = tasks.some(task => task.startTime && 
                        new Date(task.startTime).toDateString() === date.toDateString());
                    const hasCompleted = completedTasks[date.toDateString()]?.length > 0;
    
                    calendarHTML += `
                        <div class="calendar-day ${isToday ? 'today' : ''} 
                                               ${hasTask ? 'has-task' : ''} 
                                               ${hasCompleted ? 'has-completed' : ''}"
                             data-date="${date.toISOString().split('T')[0]}">
                            <span class="day-number">${dayCount}</span>
                            ${hasTask ? '<span class="task-indicator"></span>' : ''}
                            ${hasCompleted ? '<span class="completed-indicator"></span>' : ''}
                        </div>`;
                    dayCount++;
                }
            }
            calendarHTML += '</div>';
        }
    
        calendarHTML += '</div>';
        calendarDiv.innerHTML = calendarHTML;
    
        document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
        
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.getAttribute('data-date');
                showDayTasks(dateStr);
            });
        });
    }

    function cleanupCompletedTasks() {
        if (!completedTasks) return;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(completedTasks).forEach(dateStr => {
            if (new Date(dateStr) < thirtyDaysAgo) {
                delete completedTasks[dateStr];
            }
        });
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }

    function initTaskForm() {
        const taskForm = document.getElementById('taskForm');
        if (!taskForm) return;
    
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                id: Date.now(), // Missing task ID generation
                name: document.getElementById('taskName').value,
                startTime: document.getElementById('startTime').value || null,
                endTime: document.getElementById('endTime').value || null,
                description: document.getElementById('taskDescription').value,
                links: document.getElementById('taskLinks').value,
                priority: document.getElementById('taskPriority').value,
                labels: document.getElementById('taskLabels').value.split(',')
                    .map(label => label.trim())
                    .filter(label => label),
                completed: false,
                notifications: document.getElementById('taskNotifications').checked,
                notified: false
            };
            
            if (selectedTaskId) {
                tasks = tasks.map(t => t.id === selectedTaskId ? {...t, ...formData} : t);
            } else {
                tasks.push(formData);
            }
            
            saveTasks();
            renderTasks();
            renderCalendar();
            taskForm.reset();
            hideModal('taskModal');
        });
    }

    // Export/Import Functionality
    function initDataManagement() {
        document.getElementById('exportData').addEventListener('click', () => {
            const data = {
                tasks: Storage.get('tasks') || [],
                quickLinks: Storage.get('quickLinks') || [],
                embeds: Storage.get('embeds') || [],
                completedTasks: Storage.get('completedTasks') || {},
                settings: Storage.get('settings') || {}
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fullfocus_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    
        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
            }
        });
    
        document.getElementById('settingsModal').querySelector('.cancel').addEventListener('click', () => {
            hideModal('settingsModal');
        });
    }

    function showDayTasks(dateString) {
        const selectedDate = new Date(dateString);
        const dateStr = selectedDate.toDateString();
        
        const activeTasks = tasks.filter(task => {
            return task.startTime && new Date(task.startTime).toDateString() === dateStr;
        });
        
        const completedTasksForDay = completedTasks[dateStr] || [];
    
        document.getElementById('selectedDate').textContent = selectedDate.toLocaleDateString();
        const dayTasksDiv = document.getElementById('dayTasks');
        dayTasksDiv.innerHTML = '';
    
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-completed-btn';
        toggleBtn.textContent = 'Toggle Completed Tasks';
        toggleBtn.onclick = () => {
            const showingCompleted = toggleBtn.classList.contains('active');
            toggleBtn.classList.toggle('active');
            renderDayTasks(showingCompleted ? activeTasks : completedTasksForDay);
        };
        dayTasksDiv.appendChild(toggleBtn);
    
        function renderDayTasks(tasksToShow) {
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'tasks-container';
            
            if (tasksToShow.length === 0) {
                tasksContainer.innerHTML = '<p class="no-tasks">No tasks for this day</p>';
            } else {
                tasksToShow.forEach(task => {
                    const taskElement = createTaskElement(task);
                    tasksContainer.appendChild(taskElement);
                });
            }
            
            const existingContainer = dayTasksDiv.querySelector('.tasks-container');
            if (existingContainer) {
                dayTasksDiv.replaceChild(tasksContainer, existingContainer);
            } else {
                dayTasksDiv.appendChild(tasksContainer);
            }
        }
    
        renderDayTasks(activeTasks);
        showModal('calendarModal');
    }
    // Quick Links functionality
    function saveQuickLinks() {
        localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
    }

    function renderQuickLinks() {
        const container = document.getElementById('quickLinksList');
        if (!container) return;
        
        container.innerHTML = quickLinks.map(link => `
            <div class="quick-link-item">
                <a href="${link.url}" target="_blank">${link.name}</a>
                <button class="delete-link btn-small" data-id="${link.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.delete-link').forEach(button => {
            button.addEventListener('click', () => {
                const id = parseInt(button.dataset.id);
                quickLinks = quickLinks.filter(link => link.id !== id);
                saveQuickLinks();
                renderQuickLinks();
            });
        });
    }

    // Embed Management
    function saveEmbeds() {
        localStorage.setItem('embeds', JSON.stringify(embeds));
    }

    function renderEmbeds() {
        const container = document.getElementById('embedList');
        if (!container) return;

        container.innerHTML = embeds.map(embed => `
            <div class="embed-item">
                <div class="embed-controls">
                    <span>${embed.name}</span>
                    <button class="view-embed btn-small" data-id="${embed.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-embed btn-small" data-id="${embed.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        initEmbedHandlers();
    }

    function searchTasks(query) {
        if (!query) return tasks;
        
        query = query.toLowerCase();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.labels?.some(label => label.toLowerCase().includes(query))
        );
    }

    function initDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
    
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', isDarkMode);
        darkModeToggle.classList.toggle('active', isDarkMode);
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isNowDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isNowDark);
            darkModeToggle.classList.toggle('active', isNowDark);
        });
    }

    function initEmbedHandlers() {
        document.querySelectorAll('.view-embed').forEach(button => {
            button.addEventListener('click', () => {
                const embedId = button.dataset.id;
                const embed = embeds.find(e => e.id == embedId);
                if (embed) {
                    document.getElementById('embedViewerTitle').textContent = embed.name;
                    document.getElementById('embedViewerContent').innerHTML = 
                        `<iframe src="${embed.url}" title="${embed.name}" width="100%" height="100%"></iframe>`;
                    showModal('embedViewerModal');
                }
            });
        });

        document.querySelectorAll('.delete-embed').forEach(button => {
            button.addEventListener('click', () => {
                const embedId = button.dataset.id;
                if (confirm('Are you sure you want to delete this embed?')) {
                    embeds = embeds.filter(e => e.id != embedId);
                    saveEmbeds();
                    renderEmbeds();
                }
            });
        });
    }

    // Form Submissions
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('taskName').value,
                startTime: document.getElementById('startTime').value || null,
                endTime: document.getElementById('endTime').value || null,
                description: document.getElementById('taskDescription').value,
                links: document.getElementById('taskLinks').value,
                priority: document.getElementById('taskPriority').value,
                labels: document.getElementById('taskLabels').value.split(',')
                    .map(label => label.trim())
                    .filter(label => label),
                completed: false,
                notifications: document.getElementById('taskNotifications').checked,
                notified: false
            };
            
            addTask(formData);
            taskForm.reset();
            hideModal('taskModal');
        });
    }

    if (quickLinkForm) {
        quickLinkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('linkName').value;
            const url = document.getElementById('linkUrl').value;
            quickLinks.push({ id: Date.now(), name, url });
            saveQuickLinks();
            renderQuickLinks();
            hideModal('quickLinkModal');
            e.target.reset();
        });
    }

    // Initialize features
    renderQuickLinks();
    renderEmbeds();
    if (calendar) renderCalendar();
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchResults = searchTasks(e.target.value);
            renderTasks(searchResults);
        });
    }

    // Notification System
    if ('Notification' in window) {
        Notification.requestPermission();
        setInterval(checkNotifications, 60000);
    }
});
    // Task editing and completion
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        selectedTaskId = taskId;
        document.getElementById('taskName').value = task.name;
        document.getElementById('startTime').value = task.startTime || '';
        document.getElementById('endTime').value = task.endTime || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskLinks').value = task.links || '';
        document.getElementById('taskPriority').value = task.priority || 'normal';
        document.getElementById('taskLabels').value = (task.labels || []).join(', ');
        document.getElementById('taskNotifications').checked = task.notifications || false;
        showModal('taskModal');
    }

    function saveTasks() {
        Storage.set('tasks', tasks);
    }
    
    function saveCompletedTasks() {
        Storage.set('completedTasks', completedTasks);
    }
    
    function cleanupCompletedTasks() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(completedTasks).forEach(dateStr => {
            if (new Date(dateStr) < thirtyDaysAgo) {
                delete completedTasks[dateStr];
            }
        });
        saveCompletedTasks();
    }

    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const today = new Date().toDateString();
        if (!completedTasks[today]) {
            completedTasks[today] = [];
        }

        if (!task.completed) {
            task.completed = true;
            completedTasks[today].push({...task});
            tasks = tasks.filter(t => t.id !== taskId);
        } else {
            task.completed = false;
            completedTasks[today] = completedTasks[today].filter(t => t.id !== taskId);
            tasks.push({...task});
        }

        saveTasks();
        saveCompletedTasks();
        renderTasks();
        renderCalendar();
    }

    // Notification System
    function checkNotifications() {
        const now = new Date();
        tasks.forEach(task => {
            if (task.notifications && !task.notified && !task.completed) {
                const startTime = new Date(task.startTime);
                const timeDiff = startTime - now;
                
                if (timeDiff > 0 && timeDiff <= 900000) { // 15 minutes
                    showNotification(task);
                    task.notified = true;
                    saveTasks();
                }
            }
        });
    }

    function showNotification(task) {
        if (Notification.permission === "granted") {
            new Notification(`Task Starting Soon: ${task.name}`, {
                body: `Starting in ${Math.round((new Date(task.startTime) - new Date()) / 60000)} minutes`,
                icon: 'favicon.png'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showNotification(task);
                }
            });
        }
    }

    // Initialize features
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    if ('Notification' in window) {
        Notification.requestPermission();
        setInterval(checkNotifications, 60000);
    }

    initializeData();
    initDarkMode();
    initSidebar();
    initDataManagement();
    initTaskForm();
    initEmbedViewer();
    initModalHandlers();
    initSearch();
    
    renderTasks();
    renderCalendar();
    renderQuickLinks();
    renderEmbeds();
    
    // Clean up completed tasks on load
    cleanupCompletedTasks();

    // Export utilities for other pages
    window.appUtils = {
        showModal,
        hideModal,
        Storage,
        renderCalendar,
        renderTasks,
        checkNotifications
    };
