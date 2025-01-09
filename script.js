// script.js
document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [];

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const datetime = document.getElementById('datetime');
    const categorizedTasks = document.getElementById('categorizedTasks');
    const uncategorizedTasks = document.getElementById('uncategorizedTasks');
    const calendar = document.getElementById('calendar');
    const taskForm = document.getElementById('taskForm');
    const quickLinkForm = document.getElementById('quickLinkForm');

    // Update datetime
    function updateDateTime() {
        const now = new Date();
        datetime.textContent = now.toLocaleString();
        setTimeout(updateDateTime, 1000);
    }
    updateDateTime();

    // Sidebar toggle
    document.getElementById('openSidebar').addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    document.getElementById('closeSidebar').addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Task Management
    function addTask(task) {
        tasks.push(task);
        saveTasks();
        renderTasks();
        renderCalendar();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        const now = new Date();
        
        // Clear containers
        categorizedTasks.innerHTML = '';
        uncategorizedTasks.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            
            if (task.startTime && task.endTime) {
                const start = new Date(task.startTime);
                const end = new Date(task.endTime);
                
                // Check if task is current
                if (now >= start && now <= end) {
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
        div.className = 'task-item';
        
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

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small';
        deleteBtn.onclick = () => {
            tasks = tasks.filter(t => t !== task);
            saveTasks();
            renderTasks();
            renderCalendar();
        };
        
        div.appendChild(title);
        div.appendChild(details);
        div.appendChild(deleteBtn);
        return div;
    }

    // Calendar
    function renderCalendar() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let calendarHTML = `
            <div class="calendar-header">
                ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}
            </div>
            <div class="calendar-grid">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                <div>Thu</div><div>Fri</div><div>Sat</div>
        `;
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div></div>';
        }
        
        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const hasTask = tasks.some(task => {
                if (!task.startTime) return false;
                const taskDate = new Date(task.startTime);
                return taskDate.toDateString() === date.toDateString();
            });
            
            calendarHTML += `
                <div class="calendar-day ${hasTask ? 'has-task' : ''} 
                     ${date.toDateString() === now.toDateString() ? 'current' : ''}"
                     data-date="${date.toISOString()}">
                    ${day}
                </div>
            `;
        }
        
        calendar.innerHTML = calendarHTML + '</div>';
        
        // Add click handlers to days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => showDayTasks(day.dataset.date));
        });
    }

    function showDayTasks(dateString) {
        const date = new Date(dateString);
        const dayTasks = tasks.filter(task => {
            if (!task.startTime) return false;
            const taskDate = new Date(task.startTime);
            return taskDate.toDateString() === date.toDateString();
        });

        const modal = document.getElementById('calendarModal');
        const selectedDate = document.getElementById('selectedDate');
        const dayTasksContainer = document.getElementById('dayTasks');

        selectedDate.textContent = date.toLocaleDateString();
        dayTasksContainer.innerHTML = dayTasks.length ? 
            dayTasks.map(task => createTaskElement(task).outerHTML).join('') :
            '<p>No tasks scheduled for this day.</p>';

        showModal('calendarModal');
    }

    // Modal Management
    function showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    function hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Quick Links
    function addQuickLink(link) {
        quickLinks.push(link);
        localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
        renderQuickLinks();
    }

    function renderQuickLinks() {
        const container = document.getElementById('quickLinksList');
        container.innerHTML = quickLinks.map(link => `
            <div class="quick-link-item">
                <a href="${link.url}" target="_blank">${link.name}</a>
                <button class="btn-small" onclick="event.preventDefault(); deleteQuickLink('${link.url}')">
                    Delete
                </button>
            </div>
        `).join('');
    }

    function deleteQuickLink(url) {
        quickLinks = quickLinks.filter(link => link.url !== url);
        localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
        renderQuickLinks();
    }

    // Data Export/Import
    document.getElementById('exportData').addEventListener('click', () => {
        const data = {
            tasks: tasks,
            quickLinks: quickLinks
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fullfocus-data.txt';
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
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
                    renderTasks();
                    renderQuickLinks();
                    renderCalendar();
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    });

    // Form Submissions
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTask = {
            name: document.getElementById('taskName').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            description: document.getElementById('taskDescription').value,
            links: document.getElementById('taskLinks').value
        };
        addTask(newTask);
        taskForm.reset();
        hideModal('taskModal');
    });

    quickLinkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newLink = {
            name: document.getElementById('linkName').value,
            url: document.getElementById('linkUrl').value
        };
        addQuickLink(newLink);
        quickLinkForm.reset();
        hideModal('quickLinkModal');
    });

    // Close modals
    document.querySelectorAll('.cancel').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // Initialize
    renderTasks();
    renderQuickLinks();
    renderCalendar();
});
