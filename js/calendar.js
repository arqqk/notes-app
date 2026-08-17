// Модуль для управления календарем
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.calendarTitle = document.getElementById('calendar-title');
        this.calendarDays = document.getElementById('calendar-days');
        this.selectedDateNotes = document.getElementById('selected-date-notes');
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
    }

    initializeEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => {
            this.changeMonth(-1);
        });

        this.nextMonthBtn.addEventListener('click', () => {
            this.changeMonth(1);
        });
    }

    // Изменить месяц
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    // Отрисовать календарь
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Заголовок календаря
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        this.calendarTitle.textContent = `${monthNames[month]} ${year}`;
        
        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        let firstDayOfWeek = firstDay.getDay(); // 0 - воскресенье, 1 - понедельник, ...
        
        // Конвертируем в формат, где 0 - понедельник
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // Количество дней в месяце
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Получаем все заметки для отметки дней с заметками
        const allNotes = storage.getNotes();
        const notesByDate = {};
        allNotes.forEach(note => {
            if (note.date) {
                if (!notesByDate[note.date]) {
                    notesByDate[note.date] = [];
                }
                notesByDate[note.date].push(note);
            }
        });
        
        // Строим календарную сетку
        let calendarHTML = '';
        
        // Пустые ячейки в начале
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Дни месяца
        const today = new Date().toISOString().split('T')[0];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === this.selectedDate;
            const hasNotes = notesByDate[dateStr] && notesByDate[dateStr].length > 0;
            
            const classes = [
                'calendar-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                hasNotes ? 'has-notes' : ''
            ].filter(Boolean).join(' ');
            
            calendarHTML += `
                <div class="${classes}" data-date="${dateStr}" onclick="calendarManager.selectDate('${dateStr}')">
                    ${day}
                </div>
            `;
        }
        
        this.calendarDays.innerHTML = calendarHTML;
        
        // Показываем заметки выбранной даты
        this.renderSelectedDateNotes();
    }

    // Выбрать дату
    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.renderCalendar();
    }

    // Показать заметки выбранной даты
    renderSelectedDateNotes() {
        const notes = storage.getNotesByDate(this.selectedDate);
        const dateFormatted = new Date(this.selectedDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        if (notes.length === 0) {
            this.selectedDateNotes.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <p>Нет заметок на ${dateFormatted}</p>
                    <button class="btn-primary" style="margin-top: 12px;" onclick="calendarManager.createNoteForDate('${this.selectedDate}')">
                        + Создать заметку
                    </button>
                </div>
            `;
            return;
        }
        
        this.selectedDateNotes.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px;">Заметки на ${dateFormatted}:</h3>
                <button class="btn-primary" style="margin-bottom: 16px;" onclick="calendarManager.createNoteForDate('${this.selectedDate}')">
                    + Создать заметку
                </button>
            </div>
            <div class="notes-list">
                ${notes.map(note => {
                    const statusInfo = notesManager.getStatusInfo(note.status);
                    return `
                        <div class="note-card ${note.status}">
                            <div class="note-header">
                                <div class="note-title">${notesManager.escapeHtml(note.title)}</div>
                                <div class="note-actions">
                                    <button class="action-btn" onclick="notesManager.openModal('${note.id}')" title="Редактировать">✏️</button>
                                    <button class="action-btn" onclick="notesManager.deleteNote('${note.id}')" title="Удалить">🗑️</button>
                                </div>
                            </div>
                            ${note.content ? `<div class="note-content">${notesManager.escapeHtml(note.content)}</div>` : ''}
                            <div class="note-footer">
                                <span class="note-status ${statusInfo.class}">${statusInfo.label}</span>
                                <select class="filter-select" onchange="notesManager.changeStatus('${note.id}', this.value)" style="padding: 4px 8px; font-size: 14px;">
                                    <option value="todo" ${note.status === 'todo' ? 'selected' : ''}>⏳ Ожидает</option>
                                    <option value="in-progress" ${note.status === 'in-progress' ? 'selected' : ''}>🔄 В процессе</option>
                                    <option value="done" ${note.status === 'done' ? 'selected' : ''}>✅ Выполнено</option>
                                </select>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Создать заметку для конкретной даты
    createNoteForDate(dateStr) {
        // Открываем модальное окно новой заметки
        notesManager.openModal();
        
        // Устанавливаем дату
        document.getElementById('note-date').value = dateStr;
    }
}

// Создаем глобальный экземпляр
let calendarManager;