document.addEventListener('DOMContentLoaded', () => {
    class FlashcardManager {
        constructor() {
            this.sets = Storage.get('flashcardSets') || [];
            this.currentSet = null;
            this.currentCard = 0;
            this.isFlipped = false;
            this.init();
        }

        init() {
            this.renderSets();
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.getElementById('createSetBtn').addEventListener('click', () => {
                showModal('createSetModal');
            });

            document.getElementById('createSetForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createSet();
            });

            document.getElementById('addCardBtn').addEventListener('click', () => {
                this.addCardInput();
            });

            document.getElementById('flipCard')?.addEventListener('click', () => {
                this.flipCard();
            });

            document.getElementById('prevCard')?.addEventListener('click', () => {
                this.prevCard();
            });

            document.getElementById('nextCard')?.addEventListener('click', () => {
                this.nextCard();
            });
        }

        createSet() {
            const title = document.getElementById('setTitle').value;
            const cardInputs = document.querySelectorAll('.card-input');
            const cards = Array.from(cardInputs).map(input => ({
                front: input.querySelector('input:first-child').value,
                back: input.querySelector('input:last-child').value
            }));

            const newSet = {
                id: Date.now(),
                title,
                cards,
                created: new Date().toISOString(),
                lastStudied: null
            };

            this.sets.push(newSet);
            this.saveSets();
            this.renderSets();
            hideModal('createSetModal');
        }

        addCardInput() {
            const cardsList = document.getElementById('cardsList');
            const cardInput = document.createElement('div');
            cardInput.className = 'card-input';
            cardInput.innerHTML = `
                <input type="text" placeholder="Front" required>
                <input type="text" placeholder="Back" required>
                <button type="button" class="remove-card"><i class="fas fa-trash"></i></button>
            `;

            cardInput.querySelector('.remove-card').addEventListener('click', () => {
                cardInput.remove();
            });

            cardsList.appendChild(cardInput);
        }

        renderSets() {
            const container = document.getElementById('flashcardSets');
            container.innerHTML = this.sets.map(set => `
                <div class="flashcard-set">
                    <div class="set-info">
                        <h3>${set.title}</h3>
                        <span>${set.cards.length} cards</span>
                    </div>
                    <div class="set-actions">
                        <button onclick="studySet(${set.id})" class="btn-primary">Study</button>
                        <button onclick="editSet(${set.id})" class="btn-small">Edit</button>
                        <button onclick="deleteSet(${set.id})" class="btn-small delete">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        studySet(setId) {
            this.currentSet = this.sets.find(set => set.id === setId);
            this.currentCard = 0;
            this.isFlipped = false;
            this.showStudyArea();
            this.renderCurrentCard();
        }

        showStudyArea() {
            document.querySelector('.flashcard-sets').style.display = 'none';
            document.querySelector('.study-area').style.display = 'block';
        }

        renderCurrentCard() {
            if (!this.currentSet || !this.currentSet.cards[this.currentCard]) return;
            
            const card = this.currentSet.cards[this.currentCard];
            document.querySelector('.flashcard-front').textContent = card.front;
            document.querySelector('.flashcard-back').textContent = card.back;
            document.querySelector('.flashcard').classList.remove('flipped');
            this.isFlipped = false;
        }

        flipCard() {
            document.querySelector('.flashcard').classList.toggle('flipped');
            this.isFlipped = !this.isFlipped;
        }

        nextCard() {
            if (this.currentCard < this.currentSet.cards.length - 1) {
                this.currentCard++;
                this.renderCurrentCard();
            }
        }

        prevCard() {
            if (this.currentCard > 0) {
                this.currentCard--;
                this.renderCurrentCard();
            }
        }

        saveSets() {
            Storage.set('flashcardSets', this.sets);
        }
    }

    new FlashcardManager();
});
