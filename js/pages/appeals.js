// ========================================
// APPEALS - Обращения граждан
// ========================================

let currentAppealsPage = 1;
const APPEALS_PER_PAGE = 10;

// ========================================
// DISCORD AUTH HANDLING
// ========================================

// Обработка Discord callback (данные приходят в URL после редиректа от Edge Function)
async function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const discordId = urlParams.get('discord_id');
    const discordUsername = urlParams.get('discord_username');
    const discordAvatar = urlParams.get('discord_avatar');
    const success = urlParams.get('discord_success');
    const error = urlParams.get('discord_error');
    
    console.log('=== Discord Callback Debug ===');
    console.log('URL параметры:', {
        discordId,
        discordUsername,
        discordAvatar,
        success,
        error
    });
    console.log('Текущий пользователь:', window.currentUser);
    
    // Если есть ошибка
    if (error) {
        const message = urlParams.get('message') || 'Неизвестная ошибка';
        showErrorMessage('Ошибка привязки Discord: ' + decodeURIComponent(message));
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
    }
    
    // Если есть данные Discord и пользователь авторизован
    if (success && discordId && window.currentUser) {
        console.log('Обновляем пользователя...');
        
        // Прямой UPDATE через supabase
        const { data, error } = await supabaseClient
            .from('users')
            .update({
                discord_id: discordId,
                discord_username: discordUsername,
                discord_avatar: discordAvatar
            })
            .eq('id', window.currentUser.id)
            .select();
        
        console.log('Результат UPDATE:', { data, error });
        
        if (!error && data) {
            // Обновляем localStorage и currentUser
            window.currentUser = { ...window.currentUser, ...data[0] };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            
            console.log('Пользователь обновлен:', window.currentUser);
            alert('Discord успешно привязан!');
            
            // Очищаем URL и перезагружаем
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        }
    } else {
        console.log('Условия не выполнены:', {
            success: success,
            hasDiscordId: !!discordId,
            hasUser: !!window.currentUser
        });
    }
    
    return false;
}

// Инициализация Discord OAuth
function initiateDiscordAuth() {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('discord_oauth_state', state);
    
    // Перенаправляем на Edge Function
    const authUrl = `${window.SUPABASE_URL}/functions/v1/discord-auth`;
    console.log('Redirecting to Discord auth:', authUrl);
    window.location.href = authUrl;
}

// Вспомогательные функции для уведомлений
function showLoadingMessage(message) {
    removeExistingModal();
    const modal = document.createElement('div');
    modal.id = 'discord-loading-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 400px; text-align: center;">
            <div class="modal-body">
                <div class="spinner" style="width: 50px; height: 50px; margin: 20px auto;"></div>
                <h3>${message}</h3>
                <p style="color: var(--text-muted);">Пожалуйста, подождите...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showSuccessMessage(message) {
    removeExistingModal();
    const modal = document.createElement('div');
    modal.id = 'discord-success-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 400px; text-align: center;">
            <div class="modal-body">
                <div style="font-size: 64px;">✅</div>
                <h3 style="color: var(--success);">${message}</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary" style="margin-top: 20px;">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        const modalEl = document.getElementById('discord-success-modal');
        if (modalEl) modalEl.remove();
    }, 3000);
}

function showErrorMessage(message) {
    removeExistingModal();
    const modal = document.createElement('div');
    modal.id = 'discord-error-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 400px; text-align: center;">
            <div class="modal-body">
                <div style="font-size: 64px;">❌</div>
                <h3 style="color: var(--error);">Ошибка</h3>
                <p>${message}</p>
                <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary" style="margin-top: 20px;">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function removeExistingModal() {
    const existing = document.querySelector('#discord-loading-modal, #discord-success-modal, #discord-error-modal');
    if (existing) existing.remove();
}

// Функция для отображения привязки Discord
function renderDiscordConnect(content) {
    if (!content) return;
    
    content.innerHTML = `
        <div class="appeals-container">
            <div class="discord-connect-card">
                <div class="discord-icon">🎮</div>
                <h2>Требуется привязка Discord</h2>
                <p>Для подачи обращений в мэрию необходимо привязать ваш Discord аккаунт.</p>
                <p class="discord-note">Это необходимо для идентификации граждан и обратной связи.</p>
                <button id="connect-discord-btn" class="btn-discord-connect">
                    🔗 Привязать Discord аккаунт
                </button>
            </div>
        </div>
    `;
    
    const connectBtn = document.getElementById('connect-discord-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => initiateDiscordAuth());
    }
}

// Получение обращений пользователя
async function getUserAppeals() {
    if (!window.currentUser || !window.currentUser.id) {
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('appeals')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Ошибка загрузки обращений:', error);
        return [];
    }
}

// Загрузка моих обращений в UI
async function loadMyAppeals(appeals) {
    const container = document.getElementById('my-appeals-list');
    if (!container) return;
    
    if (!appeals || appeals.length === 0) {
        container.innerHTML = `
            <div class="empty-appeals">
                <div class="empty-icon">📭</div>
                <p>У вас пока нет обращений</p>
                <small>Создайте новое обращение, нажав на кнопку выше</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="appeals-list">
            ${appeals.map(appeal => `
                <div class="appeal-card" data-id="${appeal.id}">
                    <div class="appeal-header">
                        <div class="appeal-title-section">
                            <h3 class="appeal-title">${escapeHtml(appeal.title)}</h3>
                            <span class="appeal-category category-${appeal.category}">
                                ${getCategoryIcon(appeal.category)} ${getCategoryName(appeal.category)}
                            </span>
                        </div>
                        <div class="appeal-status status-${appeal.status}">
                            ${getStatusIcon(appeal.status)} ${getStatusName(appeal.status)}
                        </div>
                    </div>
                    <div class="appeal-content">
                        <p>${escapeHtml(appeal.content)}</p>
                    </div>
                    <div class="appeal-footer">
                        <span class="appeal-date">📅 ${formatAppealDate(appeal.created_at)}</span>
                        ${appeal.status !== 'pending' && appeal.admin_response ? `
                            <button class="btn-view-response" data-id="${appeal.id}">📋 Смотреть ответ</button>
                        ` : ''}
                        ${appeal.discord_thread_url ? `
                            <a href="${appeal.discord_thread_url}" target="_blank" class="btn-discord-thread" style="background: rgba(88, 101, 242, 0.15); border: 1px solid #5865F2; padding: 6px 16px; border-radius: 20px; color: #5865F2; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                                💬 Смотреть в Discord
                            </a>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.querySelectorAll('.btn-view-response').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const appealId = parseInt(btn.dataset.id);
            const appeal = appeals.find(a => a.id === appealId);
            if (appeal) {
                showResponseModal(appeal);
            }
        });
    });
}

// Загрузка обращений для админов
async function loadAdminAppeals(page = 1) {
    const container = document.getElementById('admin-appeals-list');
    if (!container) return;
    
    try {
        const { data, error, count } = await supabaseClient
            .from('appeals')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * APPEALS_PER_PAGE, page * APPEALS_PER_PAGE - 1);
        
        if (error) throw error;
        
        const totalPages = Math.ceil((count || 0) / APPEALS_PER_PAGE);
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-appeals"><p>Нет обращений от граждан</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="admin-appeals-controls">
                <div class="filter-controls">
                    <select id="status-filter" class="status-filter">
                        <option value="all">Все статусы</option>
                        <option value="pending">Ожидают</option>
                        <option value="processing">В обработке</option>
                        <option value="resolved">Решены</option>
                        <option value="rejected">Отклонены</option>
                    </select>
                    <select id="category-filter" class="category-filter">
                        <option value="all">Все категории</option>
                        <option value="question">Вопросы</option>
                        <option value="complaint">Жалобы</option>
                        <option value="suggestion">Предложения</option>
                        <option value="request">Запросы</option>
                    </select>
                </div>
            </div>
            <div class="appeals-list admin-list">
                ${data.map(appeal => `
                    <div class="appeal-card admin-appeal-card" data-id="${appeal.id}">
                        <div class="appeal-header">
                            <div class="appeal-title-section">
                                <h3 class="appeal-title">${escapeHtml(appeal.title)}</h3>
                                <span class="appeal-category category-${appeal.category}">
                                    ${getCategoryIcon(appeal.category)} ${getCategoryName(appeal.category)}
                                </span>
                            </div>
                            <div class="appeal-status status-${appeal.status}">
                                ${getStatusIcon(appeal.status)} ${getStatusName(appeal.status)}
                            </div>
                        </div>
                        <div class="appeal-meta-info">
                            <span>👤 ${escapeHtml(appeal.character_name)}</span>
                            <span>🎮 Discord: ${appeal.discord_id}</span>
                            <span>📅 ${formatAppealDate(appeal.created_at)}</span>
                            ${appeal.discord_thread_url ? `
                                <span>💬 <a href="${appeal.discord_thread_url}" target="_blank" style="color: #5865F2; text-decoration: none;">Тема в Discord</a></span>
                            ` : ''}
                        </div>
                        <div class="appeal-content">
                            <p>${escapeHtml(appeal.content)}</p>
                        </div>
                        <div class="appeal-actions">
                            <select class="status-update" data-id="${appeal.id}">
                                <option value="pending" ${appeal.status === 'pending' ? 'selected' : ''}>📋 Ожидает</option>
                                <option value="processing" ${appeal.status === 'processing' ? 'selected' : ''}>⚙️ В обработке</option>
                                <option value="resolved" ${appeal.status === 'resolved' ? 'selected' : ''}>✅ Решено</option>
                                <option value="rejected" ${appeal.status === 'rejected' ? 'selected' : ''}>❌ Отклонено</option>
                            </select>
                            <button class="btn-respond" data-id="${appeal.id}">✏️ Ответить</button>
                        </div>
                        ${appeal.admin_response ? `
                            <div class="appeal-response">
                                <strong>📢 Ответ мэрии:</strong>
                                <p>${escapeHtml(appeal.admin_response)}</p>
                                <small>${formatAppealDate(appeal.processed_at)}</small>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ${totalPages > 1 ? `
                <div class="pagination">
                    ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                        <button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        document.querySelectorAll('.status-update').forEach(select => {
            select.addEventListener('change', async (e) => {
                const appealId = parseInt(select.dataset.id);
                const newStatus = select.value;
                await updateAppealStatus(appealId, newStatus);
            });
        });
        
        document.querySelectorAll('.btn-respond').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const appealId = parseInt(btn.dataset.id);
                const appeal = data.find(a => a.id === appealId);
                if (appeal) {
                    showResponseModal(appeal, true);
                }
            });
        });
        
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const newPage = parseInt(btn.dataset.page);
                currentAppealsPage = newPage;
                await loadAdminAppeals(newPage);
            });
        });
        
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        if (statusFilter && categoryFilter) {
            statusFilter.addEventListener('change', () => filterAdminAppeals());
            categoryFilter.addEventListener('change', () => filterAdminAppeals());
        }
        
    } catch (error) {
        console.error('Ошибка загрузки обращений для админа:', error);
        container.innerHTML = '<div class="error-message">Ошибка загрузки обращений</div>';
    }
}

// Фильтрация обращений в админке
async function filterAdminAppeals() {
    const status = document.getElementById('status-filter').value;
    const category = document.getElementById('category-filter').value;
    
    let query = supabaseClient.from('appeals').select('*');
    
    if (status !== 'all') {
        query = query.eq('status', status);
    }
    if (category !== 'all') {
        query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) {
        const container = document.getElementById('admin-appeals-list');
        if (container) {
            const appealsList = container.querySelector('.appeals-list');
            if (appealsList) {
                appealsList.innerHTML = data.map(appeal => `
                    <div class="appeal-card admin-appeal-card" data-id="${appeal.id}">
                        <div class="appeal-header">
                            <div class="appeal-title-section">
                                <h3 class="appeal-title">${escapeHtml(appeal.title)}</h3>
                                <span class="appeal-category category-${appeal.category}">
                                    ${getCategoryIcon(appeal.category)} ${getCategoryName(appeal.category)}
                                </span>
                            </div>
                            <div class="appeal-status status-${appeal.status}">
                                ${getStatusIcon(appeal.status)} ${getStatusName(appeal.status)}
                            </div>
                        </div>
                        <div class="appeal-meta-info">
                            <span>👤 ${escapeHtml(appeal.character_name)}</span>
                            <span>🎮 Discord: ${appeal.discord_id}</span>
                            <span>📅 ${formatAppealDate(appeal.created_at)}</span>
                        </div>
                        <div class="appeal-content">
                            <p>${escapeHtml(appeal.content)}</p>
                        </div>
                        <div class="appeal-actions">
                            <select class="status-update" data-id="${appeal.id}">
                                <option value="pending" ${appeal.status === 'pending' ? 'selected' : ''}>📋 Ожидает</option>
                                <option value="processing" ${appeal.status === 'processing' ? 'selected' : ''}>⚙️ В обработке</option>
                                <option value="resolved" ${appeal.status === 'resolved' ? 'selected' : ''}>✅ Решено</option>
                                <option value="rejected" ${appeal.status === 'rejected' ? 'selected' : ''}>❌ Отклонено</option>
                            </select>
                            <button class="btn-respond" data-id="${appeal.id}">✏️ Ответить</button>
                        </div>
                        ${appeal.admin_response ? `
                            <div class="appeal-response">
                                <strong>📢 Ответ мэрии:</strong>
                                <p>${escapeHtml(appeal.admin_response)}</p>
                                <small>${formatAppealDate(appeal.processed_at)}</small>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }
        }
    }
}

// Обновление статуса обращения
async function updateAppealStatus(appealId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('appeals')
            .update({ 
                status: newStatus,
                updated_at: new Date()
            })
            .eq('id', appealId);
        
        if (error) throw error;
        
        await loadAdminAppeals(currentAppealsPage);
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        alert('Не удалось обновить статус обращения');
    }
}

// Функция для отправки уведомления в Discord о новом обращении
async function sendDiscordNotification(appealData) {
    try {
        console.log('Sending Discord notification for appeal:', appealData.id);
        
        const response = await fetch(`${window.SUPABASE_URL}/functions/v1/discord-forum-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                type: 'new_appeal',
                appeal: {
                    id: appealData.id,
                    title: appealData.title,
                    content: appealData.content,
                    character_name: appealData.character_name,
                    category: appealData.category,
                    created_at: appealData.created_at
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error:', response.status, errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }
        
        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            return { success: true, threadId: null, threadUrl: null };
        }
        
        if (!result.success) {
            console.warn('Discord notification failed:', result.error);
            return { success: false, error: result.error };
        }
        
        console.log('Discord notification success:', result);
        return { 
            success: true, 
            threadId: result.thread_id, 
            threadUrl: result.thread_url 
        };
    } catch (error) {
        console.error('Discord notification error:', error);
        return { success: false, error: error.message };
    }
}

// Функция для отправки ответа в Discord
async function sendResponseToDiscord(appealId, responseMessage, responseAuthor) {
    try {
        console.log('Sending response to Discord for appeal:', appealId);
        
        const response = await fetch(`${window.SUPABASE_URL}/functions/v1/discord-forum-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                type: 'send_response',
                appeal_id: appealId,
                response_message: responseMessage,
                response_author: responseAuthor
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.warn('Failed to send response to Discord:', result.error);
            return false;
        }
        
        console.log('Response sent to Discord successfully');
        return true;
    } catch (error) {
        console.error('Error sending response to Discord:', error);
        return false;
    }
}

// Модальное окно для нового обращения
function showNewAppealModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container modal-appeal">
            <div class="modal-header">
                <h2>📝 Новое обращение в мэрию</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Категория обращения</label>
                    <select id="appeal-category">
                        <option value="question">❓ Вопрос</option>
                        <option value="complaint">⚠️ Жалоба</option>
                        <option value="suggestion">💡 Предложение</option>
                        <option value="request">📋 Запрос</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Заголовок</label>
                    <input type="text" id="appeal-title" placeholder="Кратко опишите суть обращения" maxlength="200">
                </div>
                <div class="form-group">
                    <label>Текст обращения</label>
                    <textarea id="appeal-content" rows="6" placeholder="Подробно опишите ваше обращение..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-cancel">Отмена</button>
                    <button class="btn-submit-appeal">Отправить обращение</button>
                </div>
                <div id="appeal-error" class="error-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    const submitBtn = modal.querySelector('.btn-submit-appeal');
    const titleInput = modal.querySelector('#appeal-title');
    const contentInput = modal.querySelector('#appeal-content');
    const categorySelect = modal.querySelector('#appeal-category');
    const errorDiv = modal.querySelector('#appeal-error');
    
    submitBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;
        
        if (!title || !content) {
            errorDiv.textContent = 'Заполните заголовок и текст обращения';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (title.length > 200) {
            errorDiv.textContent = 'Заголовок не должен превышать 200 символов';
            errorDiv.style.display = 'block';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        errorDiv.style.display = 'none';
        
        try {
            // 1. Создаем обращение в БД
            const { data: appealData, error: appealError } = await supabaseClient
                .from('appeals')
                .insert([{
                    user_id: window.currentUser.id,
                    character_name: window.currentUser.character_name,
                    discord_id: window.currentUser.discord_id,
                    title: title,
                    content: content,
                    category: category
                }])
                .select()
                .single();
            
            if (appealError) throw appealError;
            
            // 2. Отправляем уведомление в Discord
            const discordResult = await sendDiscordNotification(appealData);
            
            // 3. Если Discord уведомление успешно, обновляем запись с thread_id
            if (discordResult.success && discordResult.threadId) {
                await supabaseClient
                    .from('appeals')
                    .update({ 
                        discord_thread_id: discordResult.threadId,
                        discord_thread_url: discordResult.threadUrl
                    })
                    .eq('id', appealData.id);
            }
            
            closeModal();
            
            // Показываем уведомление об успехе
            if (discordResult.success) {
                showNotification('✅ Обращение успешно создано и отправлено в мэрию!', 'success');
            } else {
                showNotification('⚠️ Обращение создано, но уведомление в Discord не отправлено', 'warning');
            }
            
            await renderAppeals();
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            errorDiv.textContent = error.message || 'Не удалось отправить обращение. Попробуйте позже.';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить обращение';
        }
    });
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.notification-toast');
    oldNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '16px 24px',
        background: 'var(--gradient-card)',
        borderLeft: `4px solid ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : 'var(--accent-blue)'}`,
        borderRadius: '12px',
        color: 'var(--text-primary)',
        zIndex: '10001',
        animation: 'slideInRight 0.3s ease',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(10px)',
        maxWidth: '400px',
        fontSize: '14px'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 5000);
    }, 5000);
}

// Модальное окно для ответа на обращение
function showResponseModal(appeal, isAdmin = false) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container modal-response">
            <div class="modal-header">
                <h2>${isAdmin ? '✏️ Ответ на обращение' : '📋 Ответ мэрии'}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="response-info">
                    <p><strong>Тема:</strong> ${escapeHtml(appeal.title)}</p>
                    <p><strong>Категория:</strong> ${getCategoryName(appeal.category)}</p>
                    <p><strong>От:</strong> ${escapeHtml(appeal.character_name)}</p>
                    <p><strong>Текст обращения:</strong></p>
                    <div class="response-original-text">${escapeHtml(appeal.content)}</div>
                </div>
                ${isAdmin ? `
                    <div class="form-group">
                        <label>Ваш ответ</label>
                        <textarea id="admin-response" rows="5" placeholder="Введите официальный ответ мэрии..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="send-to-discord" checked>
                            Отправить ответ в Discord (в тему обращения)
                        </label>
                        ${appeal.discord_thread_url ? `
                            <small style="display: block; margin-top: 5px; color: var(--text-muted);">
                                💬 Ответ будет отправлен в тему: <a href="${appeal.discord_thread_url}" target="_blank" style="color: #5865F2;">Открыть в Discord</a>
                            </small>
                        ` : appeal.discord_thread_id ? `
                            <small style="display: block; margin-top: 5px; color: var(--warning);">
                                ⚠️ Discord тема существует, но URL не сохранен
                            </small>
                        ` : `
                            <small style="display: block; margin-top: 5px; color: var(--warning);">
                                ⚠️ Discord тема не найдена. Ответ не будет отправлен в Discord.
                            </small>
                        `}
                    </div>
                    <div class="form-actions">
                        <button class="btn-cancel">Отмена</button>
                        <button class="btn-send-response">Отправить ответ</button>
                    </div>
                ` : `
                    <div class="response-answer">
                        <strong>📢 Ответ мэрии:</strong>
                        <div class="response-text">${escapeHtml(appeal.admin_response)}</div>
                        <small>${formatAppealDate(appeal.processed_at)}</small>
                    </div>
                    ${appeal.discord_thread_url ? `
                        <div style="margin-top: 16px; text-align: center;">
                            <a href="${appeal.discord_thread_url}" target="_blank" style="background: #5865F2; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                                💬 Посмотреть ответ в Discord
                            </a>
                        </div>
                    ` : ''}
                    <div class="form-actions">
                        <button class="btn-cancel">Закрыть</button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    if (isAdmin) {
        const sendBtn = modal.querySelector('.btn-send-response');
        const responseTextarea = modal.querySelector('#admin-response');
        const sendToDiscordCheckbox = modal.querySelector('#send-to-discord');
        
        sendBtn.addEventListener('click', async () => {
            const response = responseTextarea.value.trim();
            if (!response) {
                alert('Введите ответ на обращение');
                return;
            }
            
            sendBtn.disabled = true;
            sendBtn.textContent = 'Отправка...';
            
            try {
                // Обновляем в базе данных
                const { error } = await supabaseClient
                    .from('appeals')
                    .update({
                        admin_response: response,
                        status: 'resolved',
                        processed_by: window.currentUser.id,
                        processed_at: new Date(),
                        updated_at: new Date()
                    })
                    .eq('id', appeal.id);
                
                if (error) throw error;
                
                // Отправляем в Discord если выбран чекбокс и есть thread_id
                let discordSent = false;
                if (sendToDiscordCheckbox && sendToDiscordCheckbox.checked && appeal.discord_thread_id) {
                    discordSent = await sendResponseToDiscord(
                        appeal.id,
                        response,
                        `${window.currentUser.character_name} (${window.currentUser.role})`
                    );
                }
                
                closeModal();
                await loadAdminAppeals(currentAppealsPage);
                
                if (discordSent) {
                    showNotification('✅ Ответ отправлен в Discord тему!', 'success');
                } else if (sendToDiscordCheckbox && sendToDiscordCheckbox.checked) {
                    if (!appeal.discord_thread_id) {
                        showNotification('⚠️ Ответ сохранен, но Discord тема не найдена', 'warning');
                    } else {
                        showNotification('⚠️ Ответ сохранен, но не отправлен в Discord', 'warning');
                    }
                } else {
                    showNotification('✅ Ответ успешно сохранен!', 'success');
                }
                
            } catch (error) {
                console.error('Ошибка отправки ответа:', error);
                alert('Не удалось отправить ответ');
                sendBtn.disabled = false;
                sendBtn.textContent = 'Отправить ответ';
            }
        });
    }
}

// Вспомогательные функции
function getCategoryIcon(category) {
    const icons = {
        'question': '❓',
        'complaint': '⚠️',
        'suggestion': '💡',
        'request': '📋'
    };
    return icons[category] || '📝';
}

function getCategoryName(category) {
    const names = {
        'question': 'Вопрос',
        'complaint': 'Жалоба',
        'suggestion': 'Предложение',
        'request': 'Запрос'
    };
    return names[category] || category;
}

function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'processing': '⚙️',
        'resolved': '✅',
        'rejected': '❌'
    };
    return icons[status] || '📋';
}

function getStatusName(status) {
    const names = {
        'pending': 'Ожидает',
        'processing': 'В обработке',
        'resolved': 'Решено',
        'rejected': 'Отклонено'
    };
    return names[status] || status;
}

function formatAppealDate(dateString) {
    if (!dateString) return 'Дата не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Основная функция renderAppeals
async function renderAppeals() {
    const content = document.getElementById('page-content');
    if (!content) {
        console.error('Page content element not found');
        return;
    }
    
    // Сначала обрабатываем Discord callback
    const handled = await handleDiscordCallback();
    if (handled) return;
    
    // Проверяем авторизацию
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
    
    // Показываем загрузку
    content.innerHTML = `
        <div class="appeals-loading">
            <div class="spinner"></div>
            <p>Загрузка обращений...</p>
        </div>
    `;
    
    try {
        // Проверяем, привязан ли Discord
        const hasDiscord = window.currentUser.discord_id && window.currentUser.discord_id !== null;
        
        if (!hasDiscord) {
            renderDiscordConnect(content);
            return;
        }
        
        // Загружаем обращения
        const myAppeals = await getUserAppeals();
        const canManageAppeals = window.hasAccess ? window.hasAccess(2) : false;
        
        content.innerHTML = `
            <div class="appeals-container">
                <div class="appeals-header">
                    <div>
                        <h1>📝 Обращения граждан</h1>
                        <p class="appeals-subtitle">Официальная платформа для обращений в мэрию</p>
                    </div>
                    <button id="new-appeal-btn" class="btn-primary btn-new-appeal">
                        + Новое обращение
                    </button>
                </div>
                
                ${canManageAppeals ? `
                    <div class="admin-appeals-section">
                        <h2>🏛️ Управление обращениями (Мэрия)</h2>
                        <div id="admin-appeals-list">
                            <div class="appeals-loading">Загрузка обращений граждан...</div>
                        </div>
                    </div>
                    <hr class="appeals-divider">
                ` : ''}
                
                <div class="my-appeals-section">
                    <h2>📋 Мои обращения</h2>
                    <div id="my-appeals-list"></div>
                </div>
            </div>
        `;
        
        // Добавляем стили для анимаций уведомлений если их нет
        if (!document.getElementById('notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Загружаем данные
        if (canManageAppeals) {
            await loadAdminAppeals();
        }
        await loadMyAppeals(myAppeals);
        
        // Обработчик кнопки нового обращения
        const newAppealBtn = document.getElementById('new-appeal-btn');
        if (newAppealBtn) {
            newAppealBtn.addEventListener('click', showNewAppealModal);
        }
        
    } catch (error) {
        console.error('Error rendering appeals:', error);
        content.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 60px;">
                <h3>❌ Ошибка загрузки страницы</h3>
                <p>Пожалуйста, обновите страницу или обратитесь к администратору.</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">Обновить</button>
            </div>
        `;
    }
}

// Делаем функцию глобальной
window.renderAppeals = renderAppeals;

console.log('Appeals module loaded');