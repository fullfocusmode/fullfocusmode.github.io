document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
    let embeds = JSON.parse(localStorage.getItem('embeds')) || [];
    let selectedTaskId = null; // Track currently edited task

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const datetime = document.getElementById('datetime');
    const categorizedTasks = document.getElementById('categorizedTasks');
    const uncategorizedTasks = document.getElementById('uncategorizedTasks');
    const calendar = document.getElementById('calendar');
    const taskForm = document.getElementById('taskForm');
    const quickLinkForm = document.getElementById('quickLinkForm');
    const searchInput = document.getElementById('searchTasks');

    document.getElementById('quickLinkForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('linkName').value;
        const url = document.getElementById('linkUrl').value;
        quickLinks.push({ id: Date.now(), name, url });
        saveQuickLinks();
        renderQuickLinks();
        hideModal('quickLinkModal');
        e.target.reset();
    });
    
    // Update datetime
    function updateDateTime() {
        const now = new Date();
        datetime.textContent = now.toLocaleString();
        setTimeout(updateDateTime, 1000);
    }
    updateDateTime();

    // Quick Links functionality
    document.getElementById('addQuickLink').addEventListener('click', () => {
        showModal('quickLinkModal');
    });

    function saveQuickLinks() {
        localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
    }

    // Sidebar toggle
    document.getElementById('openSidebar').addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    document.getElementById('closeSidebar').addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Task Management
    function addTask(task) {
        if (selectedTaskId) {
            tasks = tasks.map(t => t.id === selectedTaskId ? {...task, id: selectedTaskId} : t);
            selectedTaskId = null;
        } else {
            tasks.push({...task, id: Date.now()});
        }
        saveTasks();
        renderTasks();
        renderCalendar();
    }

    // Setup modal close buttons
    document.querySelectorAll('.modal .cancel').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            hideModal(modal.id);
        });
    });

    // Settings functionality
    document.getElementById('settingsBtn').addEventListener('click', () => {
        showModal('settingsModal');
    });

    // Add Task button
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        selectedTaskId = null;
        document.getElementById('taskForm').reset();
        showModal('taskModal');
    });

    function renderQuickLinks() {
        const container = document.getElementById('quickLinksList');
        container.innerHTML = '';
        quickLinks.forEach(link => {
            const div = document.createElement('div');
            div.className = 'quick-link-item';
            div.innerHTML = `
                <a href="${link.url}" target="_blank">${link.name}</a>
                <button class="delete-link btn-small" data-id="${link.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filteredTasks = tasks) {
        const now = new Date();
        
        // Clear containers
        categorizedTasks.innerHTML = '';
        uncategorizedTasks.innerHTML = '';

        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            
            if (task.startTime && task.endTime) {
                const start = new Date(task.startTime);
                const end = new Date(task.endTime);
                
                if (now >= start && now <= end) {
                    taskElement.classList.add('focused');
                }
                
                categorizedTasks.appendChild(taskElement);
            } else {
                uncategorizedTasks.appendChild(taskElement);
            }
        });
    }

    // Modal functions
    function showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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

        // Action buttons container
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        // Complete toggle
        const completeBtn = document.createElement('button');
        completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
        completeBtn.className = 'btn-small';
        completeBtn.onclick = () => toggleTaskComplete(task.id);
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn-small';
        editBtn.onclick = () => editTask(task.id);

        // Delete button
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

    // Search functionality
    function searchTasks(query) {
        const searchTerm = query.toLowerCase();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(searchTerm) ||
            task.description?.toLowerCase().includes(searchTerm) ||
            task.labels?.some(label => label.toLowerCase().includes(searchTerm)) ||
            false
        );
    }

    // Task editing
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

    // Task completion toggle
    function toggleTaskComplete(taskId) {
        tasks = tasks.map(task => 
            task.id === taskId 
                ? { ...task, completed: !task.completed }
                : task
        );
        saveTasks();
        renderTasks();
    }

    // Dark mode toggle
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    // Notification handling
    function checkNotifications() {
        const now = new Date();
        tasks.forEach(task => {
            if (task.notifications && !task.notified && !task.completed) {
                const startTime = new Date(task.startTime);
                const timeDiff = startTime - now;
                
                // Notify 15 minutes before task starts
                if (timeDiff > 0 && timeDiff <= 900000) {
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
                icon: '/favicon.ico'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showNotification(task);
                }
            });
        }
    }

    // Calendar rendering (previous implementation remains the same)
    function renderCalendar() {
        // ... (previous calendar code remains unchanged)
    }

    function showDayTasks(dateString) {
        // ... (previous showDayTasks code remains unchanged)
    }

    // Quick Links (previous implementation remains the same)
    function addQuickLink(link) {
        // ... (previous quick links code remains unchanged)
    }

    // Form Submissions
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('taskName').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
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

    // Initialize features
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    searchInput.addEventListener('input', (e) => {
        const searchResults = searchTasks(e.target.value);
        renderTasks(searchResults);
    });

    if ('Notification' in window) {
        Notification.requestPermission();
        setInterval(checkNotifications, 60000);
    }

    // Embed functionality
    document.getElementById('addEmbed').addEventListener('click', () => {
        showModal('embedModal');
    });

    function saveEmbeds() {
        localStorage.setItem('embeds', JSON.stringify(embeds));
    }

    function renderEmbeds() {
        const container = document.getElementById('embedList');
        container.innerHTML = '';
        embeds.forEach(embed => {
            const div = document.createElement('div');
            div.className = 'embed-item';
            div.innerHTML = `
                <iframe src="${embed.url}" title="${embed.name}" width="100%" height="300"></iframe>
                <div class="embed-controls">
                    <span>${embed.name}</span>
                    <button class="delete-embed btn-small" data-id="${embed.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    document.getElementById('embedForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('embedName').value;
        const url = document.getElementById('embedUrl').value;
        embeds.push({ id: Date.now(), name, url });
        saveEmbeds();
        renderEmbeds();
        hideModal('embedModal');
        e.target.reset();
    });

    // Initial render
    renderTasks();
    renderQuickLinks();
    renderCalendar();
    renderEmbeds();
});
