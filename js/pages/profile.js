// Profile Page
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
    const maxLevel = 3; // Максимальный уровень - Мэр
    
    // Рассчитываем прогресс для шкалы (от 0 до 100%)
    let progressPercent = (roleLevel / maxLevel) * 100;
    // Для граждан (уровень 0) показываем минимальный прогресс
    if (roleLevel === 0) progressPercent = 5;
    
    // Определяем следующую роль для отображения
    let nextRole = null;
    if (roleLevel === 0) nextRole = "Сотрудник мэрии";
    else if (roleLevel === 1) nextRole = "Заместитель мэра";
    else if (roleLevel === 2) nextRole = "Мэр";
    
    content.innerHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <div>${roleInfo?.icon || '👤'}</div>
                <h1>${escapeHtml(user.character_name)}</h1>
                <div class="profile-role">${roleInfo?.icon || '👤'} ${user.role}</div>
                <div class="profile-id">Static ID: ${user.static_id}</div>
            </div>
            
            <div class="profile-details">
                <h3>📋 Информация о персонаже</h3>
                <p><strong>Пол:</strong> ${user.gender === 'Мужской' ? '👨 Мужской' : '👩 Женский'}</p>
                <p><strong>Дата регистрации:</strong> ${new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><strong>Уровень доступа:</strong> ${roleLevel} из ${maxLevel}</p>
                <div style="margin-top: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Статус в мэрии</span>
                        <span>${Math.round(progressPercent)}%</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--accent-blue), var(--accent-gold)); width: ${progressPercent}%; height: 100%; border-radius: 5px;"></div>
                    </div>
                    ${nextRole ? `<p style="margin-top: 12px; font-size: 13px; color: var(--text-muted);">Следующий ранг: ${nextRole}</p>` : '<p style="margin-top: 12px; font-size: 13px; color: var(--accent-gold);">⭐ Вы достигли высшего ранга!</p>'}
                </div>
            </div>
            
            <div class="profile-details">
                <h3>🔗 Связанные аккаунты</h3>
                ${user.discord_id ? `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(88, 101, 242, 0.1); border-radius: 12px;">
                        <div style="font-size: 32px;">🎮</div>
                        <div>
                            <strong>Discord привязан</strong>
                            <p style="margin: 0; font-size: 13px; color: var(--text-muted);">ID: ${escapeHtml(user.discord_id)}</p>
                            ${user.discord_username ? `<p style="margin: 0; font-size: 13px; color: var(--text-muted);">${escapeHtml(user.discord_username)}</p>` : ''}
                        </div>
                        <div style="margin-left: auto; color: #5865F2;">✅</div>
                    </div>
                ` : `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 12px;">
                        <div style="font-size: 32px;">🎮</div>
                        <div style="flex: 1;">
                            <strong>Discord не привязан</strong>
                            <p style="margin: 0; font-size: 13px; color: var(--text-muted);">Для подачи обращений требуется привязка Discord</p>
                        </div>
                        <button id="connect-discord-profile" class="btn-discord-connect" style="padding: 8px 16px; font-size: 13px;">Привязать</button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Обработчик кнопки привязки Discord в профиле
    const connectBtn = document.getElementById('connect-discord-profile');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            if (typeof initiateDiscordAuth === 'function') {
                initiateDiscordAuth();
            } else {
                alert('Функция привязки Discord временно недоступна');
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