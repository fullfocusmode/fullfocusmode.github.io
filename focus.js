document.addEventListener('DOMContentLoaded', () => {
    let focusSettings = Storage.get('focusSettings') || {
        focusDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsCount: 4
    };
    
    let timer = {
        timeLeft: focusSettings.focusDuration * 60,
        isRunning: false,
        interval: null,
        currentSession: 1,
        isBreak: false
    };

    function saveSettings() {
        Storage.set('focusSettings', focusSettings);
    }

    function updateDisplay() {
        const minutes = Math.floor(timer.timeLeft / 60);
        const seconds = timer.timeLeft % 60;
        document.querySelector('.time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.querySelector('.phase').textContent = timer.isBreak ? 'Break Time' : 'Focus Time';
        
        const progress = timer.isBreak ? 
            ((focusSettings.breakDuration * 60 - timer.timeLeft) / (focusSettings.breakDuration * 60)) * 100 :
            ((focusSettings.focusDuration * 60 - timer.timeLeft) / (focusSettings.focusDuration * 60)) * 100;
        
        document.querySelector('.progress').style.width = `${progress}%`;
    }

    function startTimer() {
        if (!timer.isRunning) {
            timer.isRunning = true;
            timer.interval = setInterval(() => {
                if (timer.timeLeft > 0) {
                    timer.timeLeft--;
                    updateDisplay();
                } else {
                    handleTimerComplete();
                }
            }, 1000);
            
            document.getElementById('startTimer').disabled = true;
            document.getElementById('pauseTimer').disabled = false;
        }
    }

    function handleTimerComplete() {
        if (timer.isBreak) {
            timer.currentSession++;
            startFocusSession();
        } else {
            startBreak();
        }
        
        if (Notification.permission === "granted") {
            new Notification(timer.isBreak ? "Break Time!" : "Focus Time!", {
                body: timer.isBreak ? "Take a short break" : "Time to focus",
                icon: "favicon.png"
            });
        }
    }

    document.getElementById('focusSettingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        focusSettings = {
            focusDuration: parseInt(document.getElementById('focusDuration').value),
            breakDuration: parseInt(document.getElementById('breakDuration').value),
            longBreakDuration: parseInt(document.getElementById('longBreakDuration').value),
            sessionsCount: parseInt(document.getElementById('sessionsCount').value)
        };
        saveSettings();
        hideModal('focusSettingsModal');
        resetTimer();
    });

    // Initialize
    updateDisplay();
    if ('Notification' in window) {
        Notification.requestPermission();
    }
});
