// Роутер для навигации
async function loadPage(pageName) {
    const content = document.getElementById('page-content');
    if (!content) return;

    // Анимация загрузки
    content.style.opacity = '0';
    
    setTimeout(async () => {
        switch(pageName) {
            case 'dashboard':
                if (typeof renderDashboard === 'function') {
                    await renderDashboard();
                }
                break;
            case 'profile':
                if (typeof renderProfile === 'function') {
                    await renderProfile();
                }
                break;
            case 'employees':
                if (typeof renderEmployees === 'function') {
                    await renderEmployees();
                }
                break;
            case 'appeals':
                if (typeof renderAppeals === 'function') {
                    await renderAppeals();
                } else {
                    content.innerHTML = '<div class="error-message">Страница обращений временно недоступна</div>';
                }
                break;
            case 'admin':
                if (window.hasAccess && window.hasAccess(2)) {
                    if (typeof renderAdminPanel === 'function') {
                        await renderAdminPanel();
                    }
                } else {
                    content.innerHTML = '<div class="error-message">Доступ запрещен. Требуются права сотрудника мэрии.</div>';
                }
                break;
            default:
                if (typeof renderDashboard === 'function') {
                    await renderDashboard();
                }
        }
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.3s';
        
        // Обновляем активную ссылку
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });
    }, 200);
}

async function loadNav() {
    const navLinks = document.getElementById('nav-links');
    const userName = document.getElementById('user-name');
    
    if (userName && window.currentUser) {
        const roleInfo = window.ROLES[window.currentUser.role];
        userName.textContent = `${window.currentUser.character_name} (${roleInfo?.icon || '👤'})`;
    }
    
    // Базовые ссылки для всех
    const links = [
        { page: 'dashboard', name: 'Главная', icon: '🏠' },
        { page: 'profile', name: 'Профиль', icon: '👤' },
        { page: 'employees', name: 'Сотрудники', icon: '👥' },
        { page: 'appeals', name: 'Обращения', icon: '📝' }
    ];
    
    // Админ-панель только для уровня 2+
    if (window.hasAccess && window.hasAccess(2)) {
        links.push({ page: 'admin', name: 'Управление', icon: '⚙️' });
    }
    
    if (navLinks) {
        navLinks.innerHTML = links.map(link => 
            `<a class="nav-link" data-page="${link.page}">${link.icon} ${link.name}</a>`
        ).join('');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => loadPage(link.dataset.page));
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') {
                logout();
            }
        });
    }
}

// Функция для обработки Discord OAuth callback
async function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
        const savedState = localStorage.getItem('discord_oauth_state');
        if (state === savedState) {
            console.log('Discord callback received', { code, state });
            alert('Функция привязки Discord находится в разработке. Пожалуйста, обратитесь к администратору.');
            localStorage.removeItem('discord_oauth_state');
            window.history.replaceState({}, document.title, window.location.pathname);
            if (typeof loadPage === 'function') {
                await loadPage('appeals');
            }
        }
    }
}

// Делаем функции глобальными
window.loadPage = loadPage;
window.loadNav = loadNav;

// Запускаем проверку Discord callback при загрузке страницы
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDiscordCallback);
    } else {
        handleDiscordCallback();
    }
}