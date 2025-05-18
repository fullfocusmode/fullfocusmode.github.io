// Main script for fullfocusmode.github.io
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
        const storedTasks = localStorage.getItem('fullfocus_tasks');
        this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
        this.renderTasks();
    },
    
    loadEmbeds: function() {
        const storedEmbeds = localStorage.getItem('fullfocus_embeds');
        this.embeds = storedEmbeds ? JSON.parse(storedEmbeds) : [];
        this.renderEmbeds();
    },
    
    loadQuickLinks: function() {
        const storedQuickLinks = localStorage.getItem('fullfocus_quicklinks');
        this.quickLinks = storedQuickLinks ? JSON.parse(storedQuickLinks) : [];
        this.renderQuickLinks();
    },
    
    loadSettings: function() {
        const storedSettings = localStorage.getItem('fullfocus_settings');
        this.settings = storedSettings ? JSON.parse(storedSettings) : this.settings;
        this.applySettings();
    },
    
    saveTasks: function() {
        localStorage.setItem('fullfocus_tasks', JSON.stringify(this.tasks));
        this.renderTasks();
        this.renderCalendar();
    },
    
    saveEmbeds: function() {
        localStorage.setItem('fullfocus_embeds', JSON.stringify(this.embeds));
        this.renderEmbeds();
    },
    
    saveQuickLinks: function() {
        localStorage.setItem('fullfocus_quicklinks', JSON.stringify(this.quickLinks));
        this.renderQuickLinks();
    },
    
    saveSettings: function() {
        localStorage.setItem('fullfocus_settings', JSON.stringify(this.settings));
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
        this.renderEmbeds(); //Added to update the UI immediately 
    }, 

    deleteEmbed: function(embedId) { 
        this.embeds = this.embeds.filter(embed => embed.id !== embedId); 
        this.saveEmbeds(); 
        this.renderEmbeds(); //Added to update the UI immediately 
    }, 
    
    addQuickLink: function(quickLink) { 
        quickLink.id = Date.now().toString(36) + Math.random().toString(36).substr(2); 
        this.quickLinks.push(quickLink); 
        this.saveQuickLinks(); 
        this.renderQuickLinks(); //Added to update the UI immediately 
    }, 

    deleteQuickLink: function(quickLinkId) { 
        this.quickLinks = this.quickLinks.filter(quickLink => quickLink.id !== quickLinkId); 
        this.saveQuickLinks(); 
        this.renderQuickLinks(); //Added to update the UI immediately 
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
    
    TaskManager.renderCalendar: function() { 
        const calendarEl = document.getElementById('calendar'); 
        if (!calendarEl) return; 
    
        const today = new Date(); 
        const currentMonth = today.getMonth(); 
        const currentYear = today.getFullYear(); 
    
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
    
        const firstDay = (new Date(currentYear, currentMonth, 1)).getDay(); 
        const lastDay = (new Date(currentYear, currentMonth + 1, 0)).getDate(); 
    
        const tasksByDate = {}; 
        this.tasks.filter(task => task.type === 'categorized').forEach(task => { 
            if (task.date) { 
                const dateStr = task.date.split('T')[0]; 
                tasksByDate[dateStr] = tasksByDate[dateStr] || []; 
                tasksByDate[dateStr].push(task); 
            } 
        }); 
    
        const calendarGrid = document.createElement('div'); 
        calendarGrid.classList.add('calendar-grid'); 
    
        // Add empty cells before the first day of the month 
        for (let i = 0; i < firstDay; i++) { 
            const emptyCell = document.createElement('div'); 
            emptyCell.classList.add('calendar-day', 'empty'); 
            calendarGrid.appendChild(emptyCell); 
        } 
    
        // Add days of the month 
        for (let day = 1; day <= lastDay; day++) { 
            const dayEl = document.createElement('div'); 
            dayEl.classList.add('calendar-day'); 
            dayEl.textContent = day; 
    
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; 
            if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) { 
                dayEl.classList.add('has-tasks'); 
                dayEl.addEventListener('click', () => this.showTasksForDay(dateStr)); 
            } 
            if (new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear) { 
                dayEl.classList.add('today'); 
            } 
            calendarGrid.appendChild(dayEl); 
        } 
    
        calendarEl.appendChild(calendarGrid); 
    },
    
    TaskManager.changeMonth: function(diff) { 
        const date = new Date(); 
        date.setMonth(date.getMonth() + diff); 
        this.renderCalendar(); // Call renderCalendar to update the view 
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
        //This line was the problem.  It needs to set the src attribute of the iframe. 
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
        exportLink.setAttribute('download', 'fullfocus_backup.json');
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
            localStorage.removeItem('fullfocus_tasks');
            localStorage.removeItem('fullfocus_embeds');
            localStorage.removeItem('fullfocus_quicklinks');
            localStorage.removeItem('fullfocus_settings');
            
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

function setupTaskListeners() { 
    // Sidebar toggle (if in index.html) 
    const toggleSidebarButton = document.getElementById('toggle-sidebar'); 
    if (toggleSidebarButton) { 
        toggleSidebarButton.addEventListener('click', toggleSidebar); 
    } 

    // New task button 
    const newTaskButton = document.getElementById('new-task-btn'); 
    if (newTaskButton) { 
        newTaskButton.addEventListener('click', () => openModal('new-task-modal')); 
    } 

    // Settings button (if in index.html) 
    const settingsButton = document.getElementById('settings-btn'); 
    if (settingsButton) { 
        settingsButton.addEventListener('click', () => openModal('settings-modal')); 
    } 

    // Add embed button (if in index.html) 
    const addEmbedButton = document.getElementById('add-embed-btn'); 
    if (addEmbedButton) { 
        addEmbedButton.addEventListener('click', () => openModal('embed-modal')); 
    } 

    // Add quick link button (if in index.html) 
    const addQuickLinkButton = document.getElementById('add-quicklink-btn'); 
    if (addQuickLinkButton) { 
        addQuickLinkButton.addEventListener('click', () => openModal('quicklink-modal')); 
    } 

    // Close modal buttons 
    const closeButtons = document.querySelectorAll('.close, .cancel-btn'); 
    closeButtons.forEach(button => { 
        button.addEventListener('click', closeCurrentModal); 
    }); 

    // Close modals when clicking outside 
    window.addEventListener('click', event => { 
        if (event.target.classList.contains('modal')) { 
            closeCurrentModal(); 
        } 
    }); 

    // Handle theme selector (if in index.html) 
    const themeSelector = document.getElementById('theme-selector'); 
    if (themeSelector) { 
        themeSelector.addEventListener('change', function() { 
            TaskManager.settings.theme = this.value; 
            TaskManager.saveSettings(); 
            TaskManager.applySettings(); 
        }); 
    } 

    // Handle data export (if in index.html) 
    const exportDataButton = document.getElementById('export-data'); 
    if (exportDataButton) { 
        exportDataButton.addEventListener('click', function() { 
            TaskManager.exportData(); 
        }); 
    } 

    // Handle data import (if in index.html) 
    const importDataButton = document.getElementById('import-data'); 
    if (importDataButton) { 
        importDataButton.addEventListener('click', function() { 
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
    } 

    // Handle clear all data (if in index.html) 
    const clearDataButton = document.getElementById('clear-data'); 
    if (clearDataButton) { 
        clearDataButton.addEventListener('click', function() { 
            TaskManager.clearAllData(); 
            closeCurrentModal(); 
        }); 
    } 

    // Handle new task form submission 
    const newTaskForm = document.getElementById('new-task-form'); 
    if (newTaskForm) { 
        newTaskForm.addEventListener('submit', function(e) { 
            // ... (Your existing new task form submission handler) ... 
        }); 
    } 

    // Handle search (if in index.html) 
    const searchButton = document.getElementById('search-btn'); 
    const searchInput = document.getElementById('search-input'); 
    if (searchButton && searchInput) { 
        searchButton.addEventListener('click', function() { 
            // ... (Your existing search handler) ... 
        }); 
        searchInput.addEventListener('keyup', function(e) { 
            // ... (Your existing search handler) ... 
        }); 
    } 

    // Handle task type selection 
    const taskTypeSelect = document.getElementById('task-type'); 
    if (taskTypeSelect) { 
        taskTypeSelect.addEventListener('change', function() { 
            // ... (Your existing task type handler) ... 
        }); 
    } 

    // Handle edit task button 
    const editTaskButton = document.getElementById('edit-task-btn'); 
    if (editTaskButton) { 
        editTaskButton.addEventListener('click', function() { 
            // ... (Your existing edit task handler) ... 
        }); 
    } 

    // Handle delete task button 
    const deleteTaskButton = document.getElementById('delete-task-btn'); 
    if (deleteTaskButton) { 
        deleteTaskButton.addEventListener('click', function() { 
            // ... (Your existing delete task handler) ... 
        }); 
    } 
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
    
document.addEventListener('DOMContentLoaded', function() { 
    TaskManager.init(); // Initialize after DOM is ready 
    setupTaskListeners(); 
});
