document.addEventListener('DOMContentLoaded', () => {
    class Timer {
        constructor() {
            this.timeLeft = 0;
            this.isRunning = false;
            this.interval = null;
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
            document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
            document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());
            
            document.querySelectorAll('.timer-presets button').forEach(button => {
                button.addEventListener('click', () => {
                    this.timeLeft = parseInt(button.dataset.time);
                    this.updateDisplay();
                });
            });
        }

        startTimer() {
            if (!this.isRunning) {
                if (this.timeLeft === 0) {
                    this.timeLeft = this.getInputTime();
                }
                this.isRunning = true;
                document.getElementById('startTimer').disabled = true;
                document.getElementById('pauseTimer').disabled = false;
                this.interval = setInterval(() => this.tick(), 1000);
            }
        }

        pauseTimer() {
            this.isRunning = false;
            document.getElementById('startTimer').disabled = false;
            document.getElementById('pauseTimer').disabled = true;
            clearInterval(this.interval);
        }

        resetTimer() {
            this.pauseTimer();
            this.timeLeft = 0;
            this.updateDisplay();
            document.getElementById('hours').value = '';
            document.getElementById('minutes').value = '';
            document.getElementById('seconds').value = '';
        }

        tick() {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
            } else {
                this.timerComplete();
            }
        }

        getInputTime() {
            const hours = parseInt(document.getElementById('hours').value) || 0;
            const minutes = parseInt(document.getElementById('minutes').value) || 0;
            const seconds = parseInt(document.getElementById('seconds').value) || 0;
            return (hours * 3600) + (minutes * 60) + seconds;
        }

        updateDisplay() {
            const hours = Math.floor(this.timeLeft / 3600);
            const minutes = Math.floor((this.timeLeft % 3600) / 60);
            const seconds = this.timeLeft % 60;
            document.querySelector('.time').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        timerComplete() {
            this.pauseTimer();
            if (Notification.permission === "granted") {
                new Notification("Timer Complete!", {
                    body: "Your timer has finished!",
                    icon: "favicon.png"
                });
            }
        }
    }

    new Timer();
});
