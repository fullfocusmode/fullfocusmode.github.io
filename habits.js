document.addEventListener('DOMContentLoaded', () => {
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    
    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function renderHabits() {
        const habitsList = document.getElementById('habitsList');
        habitsList.innerHTML = '';

        habits.forEach(habit => {
            const habitElement = document.createElement('div');
            habitElement.className = 'habit-item';
            habitElement.style.borderLeftColor = habit.color;
            
            habitElement.innerHTML = `
                <div class="habit-header">
                    <h3>${habit.name}</h3>
                    <span class="habit-streak">${habit.streak || 0} day streak</span>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar" style="width: ${calculateProgress(habit)}%"></div>
                </div>
                <div class="habit-actions">
                    <button class="btn-small" onclick="markHabit(${habit.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-small delete" onclick="deleteHabit(${habit.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            habitsList.appendChild(habitElement);
        });
    }

    function calculateProgress(habit) {
        const today = new Date();
        const completedDays = habit.completedDates?.filter(date => 
            new Date(date).getMonth() === today.getMonth()
        ).length || 0;
        
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return (completedDays / daysInMonth) * 100;
    }

    document.getElementById('habitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newHabit = {
            id: Date.now(),
            name: document.getElementById('habitName').value,
            frequency: document.getElementById('habitFrequency').value,
            color: document.getElementById('habitColor').value,
            description: document.getElementById('habitDescription').value,
            streak: 0,
            completedDates: []
        };
        
        habits.push(newHabit);
        saveHabits();
        renderHabits();
        hideModal('habitModal');
        e.target.reset();
    });

    document.getElementById('addHabitBtn').addEventListener('click', () => {
        showModal('habitModal');
    });

    // Initialize
    renderHabits();
});
