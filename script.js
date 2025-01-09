// Global modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];
    let embeds = JSON.parse(localStorage.getItem('embeds')) || [];
    let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    let selectedTaskId = null;

    // DOM Elements
    let currentDate = new Date();
    const sidebar = document.getElementById('sidebar');
    const datetime = document.getElementById('datetime');
    const categorizedTasks = document.getElementById('categorizedTasks');
    const uncategorizedTasks = document.getElementById('uncategorizedTasks');
    const calendar = document.getElementById('calendar');
    const taskForm = document.getElementById('taskForm');
    const quickLinkForm = document.getElementById('quickLinkForm');
    const searchInput = document.getElementById('searchTasks');

    cleanupCompletedTasks();

    // Modal close on outside click
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    // Modal buttons
    document.querySelectorAll('.modal .cancel').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            hideModal(modal.id);
        });
    });

    // Button event listeners
    document.getElementById('addQuickLink').addEventListener('click', () => {
        showModal('quickLinkModal');
    });

    document.getElementById('addTaskBtn').addEventListener('click', () => {
        selectedTaskId = null;
        document.getElementById('taskForm').reset();
        showModal('taskModal');
    });

    document.getElementById('addEmbed').addEventListener('click', () => {
        showModal('embedModal');
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        showModal('settingsModal');
    });

    // Sidebar toggle
    document.getElementById('openSidebar').addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    document.getElementById('closeSidebar').addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Update datetime
    function updateDateTime() {
        const now = new Date();
        datetime.textContent = now.toLocaleString();
        setTimeout(updateDateTime, 1000);
    }
    updateDateTime();

    function saveCompletedTasks() {
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }
    
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

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filteredTasks = tasks) {
        const now = new Date();
        const today = new Date().toDateString();
        
        categorizedTasks.innerHTML = '';
        uncategorizedTasks.innerHTML = '';
    
        // Add toggle button for completed tasks
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-completed-btn';
        toggleButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Toggle Completed Tasks';
        toggleButton.onclick = toggleCompletedTasksView;
        categorizedTasks.appendChild(toggleButton);
    
        // Sort tasks by date and time
        const sortedTasks = filteredTasks.sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return new Date(a.startTime) - new Date(b.startTime);
        });
    
        sortedTasks.forEach(task => {
            if (task.completed) return; // Skip completed tasks in main view
            
            const taskElement = createTaskElement(task);
            
            if (task.startTime) {
                const start = new Date(task.startTime);
                if (now >= start && (!task.endTime || now <= new Date(task.endTime))) {
                    taskElement.classList.add('focused');
                }
                categorizedTasks.appendChild(taskElement);
            } else {
                uncategorizedTasks.appendChild(taskElement);
            }
        });
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

    function toggleCompletedTasksView() {
        const today = new Date().toDateString();
        const completedForToday = completedTasks[today] || [];
        
        if (categorizedTasks.classList.contains('showing-completed')) {
            renderTasks(); // Switch back to normal view
            categorizedTasks.classList.remove('showing-completed');
        } else {
            categorizedTasks.innerHTML = '';
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-completed-btn active';
            toggleButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Show Active Tasks';
            toggleButton.onclick = toggleCompletedTasksView;
            categorizedTasks.appendChild(toggleButton);
    
            completedForToday.forEach(task => {
                const taskElement = createTaskElement(task);
                taskElement.classList.add('completed');
                categorizedTasks.appendChild(taskElement);
            });
            categorizedTasks.classList.add('showing-completed');
        }
    }

    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
    
        const today = new Date().toDateString();
        if (!completedTasks[today]) {
            completedTasks[today] = [];
        }
    
        if (!task.completed) {
            // Mark as completed and move to completed tasks
            task.completed = true;
            completedTasks[today].push({...task});
            tasks = tasks.filter(t => t.id !== taskId);
        } else {
            // Move back to active tasks
            task.completed = false;
            completedTasks[today] = completedTasks[today].filter(t => t.id !== taskId);
            tasks.push({...task});
        }
    
        saveTasks();
        saveCompletedTasks();
        renderTasks();
    }
    
    // Updated Calendar Functionality
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
    
        // Add event listeners for calendar navigation and day clicks
        document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
        
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.getAttribute('data-date');
                showDayTasks(dateStr);
            });
        });
    }

    function changeMonth(delta) {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
        renderCalendar();
    }
    
    // Updated showDayTasks function
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
    
        // Add toggle button in modal
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
            
            // Replace existing tasks container if it exists
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

    // Embed Management
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
                <div class="embed-controls">
                    <span>${embed.name}</span>
                    <button class="view-embed btn-small" data-id="${embed.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-embed btn-small" data-id="${embed.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });

    // Add event listeners for viewing embeds
    document.querySelectorAll('.view-embed').forEach(button => {
        button.addEventListener('click', () => {
            const embedId = button.getAttribute('data-id');
            const embed = embeds.find(e => e.id == embedId);
            if (embed) {
                document.getElementById('embedViewerTitle').textContent = embed.name;
                document.getElementById('embedViewerContent').innerHTML = 
                    `<iframe src="${embed.url}" title="${embed.name}" width="100%" height="100%"></iframe>`;
                showModal('embedViewerModal');
            }
        });
    });

    // Add event listeners for deleting embeds
    document.querySelectorAll('.delete-embed').forEach(button => {
        button.addEventListener('click', () => {
            const embedId = button.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this embed?')) {
                embeds = embeds.filter(e => e.id != embedId);
                saveEmbeds();
                renderEmbeds();
            }
        });
    });
    
    // Notification System
    function checkNotifications() {
        const now = new Date();
        tasks.forEach(task => {
            if (task.notifications && !task.notified && !task.completed) {
                const startTime = new Date(task.startTime);
                const timeDiff = startTime - now;
                
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

    // Add this to your task form submit handler
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

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchResults = searchTasks(e.target.value);
        renderTasks(searchResults);
    });

    function searchTasks(query) {
        const searchTerm = query.toLowerCase();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(searchTerm) ||
            task.description?.toLowerCase().includes(searchTerm) ||
            task.labels?.some(label => label.toLowerCase().includes(searchTerm)) ||
            false
        );
    }

    // Export/Import Functionality
    document.getElementById('exportData').addEventListener('click', () => {
        const data = {
            tasks,
            quickLinks,
            embeds
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fullfocus_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('importData').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    tasks = data.tasks || [];
                    quickLinks = data.quickLinks || [];
                    embeds = data.embeds || [];
                    saveTasks();
                    saveQuickLinks();
                    saveEmbeds();
                    renderTasks();
                    renderQuickLinks();
                    renderEmbeds();
                    renderCalendar();
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Error importing data: Invalid file format');
                }
            };
            reader.readAsText(file);
        }
    });

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
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Initialize features
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    if ('Notification' in window) {
        Notification.requestPermission();
        setInterval(checkNotifications, 60000);
    }

    // Initial render
    renderTasks();
    renderQuickLinks();
    renderCalendar();
    renderEmbeds();
    });
