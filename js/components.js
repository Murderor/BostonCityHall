// UI Components
function loadNav() {
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
            link.addEventListener('click', () => {
                if (typeof loadPage === 'function') {
                    loadPage(link.dataset.page);
                }
            });
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

console.log('Components loaded');