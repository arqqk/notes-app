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
        this.importBtn = document.getElementById('import-table');
        this.pasteBtn = document.getElementById('paste-table');
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

        this.importBtn.addEventListener('click', () => {
            this.importFromCSV();
        });

        this.pasteBtn.addEventListener('click', () => {
            this.pasteFromClipboard();
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

    // Импорт из CSV или XLSX
    importFromCSV() {
        // Создаем скрытый input для выбора файла
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                this.importCSVFile(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                this.importXLSXFile(file);
            } else {
                alert('Неподдерживаемый формат файла. Используйте CSV или XLSX');
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    // Импорт CSV файла
    importCSVFile(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const csvText = event.target.result;
                const tableData = this.parseCSV(csvText);
                
                if (tableData && tableData.columns.length > 0) {
                    if (confirm(`Импортировать таблицу? (${tableData.rows.length} строк, ${tableData.columns.length} колонок)`)) {
                        this.tableData = tableData;
                        storage.saveTable(this.tableData);
                        this.renderTable();
                        alert('Таблица успешно импортирована!');
                    }
                } else {
                    alert('Не удалось распознать данные в файле');
                }
            } catch (error) {
                console.error('Ошибка импорта CSV:', error);
                alert('Ошибка при импорте файла');
            }
        };
        
        reader.onerror = () => {
            alert('Ошибка при чтении файла');
        };
        
        reader.readAsText(file);
    }

    // Импорт XLSX файла
    importXLSXFile(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Получаем первый лист
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Конвертируем в JSON (массив массивов)
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
                
                if (jsonData && jsonData.length > 0) {
                    const columns = jsonData[0].map(col => String(col));
                    const rows = jsonData.slice(1).map(row => 
                        row.map(cell => String(cell))
                    );
                    
                    if (confirm(`Импортировать таблицу? (${rows.length} строк, ${columns.length} колонок)`)) {
                        this.tableData = {
                            columns: columns,
                            rows: rows
                        };
                        storage.saveTable(this.tableData);
                        this.renderTable();
                        alert('Таблица успешно импортирована!');
                    }
                } else {
                    alert('Не удалось распознать данные в файле');
                }
            } catch (error) {
                console.error('Ошибка импорта XLSX:', error);
                alert('Ошибка при импорте XLSX файла. Убедитесь, что библиотека XLSX загружена.');
            }
        };
        
        reader.onerror = () => {
            alert('Ошибка при чтении файла');
        };
        
        reader.readAsArrayBuffer(file);
    }

    // Вставка из буфера обмена
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            
            if (!text || text.trim() === '') {
                alert('Буфер обмена пуст');
                return;
            }
            
            const tableData = this.parseCSV(text);
            
            if (tableData && tableData.columns.length > 0) {
                if (confirm(`Импортировать таблицу из буфера? (${tableData.rows.length} строк, ${tableData.columns.length} колонок)`)) {
                    this.tableData = tableData;
                    storage.saveTable(this.tableData);
                    this.renderTable();
                    alert('Таблица успешно импортирована!');
                }
            } else {
                alert('Не удалось распознать данные из буфера. Убедитесь, что данные разделены запятыми (CSV формат)');
            }
        } catch (error) {
            console.error('Ошибка вставки:', error);
            alert('Не удалось получить доступ к буферу обмена');
        }
    }

    // Парсинг CSV
    parseCSV(csvText) {
        const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim());
        
        if (lines.length === 0) return null;
        
        const parseLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            
            return result.map(cell => cell.replace(/^"|"$/g, ''));
        };
        
        const columns = parseLine(lines[0]);
        const rows = lines.slice(1).map(line => parseLine(line));
        
        // Проверяем, что все строки имеют одинаковое количество колонок
        const validRows = rows.filter(row => row.length === columns.length);
        
        return {
            columns: columns,
            rows: validRows
        };
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
