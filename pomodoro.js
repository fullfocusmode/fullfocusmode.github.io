document.addEventListener('DOMContentLoaded', () => {
    class PomodoroTimer {
        constructor() {
            this.timeLeft = 25 * 60;
            this.isRunning = false;
            this.isWorkPhase = true;
            this.currentSession = 1;
            this.completedSessions = 0;
            this.totalFocusTime = 0;
            this.interval = null;
            this.settings = this.loadSettings();
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.loadStats();
            this.updateDisplay();
        }

        loadSettings() {
            return {
                workDuration: parseInt(localStorage.getItem('workDuration')) || 25,
                breakDuration: parseInt(localStorage.getItem('breakDuration')) || 5,
                longBreakDuration: parseInt(localStorage.getItem('longBreakDuration')) || 15,
                sessionsCount: parseInt(localStorage.getItem('sessionsCount')) || 4
            };
        }

        saveSettings() {
            Object.entries(this.settings).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
        }

        loadStats() {
            const today = new Date().toDateString();
            const stats = JSON.parse(localStorage.getItem(`pomodoroStats_${today}`) || '{}');
            this.completedSessions = stats.completedSessions || 0;
            this.totalFocusTime = stats.totalFocusTime || 0;
            this.updateStats();
        }

        saveStats() {
            const today = new Date().toDateString();
            localStorage.setItem(`pomodoroStats_${today}`, JSON.stringify({
                completedSessions: this.completedSessions,
                totalFocusTime: this.totalFocusTime
            }));
        }

        start() {
            if (!this.isRunning) {
                this.isRunning = true;
                document.getElementById('startTimer').disabled = true;
                document.getElementById('pauseTimer').disabled = false;
                this.interval = setInterval(() => this.tick(), 1000);
            }
        }

        pause() {
            this.isRunning = false;
            document.getElementById('startTimer').disabled = false;
            document.getElementById('pauseTimer').disabled = true;
            clearInterval(this.interval);
        }

        reset() {
            this.pause();
            this.isWorkPhase = true;
            this.timeLeft = this.settings.workDuration * 60;
            this.updateDisplay();
        }

        tick() {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                if (this.isWorkPhase) {
                    this.totalFocusTime++;
                    this.saveStats();
                }
            } else {
                this.switchPhase();
            }
            this.updateDisplay();
        }

        switchPhase() {
            if (this.isWorkPhase) {
                this.completedSessions++;
                this.saveStats();
                this.isWorkPhase = false;
                const needsLongBreak = this.completedSessions % this.settings.sessionsCount === 0;
                this.timeLeft = (needsLongBreak ? this.settings.longBreakDuration : this.settings.breakDuration) * 60;
                this.notifyPhaseChange('Break Time!');
            } else {
                this.isWorkPhase = true;
                this.timeLeft = this.settings.workDuration * 60;
                this.notifyPhaseChange('Work Time!');
            }
            this.updateDisplay();
            this.updateStats();
        }

        updateDisplay() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            document.querySelector('.time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.querySelector('.phase').textContent = this.isWorkPhase ? 'Work Time' : 'Break Time';
        }

        updateStats() {
            document.getElementById('completedSessions').textContent = this.completedSessions;
            document.getElementById('totalFocusTime').textContent = Math.floor(this.totalFocusTime / 60);
        }

        notifyPhaseChange(message) {
            if (Notification.permission === "granted") {
                new Notification(message, {
                    icon: 'favicon.png',
                    body: 'Time to switch tasks!'
                });
            }
        }

        setupEventListeners() {
            document.getElementById('startTimer').addEventListener('click', () => this.start());
            document.getElementById('pauseTimer').addEventListener('click', () => this.pause());
            document.getElementById('resetTimer').addEventListener('click', () => this.reset());

            const settingsInputs = ['workDuration', 'breakDuration', 'longBreakDuration', 'sessionsCount'];
            settingsInputs.forEach(setting => {
                const input = document.getElementById(setting);
                input.value = this.settings[setting];
                input.addEventListener('change', () => {
                    this.settings[setting] = parseInt(input.value);
                    this.saveSettings();
                    if (!this.isRunning) {
                        this.reset();
                    }
                });
            });
        }
    }

    const pomodoroTimer = new PomodoroTimer();

    if ('Notification' in window) {
        Notification.requestPermission();
    }
});
