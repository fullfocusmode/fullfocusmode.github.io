document.addEventListener('DOMContentLoaded', () => {
    class SkillManager {
        constructor() {
            this.skills = Storage.get('skills') || [];
            this.init();
        }

        init() {
            this.renderSkills();
            this.setupEventListeners();
            document.getElementById('skillLevel').addEventListener('input', (e) => {
                document.getElementById('skillLevelDisplay').textContent = `${e.target.value}/5`;
            });
        }

        setupEventListeners() {
            document.getElementById('skillForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSkill({
                    id: Date.now(),
                    name: document.getElementById('skillName').value,
                    category: document.getElementById('skillCategory').value,
                    level: document.getElementById('skillLevel').value,
                    notes: document.getElementById('skillNotes').value,
                    lastPracticed: new Date().toISOString(),
                    progress: []
                });
                hideModal('skillModal');
                e.target.reset();
            });

            document.getElementById('addSkillBtn').addEventListener('click', () => {
                showModal('skillModal');
            });
        }

        addSkill(skill) {
            this.skills.push(skill);
            this.saveSkills();
            this.renderSkills();
        }

        saveSkills() {
            Storage.set('skills', this.skills);
        }

        renderSkills() {
            const container = document.getElementById('skillsList');
            container.innerHTML = '';

            const categories = {};
            this.skills.forEach(skill => {
                if (!categories[skill.category]) {
                    categories[skill.category] = [];
                }
                categories[skill.category].push(skill);
            });

            Object.entries(categories).forEach(([category, skills]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'skill-category';
                categoryDiv.innerHTML = `<h3>${category}</h3>`;

                skills.forEach(skill => {
                    const skillElement = this.createSkillElement(skill);
                    categoryDiv.appendChild(skillElement);
                });

                container.appendChild(categoryDiv);
            });
        }

        createSkillElement(skill) {
            const div = document.createElement('div');
            div.className = 'skill-item';
            div.innerHTML = `
                <div class="skill-header">
                    <h4>${skill.name}</h4>
                    <div class="skill-level">
                        ${'★'.repeat(skill.level)}${'☆'.repeat(5 - skill.level)}
                    </div>
                </div>
                <div class="skill-notes">${skill.notes}</div>
                <div class="skill-actions">
                    <button onclick="updateSkillLevel(${skill.id})">Update Level</button>
                    <button onclick="deleteSkill(${skill.id})" class="delete">Delete</button>
                </div>
            `;
            return div;
        }
    }

    new SkillManager();
});
