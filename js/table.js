// Модуль для управления редактируемой таблицей
class TableManager {
    constructor() {
        this.tableData = storage.getTable();
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.tableHead = document.getElementById('table-head');
        this.tableBody = document.getElementById('table-body');
        this.addRowBtn = document.getElementById('add-row-btn');
        this.addColBtn = document.getElementById('add-col-btn');
        this.exportBtn = document.getElementById('export-table');
    }

    initializeEventListeners() {
        this.addRowBtn.addEventListener('click', () => {
            this.addRow();
        });

        this.addColBtn.addEventListener('click', () => {
            this.addColumn();
        });

        this.exportBtn.addEventListener('click', () => {
            this.exportToCSV();
        });

        // Делегирование событий для input в таблице
        this.tableBody.addEventListener('input', (e) => {
            if (e.target.classList.contains('cell-input')) {
                this.updateCellData(e.target);
            }
        });

        // Делегирование для заголовков колонок
        this.tableHead.addEventListener('input', (e) => {
            if (e.target.classList.contains('header-input')) {
                this.updateColumnHeader(e.target);
            }
        });

        // Делегирование для удаления строк
        this.tableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-row-btn')) {
                this.deleteRow(e.target.dataset.rowIndex);
            }
        });

        // Делегирование для удаления колонок
        this.tableHead.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-col-btn')) {
                this.deleteColumn(e.target.dataset.colIndex);
            }
        });
    }

    // Отрисовать таблицу
    renderTable() {
        this.tableData = storage.getTable();
        
        if (!this.tableData || !this.tableData.columns || !this.tableData.rows) {
            return;
        }

        // Отрисовка заголовков
        this.tableHead.innerHTML = `
            <tr>
                ${this.tableData.columns.map((col, colIndex) => `
                    <th>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="text" 
                                   class="header-input" 
                                   value="${this.escapeHtml(col)}" 
                                   data-col-index="${colIndex}"
                                   style="flex: 1;">
                            <button class="action-btn delete-col-btn" 
                                    data-col-index="${colIndex}" 
                                    title="Удалить колонку"
                                    style="font-size: 16px;">✕</button>
                        </div>
                    </th>
                `).join('')}
                <th style="width: 50px;"></th>
            </tr>
        `;

        // Отрисовка строк
        this.tableBody.innerHTML = this.tableData.rows.map((row, rowIndex) => `
            <tr>
                ${row.map((cell, colIndex) => `
                    <td>
                        <input type="text" 
                               class="cell-input" 
                               value="${this.escapeHtml(cell)}" 
                               data-row-index="${rowIndex}" 
                               data-col-index="${colIndex}">
                    </td>
                `).join('')}
                <td style="text-align: center;">
                    <button class="action-btn delete-row-btn" 
                            data-row-index="${rowIndex}" 
                            title="Удалить строку"
                            style="font-size: 16px;">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Добавить строку
    addRow() {
        const newRow = this.tableData.columns.map(() => '');
        this.tableData.rows.push(newRow);
        storage.saveTable(this.tableData);
        this.renderTable();
    }

    // Добавить колонку
    addColumn() {
        const columnName = prompt('Введите название новой колонки:');
        if (columnName === null) return;
        
        const finalName = columnName || `Колонка ${this.tableData.columns.length + 1}`;
        
        this.tableData.columns.push(finalName);
        this.tableData.rows.forEach(row => {
            row.push('');
        });
        
        storage.saveTable(this.tableData);
        this.renderTable();
    }

    // Удалить строку
    deleteRow(rowIndex) {
        if (confirm('Удалить эту строку?')) {
            this.tableData.rows.splice(rowIndex, 1);
            storage.saveTable(this.tableData);
            this.renderTable();
        }
    }

    // Удалить колонку
    deleteColumn(colIndex) {
        if (confirm('Удалить эту колонку?')) {
            this.tableData.columns.splice(colIndex, 1);
            this.tableData.rows.forEach(row => {
                row.splice(colIndex, 1);
            });
            storage.saveTable(this.tableData);
            this.renderTable();
        }
    }

    // Обновить данные ячейки
    updateCellData(input) {
        const rowIndex = parseInt(input.dataset.rowIndex);
        const colIndex = parseInt(input.dataset.colIndex);
        
        if (this.tableData.rows[rowIndex] && this.tableData.rows[rowIndex][colIndex] !== undefined) {
            this.tableData.rows[rowIndex][colIndex] = input.value;
            storage.saveTable(this.tableData);
        }
    }

    // Обновить заголовок колонки
    updateColumnHeader(input) {
        const colIndex = parseInt(input.dataset.colIndex);
        
        if (this.tableData.columns[colIndex] !== undefined) {
            this.tableData.columns[colIndex] = input.value;
            storage.saveTable(this.tableData);
        }
    }

    // Экспорт в CSV
    exportToCSV() {
        let csv = '';
        
        // Заголовки
        csv += this.tableData.columns.map(col => `"${col.replace(/"/g, '""')}"`).join(',') + '\n';
        
        // Строки
        this.tableData.rows.forEach(row => {
            csv += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
        });
        
        // Создаем Blob и скачиваем
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `таблица_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Альтернатива для iOS
        if (navigator.share) {
            const file = new File([csv], 'таблица.csv', { type: 'text/csv' });
            navigator.share({
                files: [file],
                title: 'Экспорт таблицы'
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Ошибка экспорта:', err);
                }
            });
        }
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создаем глобальный экземпляр
let tableManager;