// Модуль для управления заметками
class NotesManager {
    constructor() {
        this.notes = storage.getNotes();
        this.currentFilter = 'all';
        this.editingNoteId = null;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.notesList = document.getElementById('notes-list');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.statusFilter = document.getElementById('status-filter');
        this.noteModal = document.getElementById('note-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.closeModalBtn = document.getElementById('close-modal');
        this.saveNoteBtn = document.getElementById('save-note');
        this.shareNoteBtn = document.getElementById('share-note');
        this.noteTitleInput = document.getElementById('note-title');
        this.noteContentInput = document.getElementById('note-content');
        this.noteDateInput = document.getElementById('note-date');
        this.noteStatusInput = document.getElementById('note-status');
    }

    initializeEventListeners() {
        // Открытие модального окна для новой заметки
        this.addNoteBtn.addEventListener('click', () => {
            this.openModal();
        });

        // Закрытие модального окна
        this.closeModalBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // Клик вне модального окна для закрытия
        this.noteModal.addEventListener('click', (e) => {
            if (e.target === this.noteModal) {
                this.closeModal();
            }
        });

        // Сохранение заметки
        this.saveNoteBtn.addEventListener('click', () => {
            this.saveCurrentNote();
        });

        // Фильтрация по статусу
        this.statusFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderNotes();
        });

        // Шеринг заметки
        this.shareNoteBtn.addEventListener('click', () => {
            this.shareCurrentNote();
        });
    }

    // Открыть модальное окно
    openModal(noteId = null) {
        this.editingNoteId = noteId;
        
        if (noteId) {
            const note = storage.getNoteById(noteId);
            if (note) {
                this.modalTitle.textContent = 'Редактировать заметку';
                this.noteTitleInput.value = note.title || '';
                this.noteContentInput.value = note.content || '';
                this.noteDateInput.value = note.date || '';
                this.noteStatusInput.value = note.status || 'todo';
            }
        } else {
            this.modalTitle.textContent = 'Новая заметка';
            this.noteTitleInput.value = '';
            this.noteContentInput.value = '';
            this.noteDateInput.value = new Date().toISOString().split('T')[0];
            this.noteStatusInput.value = 'todo';
        }
        
        this.noteModal.classList.add('open');
    }

    // Закрыть модальное окно
    closeModal() {
        this.noteModal.classList.remove('open');
        this.editingNoteId = null;
    }

    // Сохранить текущую заметку
    saveCurrentNote() {
        const title = this.noteTitleInput.value.trim();
        const content = this.noteContentInput.value.trim();
        const date = this.noteDateInput.value;
        const status = this.noteStatusInput.value;

        if (!title) {
            alert('Введите заголовок заметки');
            return;
        }

        const noteData = {
            title,
            content,
            date,
            status
        };

        if (this.editingNoteId) {
            storage.updateNote(this.editingNoteId, noteData);
        } else {
            storage.addNote(noteData);
        }

        this.closeModal();
        this.renderNotes();
        
        // Обновляем календарь
        if (typeof calendarManager !== 'undefined') {
            calendarManager.renderCalendar();
        }
    }

    // Поделиться заметкой
    async shareCurrentNote() {
        const title = this.noteTitleInput.value.trim();
        const content = this.noteContentInput.value.trim();
        
        if (!title && !content) {
            alert('Нет данных для отправки');
            return;
        }

        const shareText = `📝 ${title}\n\n${content}`;
        
        // Используем Web Share API для iPhone
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Заметка',
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.fallbackShare(shareText);
                }
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    // Запасной метод шеринга (копирование в буфер)
    fallbackShare(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Текст скопирован в буфер обмена');
        }).catch(() => {
            prompt('Скопируйте текст:', text);
        });
    }

    // Изменить статус заметки
    changeStatus(noteId, newStatus) {
        storage.changeNoteStatus(noteId, newStatus);
        this.renderNotes();
        
        // Обновляем календарь
        if (typeof calendarManager !== 'undefined') {
            calendarManager.renderCalendar();
        }
    }

    // Удалить заметку
    deleteNote(noteId) {
        if (confirm('Удалить эту заметку?')) {
            storage.deleteNote(noteId);
            this.renderNotes();
            
            // Обновляем календарь
            if (typeof calendarManager !== 'undefined') {
                calendarManager.renderCalendar();
            }
        }
    }

    // Поделиться существующей заметкой
    async shareNoteById(noteId) {
        const note = storage.getNoteById(noteId);
        if (!note) return;

        const shareText = `📝 ${note.title}\n\n${note.content}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: note.title,
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.fallbackShare(shareText);
                }
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    // Отрисовка списка заметок
    renderNotes() {
        this.notes = storage.getNotes();
        const filteredNotes = storage.getNotesByStatus(this.currentFilter);
        
        if (filteredNotes.length === 0) {
            this.notesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <p>Нет заметок</p>
                    <p style="font-size: 14px;">Нажмите "+ Новая заметка" для создания</p>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = filteredNotes.map(note => {
            const statusInfo = this.getStatusInfo(note.status);
            const noteDate = note.date ? new Date(note.date).toLocaleDateString('ru-RU') : '';
            
            return `
                <div class="note-card ${note.status}" data-note-id="${note.id}">
                    <div class="note-header">
                        <div class="note-title">${this.escapeHtml(note.title)}</div>
                        <div class="note-actions">
                            <button class="action-btn" onclick="notesManager.shareNoteById('${note.id}')" title="Поделиться">📤</button>
                            <button class="action-btn" onclick="notesManager.openModal('${note.id}')" title="Редактировать">✏️</button>
                            <button class="action-btn" onclick="notesManager.deleteNote('${note.id}')" title="Удалить">🗑️</button>
                        </div>
                    </div>
                    ${note.content ? `<div class="note-content">${this.escapeHtml(note.content)}</div>` : ''}
                    <div class="note-footer">
                        <span class="note-status ${statusInfo.class}">${statusInfo.label}</span>
                        ${noteDate ? `<span>📅 ${noteDate}</span>` : ''}
                        <select class="filter-select" onchange="notesManager.changeStatus('${note.id}', this.value)" style="padding: 4px 8px; font-size: 14px;">
                            <option value="todo" ${note.status === 'todo' ? 'selected' : ''}>⏳ Ожидает</option>
                            <option value="in-progress" ${note.status === 'in-progress' ? 'selected' : ''}>🔄 В процессе</option>
                            <option value="done" ${note.status === 'done' ? 'selected' : ''}>✅ Выполнено</option>
                        </select>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Получить информацию о статусе
    getStatusInfo(status) {
        const statuses = {
            'todo': { label: '⏳ Ожидает', class: 'status-todo' },
            'in-progress': { label: '🔄 В процессе', class: 'status-in-progress' },
            'done': { label: '✅ Выполнено', class: 'status-done' }
        };
        return statuses[status] || statuses.todo;
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создаем глобальный экземпляр
let notesManager;