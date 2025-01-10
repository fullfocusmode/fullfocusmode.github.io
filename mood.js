document.addEventListener('DOMContentLoaded', () => {
    let moods = JSON.parse(localStorage.getItem('moods')) || [];
    
    function saveMoods() {
        localStorage.setItem('moods', JSON.stringify(moods));
    }

    function renderMoodCalendar() {
        const calendar = document.getElementById('moodCalendar');
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        
        const monthData = moods.filter(mood => {
            const moodDate = new Date(mood.date);
            return moodDate.getMonth() === month && moodDate.getFullYear() === year;
        });

        // Calendar rendering logic here
        // Similar to the main calendar but with mood indicators
    }

    function renderMoodStats() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        const moodCounts = [0, 0, 0, 0, 0];
        
        moods.forEach(mood => {
            moodCounts[mood.value - 1]++;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Very Bad', 'Bad', 'Neutral', 'Good', 'Very Good'],
                datasets: [{
                    label: 'Mood Distribution',
                    data: moodCounts,
                    backgroundColor: [
                        '#ff4444',
                        '#ffbb33',
                        '#4a90e2',
                        '#00C851',
                        '#2BBBAD'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Initialize mood tracking
    renderMoodCalendar();
    renderMoodStats();
});
