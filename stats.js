document.addEventListener('DOMContentLoaded', () => {
    const Storage = window.appUtils.Storage;
    
    class StatsManager {
        constructor() {
            this.tasks = Storage.get('tasks') || [];
            this.completedTasks = Storage.get('completedTasks') || {};
            this.init();
        }

        init() {
            this.renderSummary();
            this.renderTimeDistribution();
            this.renderProductivityPatterns();
            this.renderDetailedMetrics();
            this.setupExport();
        }

        renderSummary() {
            const stats = this.calculateSummaryStats();
            document.getElementById('totalTasks').textContent = stats.totalTasks;
            document.getElementById('avgCompletion').textContent = `${stats.avgCompletion}h`;
            document.getElementById('streakDays').textContent = stats.streak;
        }

        renderTimeDistribution() {
            const ctx = document.getElementById('timeDistributionChart').getContext('2d');
            const data = this.calculateTimeDistribution();

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
                    datasets: [{
                        data: data,
                        backgroundColor: ['#4a90e2', '#2BBBAD', '#ffbb33', '#ff4444']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        setupExport() {
            document.getElementById('exportStats').addEventListener('click', () => {
                const stats = {
                    summary: this.calculateSummaryStats(),
                    timeDistribution: this.calculateTimeDistribution(),
                    patterns: this.calculateProductivityPatterns()
                };

                const blob = new Blob([JSON.stringify(stats, null, 2)], 
                    { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fullfocus_stats.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }

    const statsManager = new StatsManager();
});
