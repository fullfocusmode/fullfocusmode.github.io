document.addEventListener('DOMContentLoaded', () => {
    const Storage = window.appUtils.Storage;
    
    class AnalyticsManager {
        constructor() {
            this.tasks = Storage.get('tasks') || [];
            this.completedTasks = Storage.get('completedTasks') || {};
            this.timeRange = document.getElementById('timeRange').value;
            this.init();
        }

        init() {
            this.renderOverview();
            this.renderTaskAnalysis();
            this.renderTrends();
            this.setupEventListeners();
        }

        renderOverview() {
            const stats = this.calculateStats();
            document.getElementById('completionRate').textContent = `${stats.completionRate}%`;
            document.getElementById('focusTime').textContent = `${stats.totalFocusHours}h`;
            document.getElementById('productivity').textContent = `${stats.productivityScore}%`;

            const ctx = document.getElementById('performanceChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stats.dates,
                    datasets: [{
                        label: 'Productivity',
                        data: stats.productivityTrend,
                        borderColor: '#4a90e2',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        calculateStats() {
            const now = new Date();
            const stats = {
                completionRate: 0,
                totalFocusHours: 0,
                productivityScore: 0,
                dates: [],
                productivityTrend: []
            };

            // Calculate statistics based on timeRange
            return stats;
        }

        setupEventListeners() {
            document.getElementById('timeRange').addEventListener('change', () => {
                this.timeRange = document.getElementById('timeRange').value;
                this.renderOverview();
                this.renderTaskAnalysis();
                this.renderTrends();
            });
        }
    }

    const analyticsManager = new AnalyticsManager();
});
