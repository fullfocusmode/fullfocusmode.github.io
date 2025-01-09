document.addEventListener('DOMContentLoaded', () => {
    class CalendarManager {
        constructor() {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.currentView = 'month';
            this.events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.renderCalendar();
            this.loadEvents();
        }

        setupEventListeners() {
            document.getElementById('prevPeriod').addEventListener('click', () => this.changePeriod(-1));
            document.getElementById('nextPeriod').addEventListener('click', () => this.changePeriod(1));
            document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
            
            document.getElementById('monthView').addEventListener('click', () => this.changeView('month'));
            document.getElementById('weekView').addEventListener('click', () => this.changeView('week'));
            document.getElementById('dayView').addEventListener('click', () => this.changeView('day'));

            document.getElementById('eventForm').addEventListener('submit', (e) => this.handleEventSubmit(e));
            document.getElementById('addEventBtn').addEventListener('click', () => this.showEventModal());
        }

        changePeriod(delta) {
            switch(this.currentView) {
                case 'month':
                    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
                    break;
                case 'week':
                    this.currentDate.setDate(this.currentDate.getDate() + (delta * 7));
                    break;
                case 'day':
                    this.currentDate.setDate(this.currentDate.getDate() + delta);
                    break;
            }
            this.renderCalendar();
        }

        changeView(view) {
            this.currentView = view;
            document.querySelectorAll('.calendar-view-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`${view}View`).classList.add('active');
            this.renderCalendar();
        }

        goToToday() {
            this.currentDate = new Date();
            this.renderCalendar();
        }

        renderCalendar() {
            switch(this.currentView) {
                case 'month':
                    this.renderMonthView();
                    break;
                case 'week':
                    this.renderWeekView();
                    break;
                case 'day':
                    this.renderDayView();
                    break;
            }
            this.updatePeriodLabel();
        }

        updatePeriodLabel() {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"];
            let label = '';
            
            switch(this.currentView) {
                case 'month':
                    label = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
                    break;
                case 'week':
                    const weekStart = new Date(this.currentDate);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    label = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
                    break;
                case 'day':
                    label = this.currentDate.toLocaleDateString();
                    break;
            }
            
            document.getElementById('currentPeriod').textContent = label;
        }

        saveEvents() {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        }

        loadEvents() {
            this.events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
            this.renderEvents();
        }

        handleEventSubmit(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const event = {
                id: Date.now(),
                title: formData.get('eventTitle'),
                start: formData.get('eventStart'),
                end: formData.get('eventEnd'),
                description: formData.get('eventDescription'),
                category: formData.get('eventCategory'),
                color: formData.get('eventColor'),
                notifications: formData.get('eventNotification') === 'on'
            };

            this.events.push(event);
            this.saveEvents();
            this.renderCalendar();
            this.hideEventModal();
            e.target.reset();
        }

        showEventModal(date = null) {
            const modal = document.getElementById('eventModal');
            if (date) {
                document.getElementById('eventStart').value = date.toISOString().slice(0, 16);
                const endDate = new Date(date);
                endDate.setHours(endDate.getHours() + 1);
                document.getElementById('eventEnd').value = endDate.toISOString().slice(0, 16);
            }
            modal.style.display = 'block';
        }

        hideEventModal() {
            document.getElementById('eventModal').style.display = 'none';
        }
    }

    const calendarManager = new CalendarManager();
});
