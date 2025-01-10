document.addEventListener('DOMContentLoaded', () => {
    let goals = JSON.parse(localStorage.getItem('goals')) || [];
    
    function saveGoals() {
        localStorage.setItem('goals', JSON.stringify(goals));
    }

    function renderGoals() {
        const activeGoals = goals.filter(goal => !goal.completed);
        const completedGoals = goals.filter(goal => goal.completed);

        renderGoalsList(activeGoals, 'activeGoalsList');
        renderGoalsList(completedGoals, 'completedGoalsList');
    }

    function renderGoalsList(goalsList, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        goalsList.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';
            goalElement.innerHTML = `
                <div class="goal-header">
                    <h3>${goal.title}</h3>
                    <span class="goal-category">${goal.category}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${calculateProgress(goal)}%"></div>
                    </div>
                    <span class="progress-text">${calculateProgress(goal)}%</span>
                </div>
                <div class="goal-milestones">
                    ${renderMilestones(goal.milestones)}
                </div>
                <div class="goal-actions">
                    <button onclick="toggleGoalComplete(${goal.id})" class="btn-small">
                        ${goal.completed ? 'Reactivate' : 'Complete'}
                    </button>
                    <button onclick="editGoal(${goal.id})" class="btn-small">Edit</button>
                    <button onclick="deleteGoal(${goal.id})" class="btn-small delete">Delete</button>
                </div>
            `;
            container.appendChild(goalElement);
        });
    }

    function calculateProgress(goal) {
        if (!goal.milestones || goal.milestones.length === 0) return 0;
        const completed = goal.milestones.filter(m => m.completed).length;
        return Math.round((completed / goal.milestones.length) * 100);
    }

    function renderMilestones(milestones) {
        if (!milestones || milestones.length === 0) return '<p>No milestones set</p>';
        return milestones.map(milestone => `
            <div class="milestone ${milestone.completed ? 'completed' : ''}">
                <input type="checkbox" ${milestone.completed ? 'checked' : ''} 
                       onchange="toggleMilestone(${milestone.id})">
                <span>${milestone.text}</span>
            </div>
        `).join('');
    }

    document.getElementById('goalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newGoal = {
            id: Date.now(),
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            deadline: document.getElementById('goalDeadline').value,
            category: document.getElementById('goalCategory').value,
            milestones: getMilestones(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        goals.push(newGoal);
        saveGoals();
        renderGoals();
        hideModal('goalModal');
        e.target.reset();
    });

    // Initialize
    renderGoal
