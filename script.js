// Main script for kevitest.github.io
document.addEventListener('DOMContentLoaded', function() {
    // Data management
    const TaskManager = {
        init: function() {
            this.loadTasks();
            this.loadEmbeds();
            this.loadQuickLinks();
            this.loadSettings();
            this.renderCalendar();
        },
        
        tasks: [],
        embeds: [],
        quickLinks: [],
        settings: {
            theme: 'light'
        },
        
        loadTasks: function() {
            const storedTasks = localStorage.getItem('kevitest_tasks');
            this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
            this.renderTasks();
        },
        
        loadEmbeds: function() {
            const storedEmbeds = localStorage.getItem('kevitest_embeds');
            this.embeds = storedEmbeds ? JSON.parse(storedEmbeds) : [];
            this.renderEmbeds();
        },
        
        loadQuickLinks: function() {
            const storedQuickLinks = localStorage.getItem('kevitest_quicklinks');
            this.quickLinks = storedQuickLinks ? JSON.parse(storedQuickLinks) : [];
            this.renderQuickLinks();
        },
        
        loadSettings: function() {
            const storedSettings = localStorage.getItem('kevitest_settings');
            this.settings = storedSettings ? JSON.parse(storedSettings) : this.settings;
            this.applySettings();
        },
        
        saveTasks: function() {
            localStorage.setItem('kevitest_tasks', JSON.stringify(this.tasks));
            this.renderTasks();
            this.renderCalendar();
        },
        
        saveEmbeds: function() {
            localStorage.setItem('kevitest_embeds', JSON.stringify(this.embeds));
            this.renderEmbeds();
        },
        
        saveQuickLinks: function() {
            localStorage.setItem('kevitest_quicklinks', JSON.stringify(this.quickLinks));
            this.renderQuickLinks();
        },
        
        saveSettings: function() {
            localStorage.setItem('kevitest_settings', JSON.stringify(this.settings));
        },
        
        applySettings: function() {
            // Apply theme
            if (this.settings.theme === 'dark') {
                document.body.classList.add('dark-theme');
                document.getElementById('theme-selector').value = 'dark';
            } else {
                document.body.classList.remove('dark-theme');
                document.getElementById('theme-selector').value = 'light';
            }
        },
        
        addTask: function(task) {
            // Generate a unique ID
            task.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.tasks.push(task);
            this.saveTasks();
        },
        
        updateTask: function(taskId, updates) {
            const index = this.tasks.findIndex(task => task.id === taskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...updates };
                this.saveTasks();
            }
        },
        
        deleteTask: function(taskId) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
        },
        
        addEmbed: function(embed) {
            embed.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.embeds.push(embed);
            this.saveEmbeds();
        },
        
        deleteEmbed: function(embedId) {
            this.embeds = this.embeds.filter(embed => embed.id !== embedId);
            this.saveEmbeds();
        },
        
        addQuickLink: function(quickLink) {
            quickLink.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.quickLinks.push(quickLink);
            this.saveQuickLinks();
        },
        
        deleteQuickLink: function(quickLinkId) {
            this.quickLinks = this.quickLinks.filter(quickLink => quickLink.id !== quickLinkId);
            this.saveQuickLinks();
        },
        
        renderTasks: function() {
            const categorizedTasksEl = document.getElementById('categorized-tasks');
            const uncategorizedTasksEl = document.getElementById('uncategorized-tasks');
            
            // Clear existing content
            categorizedTasksEl.innerHTML = '';
            uncategorizedTasksEl.innerHTML = '';
            
            // Sort tasks - categorized by date, then by priority
            const categorizedTasks = this.tasks.filter(task => task.type === 'categorized')
                .sort((a, b) => {
                    if (a.date !== b.date) {
                        return new Date(a.date) - new Date(b.date);
                    }
                    return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
                });
            
            // Sort uncategorized tasks by priority
            const uncategorizedTasks = this.tasks.filter(task => task.type === 'uncategorized')
                .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
            
            // Render categorized tasks
            if (categorizedTasks.length === 0) {
                categorizedTasksEl.innerHTML = '<div class="empty-message">No categorized tasks</div>';
            } else {
                categorizedTasks.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    categorizedTasksEl.appendChild(taskElement);
                });
            }
            
            // Render uncategorized tasks
            if (uncategorizedTasks.length === 0) {
                uncategorizedTasksEl.innerHTML = '<div class="empty-message">No uncategorized tasks</div>';
            } else {
                uncategorizedTasks.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    uncategorizedTasksEl.appendChild(taskElement);
                });
            }
        },
        
        createTaskElement: function(task) {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item', `priority-${task.priority}`);
            taskElement.dataset.id = task.id;
            
            const titleEl = document.createElement('div');
            titleEl.classList.add('task-title');
            titleEl.textContent = task.title;
            
            const metaEl = document.createElement('div');
            metaEl.classList.add('task-meta');
            
            const priorityEl = document.createElement('span');
            priorityEl.textContent = `Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`;
            
            metaEl.appendChild(priorityEl);
            
            if (task.type === 'categorized' && task.date) {
                const dateEl = document.createElement('span');
                dateEl.textContent = new Date(task.date).toLocaleDateString();
                metaEl.appendChild(dateEl);
            }
            
            taskElement.appendChild(titleEl);
            taskElement.appendChild(metaEl);
            
            // Add event listener to show task details
            taskElement.addEventListener('click', () => this.showTaskDetails(task.id));
            
            return taskElement;
        },
        
        getPriorityWeight: function(priority) {
            switch(priority) {
                case 'high': return 3;
                case 'medium': return 2;
                case 'low': return 1;
                default: return 0;
            }
        },
        
        renderEmbeds: function() {
            const embedsListEl = document.getElementById('embeds-list');
            embedsListEl.innerHTML = '';
            
            if (this.embeds.length === 0) {
                embedsListEl.innerHTML = '<div class="empty-message">No embeds added</div>';
                return;
            }
            
            this.embeds.forEach(embed => {
                const embedEl = document.createElement('div');
                embedEl.classList.add('embed-item');
                embedEl.dataset.id = embed.id;
                
                const iconEl = document.createElement('i');
                iconEl.className = 'fas fa-globe';
                
                const titleEl = document.createElement('span');
                titleEl.textContent = embed.title;
                
                const deleteBtn = document.createElement('span');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                embedEl.appendChild(iconEl);
                embedEl.appendChild(titleEl);
                embedEl.appendChild(deleteBtn);
                
                // Add event listeners
                embedEl.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-btn')) {
                        this.showEmbed(embed.id);
                    }
                });
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteEmbed(embed.id);
                });
                
                embedsListEl.appendChild(embedEl);
            });
        },
        
        renderQuickLinks: function() {
            const quickLinksListEl = document.getElementById('quicklinks-list');
            quickLinksListEl.innerHTML = '';
            
            if (this.quickLinks.length === 0) {
                quickLinksListEl.innerHTML = '<div class="empty-message">No quick links added</div>';
                return;
            }
            
            this.quickLinks.forEach(link => {
                const linkEl = document.createElement('div');
                linkEl.classList.add('quicklink-item');
                linkEl.dataset.id = link.id;
                
                const iconEl = document.createElement('i');
                iconEl.className = 'fas fa-link';
                
                const titleEl = document.createElement('span');
                titleEl.textContent = link.title;
                
                const deleteBtn = document.createElement('span');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                linkEl.appendChild(iconEl);
                linkEl.appendChild(titleEl);
                linkEl.appendChild(deleteBtn);
                
                // Add event listeners
                linkEl.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-btn')) {
                        window.open(link.url, '_blank');
                    }
                });
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteQuickLink(link.id);
                });
                
                quickLinksListEl.appendChild(linkEl);
            });
        },
        
        renderCalendar: function() {
            const calendarEl = document.getElementById('calendar');
            if (!calendarEl) return;
            
            const date = new Date();
            const currentMonth = date.getMonth();
            const currentYear = date.getFullYear();
            
            // Clear existing calendar
            calendarEl.innerHTML = '';
            
            // Create calendar header
            const headerEl = document.createElement('div');
            headerEl.classList.add('calendar-header');
            
            const navEl = document.createElement('div');
            navEl.classList.add('calendar-nav');
            
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => this.changeMonth(-1));
            
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => this.changeMonth(1));
            
            const monthYearEl = document.createElement('div');
            monthYearEl.classList.add('calendar-month-year');
            monthYearEl.textContent = this.getMonthName(currentMonth) + ' ' + currentYear;
            
            navEl.appendChild(prevBtn);
            navEl.appendChild(nextBtn);
            
            headerEl.appendChild(monthYearEl);
            headerEl.appendChild(navEl);
            
            calendarEl.appendChild(headerEl);
            
            // Create weekday headers
            const weekdaysEl = document.createElement('div');
            weekdaysEl.classList.add('calendar-weekdays');
            
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weekdays.forEach(day => {
                const dayEl = document.createElement('div');
                dayEl.textContent = day;
                weekdaysEl.appendChild(dayEl);
            });
            
            calendarEl.appendChild(weekdaysEl);
            
            // Create calendar days
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Calculate tasks by date
            const tasksByDate = {};
            this.tasks.forEach(task => {
                if (task.type === 'categorized' && task.date) {
                    const dateStr = task.date.split('T')[0];
                    if (!tasksByDate[dateStr]) {
                        tasksByDate[dateStr] = [];
                    }
                    tasksByDate[dateStr].push(task);
                }
            });
            
            let day = 1;
            const today = new Date();
            const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
            
            // Add empty cells for days before first day of month
            for (let i = 0; i < firstDay; i++) {
                const emptyEl = document.createElement('div');
                emptyEl.classList.add('calendar-day', 'empty');
                calendarEl.appendChild(emptyEl);
            }
            
            // Add days of the month
            while (day <= daysInMonth) {
                const dayEl = document.createElement('div');
                dayEl.classList.add('calendar-day');
                dayEl.textContent = day;
                
                // Check if this day is today
                if (isCurrentMonth && day === today.getDate()) {
                    dayEl.classList.add('today');
                }
                
                // Check if this day has tasks
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
                    dayEl.classList.add('has-tasks');
                    
                    // Add event listener to show tasks for this day
                    dayEl.addEventListener('click', () => this.showTasksForDay(dateStr));
                }
                
                calendarEl.appendChild(dayEl);
                day++;
            }
        },
        
        changeMonth: function(diff) {
            const date = new Date();
            date.setMonth(date.getMonth() + diff);
            // Save current month and year to state
            this.currentMonth = date.getMonth();
            this.currentYear = date.getFullYear();
            this.renderCalendar();
        },
        
        getMonthName: function(month) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return months[month];
        },
        
        showTaskDetails: function(taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            // Set task details in modal
            document.getElementById('task-detail-title').textContent = task.title;
            
            const detailDateEl = document.getElementById('task-detail-date');
            if (task.type === 'categorized' && task.date) {
                detailDateEl.textContent = `Date: ${new Date(task.date).toLocaleDateString()}`;
                detailDateEl.style.display = 'block';
            } else {
                detailDateEl.style.display = 'none';
            }
            
            document.getElementById('task-detail-priority').textContent = `Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`;
            document.getElementById('task-detail-description').textContent = task.description || 'No description';
            
            // Set data attribute for edit/delete buttons
            document.getElementById('edit-task-btn').dataset.id = taskId;
            document.getElementById('delete-task-btn').dataset.id = taskId;
            
            // Show modal
            openModal('task-detail-modal');
        },
        
        showTasksForDay: function(dateStr) {
            // Find tasks for the selected date
            const tasksForDay = this.tasks.filter(task => 
                task.type === 'categorized' && task.date && task.date.split('T')[0] === dateStr
            );
            
            // Set date in modal title
            const dateObj = new Date(dateStr);
            document.getElementById('selected-date').textContent = dateObj.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Render tasks in modal
            const tasksListEl = document.getElementById('day-tasks-list');
            tasksListEl.innerHTML = '';
            
            if (tasksForDay.length === 0) {
                tasksListEl.innerHTML = '<div class="empty-message">No tasks for this day</div>';
            } else {
                tasksForDay.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    tasksListEl.appendChild(taskElement);
                });
            }
            
            // Show modal
            openModal('calendar-day-modal');
        },
        
        showEmbed: function(embedId) {
            const embed = this.embeds.find(e => e.id === embedId);
            if (!embed) return;
            
            // Set embed details in modal
            document.getElementById('embed-viewer-title').textContent = embed.title;
            document.getElementById('embed-iframe').src = embed.url;
            
            // Show modal
            openModal('embed-viewer');
        },
        
        searchTasks: function(query) {
            query = query.toLowerCase();
            
            // Filter tasks based on query
            const filteredTasks = this.tasks.filter(task => 
                task.title.toLowerCase().includes(query) || 
                (task.description && task.description.toLowerCase().includes(query))
            );
            
            // Clear existing tasks
            document.getElementById('categorized-tasks').innerHTML = '';
            document.getElementById('uncategorized-tasks').innerHTML = '';
            
            // Display message if no results
            if (filteredTasks.length === 0) {
                document.getElementById('categorized-tasks').innerHTML = '<div class="empty-message">No matching tasks</div>';
                return;
            }
            
            // Separate and render filtered tasks
            const categorizedTasks = filteredTasks.filter(task => task.type === 'categorized');
            const uncategorizedTasks = filteredTasks.filter(task => task.type === 'uncategorized');
            
            categorizedTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                document.getElementById('categorized-tasks').appendChild(taskElement);
            });
            
            uncategorizedTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                document.getElementById('uncategorized-tasks').appendChild(taskElement);
            });
        },
        
        exportData: function() {
            const data = {
                tasks: this.tasks,
                embeds: this.embeds,
                quickLinks: this.quickLinks,
                settings: this.settings
            };
            
            const dataStr = JSON.stringify(data);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportLink = document.createElement('a');
            exportLink.setAttribute('href', dataUri);
            exportLink.setAttribute('download', 'kevitest_backup.json');
            document.body.appendChild(exportLink);
            exportLink.click();
            document.body.removeChild(exportLink);
        },
        
        importData: function(data) {
            try {
                const parsedData = JSON.parse(data);
                
                if (parsedData.tasks) {
                    this.tasks = parsedData.tasks;
                    this.saveTasks();
                }
                
                if (parsedData.embeds) {
                    this.embeds = parsedData.embeds;
                    this.saveEmbeds();
                }
                
                if (parsedData.quickLinks) {
                    this.quickLinks = parsedData.quickLinks;
                    this.saveQuickLinks();
                }
                
                if (parsedData.settings) {
                    this.settings = parsedData.settings;
                    this.saveSettings();
                    this.applySettings();
                }
                
                return true;
            } catch (error) {
                console.error('Error importing data:', error);
                return false;
            }
        },
        
        clearAllData: function() {
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                localStorage.removeItem('kevitest_tasks');
                localStorage.removeItem('kevitest_embeds');
                localStorage.removeItem('kevitest_quicklinks');
                localStorage.removeItem('kevitest_settings');
                
                this.tasks = [];
                this.embeds = [];
                this.quickLinks = [];
                this.settings = { theme: 'light' };
                
                this.renderTasks();
                this.renderEmbeds();
                this.renderQuickLinks();
                this.applySettings();
                this.renderCalendar();
            }
        }
    };
    
    // UI event handlers
    function setupEventListeners() {
        // Sidebar toggle
        document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
        document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
        
        // New task button
        document.getElementById('new-task-btn').addEventListener('click', () => openModal('new-task-modal'));
        
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => openModal('settings-modal'));
        
        // Add embed button
        document.getElementById('add-embed-btn').addEventListener('click', () => openModal('embed-modal'));
        
        // Add quick link button
        document.getElementById('add-quicklink-btn').addEventListener('click', () => openModal('quicklink-modal'));
        
        // Close modal buttons
        document.querySelectorAll('.close, .cancel-btn').forEach(button => {
            button.addEventListener('click', closeCurrentModal);
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', event => {
            if (event.target.classList.contains('modal')) {
                closeCurrentModal();
            }
        });
        
        // Handle task type selection
        document.getElementById('task-type').addEventListener('change', function() {
            const dateGroup = document.querySelector('.date-group');
            if (this.value === 'categorized') {
                dateGroup.style.display = 'block';
            } else {
                dateGroup.style.display = 'none';
            }
        });
        
        // Handle new task form submission
        document.getElementById('new-task-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskData = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                type: document.getElementById('task-type').value,
                priority: document.getElementById('task-priority').value
            };
            
            if (taskData.type === 'categorized') {
                taskData.date = document.getElementById('task-date').value;
            }
            
            TaskManager.addTask(taskData);
            closeCurrentModal();
            
            // Reset form
            this.reset();
            document.querySelector('.date-group').style.display = 'none';
        });
        
        // Handle embed form submission
        document.getElementById('embed-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const embedData = {
                title: document.getElementById('embed-title').value,
                url: document.getElementById('embed-url').value
            };
            
            TaskManager.addEmbed(embedData);
            closeCurrentModal();
            
            // Reset form
            this.reset();
        });
        
        // Handle quick link form submission
        document.getElementById('quicklink-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const quickLinkData = {
                title: document.getElementById('quicklink-title').value,
                url: document.getElementById('quicklink-url').value
            };
            
            TaskManager.addQuickLink(quickLinkData);
            closeCurrentModal();
            
            // Reset form
            this.reset();
        });
        
        // Handle search
        document.getElementById('search-btn').addEventListener('click', function() {
            const query = document.getElementById('search-input').value.trim();
            if (query) {
                TaskManager.searchTasks(query);
            } else {
                TaskManager.renderTasks();
            }
        });
        
        document.getElementById('search-input').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    TaskManager.searchTasks(query);
                } else {
                    TaskManager.renderTasks();
                }
            }
        });
        
        // Handle theme selector
        document.getElementById('theme-selector').addEventListener('change', function() {
            TaskManager.settings.theme = this.value;
            TaskManager.saveSettings();
            TaskManager.applySettings();
        });
        
        // Handle data export
        document.getElementById('export-data').addEventListener('click', function() {
            TaskManager.exportData();
        });
        
        // Handle data import
        document.getElementById('import-data').addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = e => {
                    const result = TaskManager.importData(e.target.result);
                    if (result) {
                        alert('Data imported successfully!');
                        closeCurrentModal();
                    } else {
                        alert('Failed to import data. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        });
        
        // Handle clear all data
        document.getElementById('clear-data').addEventListener('click', function() {
            TaskManager.clearAllData();
            closeCurrentModal();
        });
        
        // Handle edit task button
        document.getElementById('edit-task-btn').addEventListener('click', function() {
            const taskId = this.dataset.id;
            const task = TaskManager.tasks.find(t => t.id === taskId);
            
            if (task) {
                // Fill task form with existing data
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description || '';
                document.getElementById('task-type').value = task.type;
                document.getElementById('task-priority').value = task.priority;
                
                // Show/hide date field based on task type
                const dateGroup = document.querySelector('.date-group');
                if (task.type === 'categorized') {
                    dateGroup.style.display = 'block';
                    document.getElementById('task-date').value = task.date || '';
                } else {
                    dateGroup.style.display = 'none';
                }
                
                // Change form submission behavior
                const form = document.getElementById('new-task-form');
                const originalSubmitHandler = form.onsubmit;
                
                form.onsubmit = function(e) {
                    e.preventDefault();
                    
                    const updates = {
                        title: document.getElementById('task-title').value,
                        description: document.getElementById('task-description').value,
                        type: document.getElementById('task-type').value,
                        priority: document.getElementById('task-priority').value
                    };
                    
                    if (updates.type === 'categorized') {
                        updates.date = document.getElementById('task-date').value;
                    } else {
                        updates.date = null;
                    }
                    
                    TaskManager.updateTask(taskId, updates);
                    closeCurrentModal();
                    
                    // Reset form and restore original handler
                    form.reset();
                    form.onsubmit = originalSubmitHandler;
                    document.querySelector('.date-group').style.display = 'none';
                };
                
                // Close task detail modal and open new task modal
                closeCurrentModal();
                openModal('new-task-modal');
            }
        });
        
        // Handle delete task button
        document.getElementById('delete-task-btn').addEventListener('click', function() {
            const taskId = this.dataset.id;
            if (confirm('Are you sure you want to delete this task?')) {
                TaskManager.deleteTask(taskId);
                closeCurrentModal();
            }
        });
    }
    
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }
    
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    function openModal(modalId) {
        // Close any open modals first
        closeCurrentModal();
        
        // Open the requested modal
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    function closeCurrentModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // Initialize
    setupEventListeners();
    TaskManager.init();
});
