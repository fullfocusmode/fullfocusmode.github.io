document.addEventListener('DOMContentLoaded', () => {
    const Storage = {
        get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    };

    class DashboardManager {
        constructor() {
            this.tasks = Storage.get('tasks') || [];
            this.completedTasks = Storage.get('completedTasks') || {};
            this.init();
        }

        init() {
            this.renderTaskStats();
            this.renderProductivityScore();
            this.renderRecentActivity();
            this.renderUpcomingTasks();
            this.initCharts();
            this.setupEventListeners();
        }

        calculateTaskStats() {
            const now = new Date();
            const stats = {
                total: this.tasks.length,
                completed: 0,
                overdue: 0,
                upcoming: 0
            };

            Object.values(this.completedTasks).forEach(tasks => {
                stats.completed += tasks.length;
            });

            this.tasks.forEach(task => {
                if (task.endTime && new Date(task.endTime) < now) {
                    stats.overdue++;
                } else {
                    stats.upcoming++;
                }
            });

            return stats;
        }

        calculateProductivityScore() {
            const stats = this.calculateTaskStats();
            const totalTasks = stats.completed + stats.total;
            if (totalTasks === 0) return 0;
            
            const completionRate = stats.completed / totalTasks;
            const overdueRate = stats.overdue / totalTasks;
            return Math.round((completionRate - overdueRate) * 100);
        }

        renderTaskStats() {
            const stats = this.calculateTaskStats();
            const statsContainer = document.getElementById('taskStats');
            
            statsContainer.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-value">${stats.total}</span>
                        <span class="stat-label">Active Tasks</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.completed}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.overdue}</span>
                        <span class="stat-label">Overdue</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.upcoming}</span>
                        <span class="stat-label">Upcoming</span>
                    </div>
                </div>
            `;
        }

        renderProductivityScore() {
            const score = this.calculateProductivityScore();
            document.getElementById('productivityScore').textContent = score;
        }

        renderRecentActivity() {
            const recentActivity = document.getElementById('recentActivity');
            const activities = this.getRecentActivities();
            
            recentActivity.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <i class="fas ${activity.icon}"></i>
                    <div class="activity-details">
                        <span class="activity-text">${activity.text}</span>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
        }

        renderUpcomingTasks() {
            const upcomingTasks = document.getElementById('upcomingTasks');
            const tasks = this.getUpcomingTasks();
            
            upcomingTasks.innerHTML = tasks.map(task => `
                <div class="upcoming-task">
                    <span class="task-name">${task.name}</span>
                    <span class="task-due">${new Date(task.endTime).toLocaleString()}</span>
                </div>
            `).join('');
        }

        initCharts() {
            const ctx = document.getElementById('taskChart').getContext('2d');
            const stats = this.calculateTaskStats();
            
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Active', 'Completed', 'Overdue'],
                    datasets: [{
                        data: [stats.total, stats.completed, stats.overdue],
                        backgroundColor: ['#4a90e2', '#4CAF50', '#ff4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        getRecentActivities() {
            const activities = [];
            const now = new Date();
            
            Object.entries(this.completedTasks).forEach(([date, tasks]) => {
                tasks.forEach(task => {
                    activities.push({
                        text: `Completed: ${task.name}`,
                        time: new Date(date).toLocaleString(),
                        icon: 'fa-check-circle'
                    });
                });
            });

            return activities.sort((a, b) => 
                new Date(b.time) - new Date(a.time)
            ).slice(0, 5);
        }

        getUpcomingTasks() {
            return this.tasks
                .filter(task => task.endTime && new Date(task.endTime) > new Date())
                .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
                .slice(0, 5);
        }

        setupEventListeners() {
            document.getElementById('openSidebar').addEventListener('click', () => {
                document.getElementById('sidebar').classList.add('active');
            });

            document.getElementById('closeSidebar').addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('active');
            });
        }
    }

    const dashboardManager = new DashboardManager();
});
