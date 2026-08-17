// Основной модуль приложения
class App {
    constructor() {
        this.currentView = 'notes';
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeApp();
    }

    initializeElements() {
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.views = {
            notes: document.getElementById('view-notes'),
            calendar: document.getElementById('view-calendar'),
            table: document.getElementById('view-table')
        };
    }

    initializeEventListeners() {
        // Навигация между вкладками
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                this.switchView(view);
            });
        });

        // Обработка свайпов для навигации
        this.initializeSwipeNavigation();

        // Обработка клавиатурных сокращений
        this.initializeKeyboardShortcuts();

        // Обработка видимости приложения
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshCurrentView();
            }
        });
    }

    initializeApp() {
        // Инициализация менеджеров
        notesManager = new NotesManager();
        calendarManager = new CalendarManager();
        tableManager = new TableManager();

        // Отрисовка начальных данных
        this.renderAll();

        // Регистрация Service Worker
        this.registerServiceWorker();

        // Обработка установки PWA
        this.initializePWAInstall();

        console.log('Приложение инициализировано');
    }

    // Переключение видов
    switchView(view) {
        if (!this.views[view]) return;

        // Обновляем навигацию
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Обновляем виды
        Object.keys(this.views).forEach(key => {
            this.views[key].classList.toggle('active', key === view);
        });

        this.currentView = view;
        
        // Обновляем данные при переключении
        this.refreshCurrentView();
    }

    // Обновить текущий вид
    refreshCurrentView() {
        switch (this.currentView) {
            case 'notes':
                if (notesManager) notesManager.renderNotes();
                break;
            case 'calendar':
                if (calendarManager) calendarManager.renderCalendar();
                break;
            case 'table':
                if (tableManager) tableManager.renderTable();
                break;
        }
    }

    // Отрисовать все виды
    renderAll() {
        if (notesManager) notesManager.renderNotes();
        if (calendarManager) calendarManager.renderCalendar();
        if (tableManager) tableManager.renderTable();
    }

    // Навигация свайпами
    initializeSwipeNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 100;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX, swipeThreshold);
        }, { passive: true });
    }

    // Обработка свайпа
    handleSwipe(startX, endX, threshold) {
        const deltaX = endX - startX;
        
        if (Math.abs(deltaX) < threshold) return;

        const views = ['notes', 'calendar', 'table'];
        const currentIndex = views.indexOf(this.currentView);
        
        if (deltaX < 0 && currentIndex < views.length - 1) {
            // Свайп влево - следующая вкладка
            this.switchView(views[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
            // Свайп вправо - предыдущая вкладка
            this.switchView(views[currentIndex - 1]);
        }
    }

    // Клавиатурные сокращения
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 1,2,3 для переключения вкладок
            if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
                e.preventDefault();
                const views = ['notes', 'calendar', 'table'];
                const index = parseInt(e.key) - 1;
                if (views[index]) {
                    this.switchView(views[index]);
                }
            }
            
            // Escape для закрытия модальных окон
            if (e.key === 'Escape') {
                const modal = document.getElementById('note-modal');
                if (modal && modal.classList.contains('open')) {
                    notesManager.closeModal();
                }
            }
            
            // Ctrl/Cmd + N для новой заметки
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (notesManager) {
                    notesManager.openModal();
                }
            }
        });
    }

    // Регистрация Service Worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/notes-app/sw.js')
                    .then(registration => {
                        console.log('Service Worker зарегистрирован:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Ошибка регистрации Service Worker:', error);
                    });
            });
        }
    }

    // Инициализация установки PWA
    initializePWAInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            // Предотвращаем автоматическое появление промпта
            e.preventDefault();
            deferredPrompt = e;
            
            // Показываем кнопку установки (для Android)
            // На iPhone пользователь сам добавляет через Safari
            if (!this.isIOS()) {
                this.showInstallButton(deferredPrompt);
            }
        });

        // Определяем, запущено ли приложение как PWA
        if (this.isPWA()) {
            document.body.classList.add('pwa-mode');
        }
    }

    // Показать кнопку установки
    showInstallButton(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.textContent = '📲 Установить приложение';
        installBtn.className = 'btn-secondary';
        installBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                console.log('Результат установки:', result.outcome);
                deferredPrompt = null;
                installBtn.remove();
            }
        });
        
        document.body.appendChild(installBtn);
    }

    // Проверка на iOS
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    // Проверка на PWA
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Глобальные функции для использования в HTML
    window.app = app;
    window.notesManager = notesManager;
    window.calendarManager = calendarManager;
    window.tableManager = tableManager;
    window.storage = storage;
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Ошибка приложения:', e.error);
});

// Обработка онлайн/оффлайн статуса
window.addEventListener('online', () => {
    console.log('Приложение онлайн');
    document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
    console.log('Приложение оффлайн');
    document.body.classList.add('offline');
});
