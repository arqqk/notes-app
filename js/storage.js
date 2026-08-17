// Модуль для работы с localStorage
class Storage {
    constructor() {
        this.notesKey = 'app_notes';
        this.tableKey = 'app_table_v2';
        this.initStorage();
    }

    // Инициализация хранилища
    initStorage() {
        if (!localStorage.getItem(this.notesKey)) {
            localStorage.setItem(this.notesKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.tableKey)) {
            const defaultTable = {
                columns: ['', '', ''],
                rows: [
                    ['', '', ''],
                    ['', '', '']
                ]
            };
            localStorage.setItem(this.tableKey, JSON.stringify(defaultTable));
        }
    }

    // Получить все заметки
    getNotes() {
        try {
            return JSON.parse(localStorage.getItem(this.notesKey)) || [];
        } catch (e) {
            console.error('Ошибка при чтении заметок:', e);
            return [];
        }
    }

    // Сохранить все заметки
    saveNotes(notes) {
        try {
            localStorage.setItem(this.notesKey, JSON.stringify(notes));
            return true;
        } catch (e) {
            console.error('Ошибка при сохранении заметок:', e);
            return false;
        }
    }

    // Получить заметку по ID
    getNoteById(id) {
        const notes = this.getNotes();
        return notes.find(note => note.id === id) || null;
    }

    // Добавить новую заметку
    addNote(note) {
        const notes = this.getNotes();
        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...note
        };
        notes.unshift(newNote);
        this.saveNotes(notes);
        return newNote;
    }

    // Обновить заметку
    updateNote(id, updates) {
        const notes = this.getNotes();
        const index = notes.findIndex(note => note.id === id);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveNotes(notes);
            return notes[index];
        }
        return null;
    }

    // Удалить заметку
    deleteNote(id) {
        const notes = this.getNotes();
        const filtered = notes.filter(note => note.id !== id);
        this.saveNotes(filtered);
        return filtered.length !== notes.length;
    }

    // Изменить статус заметки
    changeNoteStatus(id, status) {
        return this.updateNote(id, { status });
    }

    // Получить заметки по дате
    getNotesByDate(date) {
        const notes = this.getNotes();
        return notes.filter(note => note.date === date);
    }

    // Получить заметки по статусу
    getNotesByStatus(status) {
        if (status === 'all') {
            return this.getNotes();
        }
        return this.getNotes().filter(note => note.status === status);
    }

    // Получить таблицу
    getTable() {
        try {
            return JSON.parse(localStorage.getItem(this.tableKey)) || null;
        } catch (e) {
            console.error('Ошибка при чтении таблицы:', e);
            return null;
        }
    }

    // Сохранить таблицу
    saveTable(table) {
        try {
            localStorage.setItem(this.tableKey, JSON.stringify(table));
            return true;
        } catch (e) {
            console.error('Ошибка при сохранении таблицы:', e);
            return false;
        }
    }

    // Экспорт всех данных
    exportAllData() {
        const data = {
            notes: this.getNotes(),
            table: this.getTable(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    // Импорт данных
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.notes && Array.isArray(data.notes)) {
                this.saveNotes(data.notes);
            }
            if (data.table && data.table.columns && data.table.rows) {
                this.saveTable(data.table);
            }
            return true;
        } catch (e) {
            console.error('Ошибка при импорте данных:', e);
            return false;
        }
    }

    // Очистить все данные
    clearAllData() {
        localStorage.removeItem(this.notesKey);
        localStorage.removeItem(this.tableKey);
        this.initStorage();
    }
}

// Создаем глобальный экземпляр
const storage = new Storage();
