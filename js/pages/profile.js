// Profile Page - Enhanced Version
async function renderProfile() {
    const content = document.getElementById('page-content');
    
    // Проверяем, что пользователь авторизован
    if (!window.currentUser) {
        content.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 60px;">
                <h3>❌ Не авторизован</h3>
                <p>Пожалуйста, войдите в систему.</p>
                <button onclick="window.location.href='index.html'" class="btn-primary">Войти</button>
            </div>
        `;
        return;
    }
    
    const user = window.currentUser;
    const roleInfo = window.ROLES[user.role];
    const roleLevel = roleInfo?.level || 0;
    const maxLevel = 3;
    
    // Рассчитываем прогресс
    let progressPercent = (roleLevel / maxLevel) * 100;
    if (roleLevel === 0) progressPercent = 5;
    
    // Определяем следующую роль
    let nextRole = null;
    let nextRoleIcon = null;
    if (roleLevel === 0) {
        nextRole = "Сотрудник мэрии";
        nextRoleIcon = "👔";
    } else if (roleLevel === 1) {
        nextRole = "Заместитель мэра";
        nextRoleIcon = "⭐";
    } else if (roleLevel === 2) {
        nextRole = "Мэр";
        nextRoleIcon = "👑";
    }
    
    // Получаем статистику обращений пользователя
    let appealsStats = { total: 0, pending: 0, resolved: 0 };
    try {
        const { data: userAppeals } = await window.supabaseClient
            .from('appeals')
            .select('status')
            .eq('user_id', user.id);
        
        if (userAppeals) {
            appealsStats.total = userAppeals.length;
            appealsStats.pending = userAppeals.filter(a => a.status === 'pending' || a.status === 'processing').length;
            appealsStats.resolved = userAppeals.filter(a => a.status === 'resolved').length;
        }
    } catch (e) {
        console.warn('Could not fetch appeals stats:', e);
    }
    
    // Определяем градиент для фона в зависимости от роли
    let roleGradient = '';
    let roleBadgeClass = '';
    if (user.role.includes('Мэр')) {
        roleGradient = 'linear-gradient(135deg, rgba(196, 167, 71, 0.3), rgba(155, 133, 53, 0.1))';
        roleBadgeClass = 'mayor-glow';
    } else if (user.role.includes('Заместитель')) {
        roleGradient = 'linear-gradient(135deg, rgba(44, 95, 138, 0.3), rgba(30, 61, 90, 0.1))';
        roleBadgeClass = 'deputy-glow';
    } else if (user.role.includes('Сотрудник')) {
        roleGradient = 'linear-gradient(135deg, rgba(74, 85, 104, 0.2), rgba(55, 65, 81, 0.1))';
        roleBadgeClass = 'employee-glow';
    } else {
        roleGradient = 'linear-gradient(135deg, rgba(107, 122, 138, 0.15), rgba(75, 85, 99, 0.05))';
        roleBadgeClass = 'citizen-glow';
    }
    
    content.innerHTML = `
        <div class="profile-container">
            <!-- Hero Section с анимированным фоном -->
            <div class="profile-hero" style="background: ${roleGradient};">
                <div class="profile-hero-content">
                    <div class="profile-avatar">
                        <div class="avatar-icon ${roleBadgeClass}">
                            ${roleInfo?.icon || '👤'}
                        </div>
                        ${user.discord_id ? '<div class="discord-badge" title="Discord привязан">🎮</div>' : ''}
                    </div>
                    <div class="profile-hero-info">
                        <h1 class="profile-name">${escapeHtml(user.character_name)}</h1>
                        <div class="profile-role-badge">
                            <span class="role-badge-large">${roleInfo?.icon || '👤'} ${user.role}</span>
                        </div>
                        <div class="profile-stats">
                            <div class="stat-item">
                                <span class="stat-label">Static ID</span>
                                <span class="stat-value">${escapeHtml(user.static_id)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Пол</span>
                                <span class="stat-value">${user.gender === 'Мужской' ? '👨 Мужской' : '👩 Женский'}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Дата регистрации</span>
                                <span class="stat-value">${new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Карточка ранга и прогресса -->
            <div class="profile-card rank-card">
                <div class="card-header">
                    <span class="card-icon">🏆</span>
                    <h3>Карьерный рост</h3>
                </div>
                <div class="rank-info">
                    <div class="current-rank">
                        <span class="rank-label">Текущий ранг</span>
                        <div class="rank-value">
                            <span class="rank-icon">${roleInfo?.icon || '👤'}</span>
                            <span>${user.role}</span>
                            <span class="rank-level">Уровень ${roleLevel}</span>
                        </div>
                    </div>
                    <div class="rank-progress">
                        <div class="progress-header">
                            <span>Прогресс до следующего ранга</span>
                            <span class="progress-percent">${Math.round(progressPercent)}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                        ${nextRole ? `
                            <div class="next-rank">
                                <span class="next-rank-label">Следующий ранг:</span>
                                <span class="next-rank-value">${nextRoleIcon} ${nextRole}</span>
                            </div>
                        ` : `
                            <div class="max-rank-message">
                                <span>👑 Вы достигли высшего ранга! 👑</span>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <!-- Статистика обращений -->
            <div class="profile-card appeals-stats-card">
                <div class="card-header">
                    <span class="card-icon">📋</span>
                    <h3>Мои обращения</h3>
                    <a href="#" onclick="window.navigateTo('appeals'); return false;" class="card-link">Все обращения →</a>
                </div>
                <div class="stats-grid">
                    <div class="stat-card total">
                        <div class="stat-number">${appealsStats.total}</div>
                        <div class="stat-name">Всего</div>
                    </div>
                    <div class="stat-card pending">
                        <div class="stat-number">${appealsStats.pending}</div>
                        <div class="stat-name">В обработке</div>
                    </div>
                    <div class="stat-card resolved">
                        <div class="stat-number">${appealsStats.resolved}</div>
                        <div class="stat-name">Решено</div>
                    </div>
                </div>
            </div>
            
            <!-- Discord интеграция -->
            <div class="profile-card discord-card">
                <div class="card-header">
                    <span class="card-icon">🎮</span>
                    <h3>Discord интеграция</h3>
                </div>
                ${user.discord_id ? `
                    <div class="discord-connected">
                        <div class="discord-status-icon">✅</div>
                        <div class="discord-info">
                            <div class="discord-label">Аккаунт привязан</div>
                            <div class="discord-username">
                                <span class="discord-icon">🎮</span>
                                ${user.discord_username ? escapeHtml(user.discord_username) : 'Discord пользователь'}
                            </div>
                            <div class="discord-id">ID: ${escapeHtml(user.discord_id)}</div>
                        </div>
                        <div class="discord-perks">
                            <span class="perk-badge">✅ Доступ к обращениям</span>
                            <span class="perk-badge">📢 Уведомления в Discord</span>
                        </div>
                    </div>
                ` : `
                    <div class="discord-not-connected">
                        <div class="discord-status-icon">⚠️</div>
                        <div class="discord-info">
                            <div class="discord-label">Discord не привязан</div>
                            <div class="discord-warning">
                                Для подачи обращений в мэрию необходимо привязать Discord аккаунт
                            </div>
                        </div>
                        <button id="connect-discord-profile" class="btn-discord-connect-profile">
                            🎮 Привязать Discord
                        </button>
                    </div>
                `}
            </div>
            
            <!-- Дополнительная информация -->
            <div class="profile-card info-card">
                <div class="card-header">
                    <span class="card-icon">ℹ️</span>
                    <h3>Информация о системе</h3>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Версия портала</span>
                        <span class="info-value">v2.0.0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Ролевая система</span>
                        <span class="info-value">7 уровней доступа</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Discord интеграция</span>
                        <span class="info-value">${user.discord_id ? 'Активна ✅' : 'Не активирована ⚠️'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Последний вход</span>
                        <span class="info-value">${new Date().toLocaleString('ru-RU')}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Обработчик кнопки привязки Discord
    const connectBtn = document.getElementById('connect-discord-profile');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            if (typeof initiateDiscordAuth === 'function') {
                initiateDiscordAuth();
            } else {
                showToast('Функция привязки Discord временно недоступна', 'error');
            }
        });
    }
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Toast уведомления (если нет глобальной функции)
if (typeof showToast !== 'function') {
    window.showToast = function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
}