// ========================================
// DASHBOARD - НОВОСТНАЯ ЛЕНТА
// ========================================

async function renderDashboard() {
    const content = document.getElementById('page-content');
    
    // Получаем новости из БД (свежие сверху)
    const news = await getNews();
    
    // Проверяем, может ли пользователь создавать новости (уровень 2+)
    const canCreateNews = window.currentUser && hasAccess(2);
    const canDeleteNews = window.currentUser && hasAccess(3); // мэры (уровень 3)
    
    content.innerHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>Новости мэрии</h1>
                    <p class="dashboard-subtitle">Официальные объявления и указы</p>
                </div>
                ${canCreateNews ? `
                    <button id="create-news-btn" class="btn-create-news">
                        <span>+</span> Опубликовать новость
                    </button>
                ` : ''}
            </div>
            
            <div id="news-feed" class="news-feed">
                ${news.length === 0 ? `
                    <div class="empty-news">
                        <div class="empty-icon">📭</div>
                        <p>Новостей пока нет</p>
                        <small>Будьте первым, кто опубликует объявление</small>
                    </div>
                ` : `
                    ${news.map(item => `
                        <div class="news-card" data-id="${item.id}">
                            <div class="news-header">
                                <div class="news-title-wrapper">
                                    <h3 class="news-title">${escapeHtml(item.title)}</h3>
                                    ${canDeleteNews ? `
                                        <button class="btn-delete-news" data-id="${item.id}" title="Удалить новость">🗑️</button>
                                    ` : ''}
                                </div>
                                <div class="news-meta">
                                    <span class="news-author">
                                        <span class="author-icon">👤</span> ${escapeHtml(item.author_name)}
                                    </span>
                                    <span class="news-role ${getRoleClassForNews(item.author_role)}">
                                        ${escapeHtml(item.author_role)}
                                    </span>
                                    <span class="news-date">
                                        📅 ${formatDate(item.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div class="news-content">
                                <p>${escapeHtml(item.content).replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    `).join('')}
                `}
            </div>
        </div>
    `;
    
    // Привязываем обработчики
    if (canCreateNews) {
        const createBtn = document.getElementById('create-news-btn');
        if (createBtn) createBtn.addEventListener('click', showCreateNewsModal);
    }
    
    if (canDeleteNews) {
        document.querySelectorAll('.btn-delete-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newsId = parseInt(btn.dataset.id);
                deleteNews(newsId);
            });
        });
    }
}

// Получение новостей из Supabase
async function getNews() {
    try {
        const { data, error } = await supabaseClient
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        return [];
    }
}

// Показать модальное окно создания новости
function showCreateNewsModal() {
    // Создаём модальное окно динамически
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>📰 Новая публикация</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Заголовок новости</label>
                    <input type="text" id="news-title" placeholder="Например: Новый закон о налогах" maxlength="200">
                </div>
                <div class="form-group">
                    <label>Текст новости</label>
                    <textarea id="news-content" rows="6" placeholder="Введите текст объявления или указа..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-cancel">Отмена</button>
                    <button class="btn-submit-news">Опубликовать</button>
                </div>
                <div id="news-error" class="error-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Закрытие по крестику или кнопке "Отмена"
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Публикация новости
    const submitBtn = modal.querySelector('.btn-submit-news');
    const titleInput = modal.querySelector('#news-title');
    const contentInput = modal.querySelector('#news-content');
    const errorDiv = modal.querySelector('#news-error');
    
    submitBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!title || !content) {
            errorDiv.textContent = 'Заполните заголовок и текст новости';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (title.length > 200) {
            errorDiv.textContent = 'Заголовок не должен превышать 200 символов';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Отключаем кнопку, пока идёт запрос
        submitBtn.disabled = true;
        submitBtn.textContent = 'Публикация...';
        
        try {
            const { error } = await supabaseClient
                .from('news')
                .insert([{
                    title: title,
                    content: content,
                    author_name: window.currentUser.character_name,
                    author_role: window.currentUser.role
                }]);
            
            if (error) throw error;
            
            // Успех – закрываем модалку и обновляем ленту
            closeModal();
            await renderDashboard(); // перерисовываем страницу
        } catch (error) {
            console.error('Ошибка публикации:', error);
            errorDiv.textContent = 'Не удалось опубликовать новость. Попробуйте позже.';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Опубликовать';
        }
    });
}

// Удаление новости (только для мэров, уровень 3)
async function deleteNews(newsId) {
    if (!confirm('Вы уверены, что хотите удалить эту новость? Это действие необратимо.')) return;
    
    try {
        const { error } = await supabaseClient
            .from('news')
            .delete()
            .eq('id', newsId);
        
        if (error) throw error;
        
        // Обновляем ленту
        await renderDashboard();
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить новость. Попробуйте позже.');
    }
}

// Вспомогательная функция: экранирование HTML (безопасность)
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Получить класс для бейджа роли автора (используется в новостях)
function getRoleClassForNews(role) {
    if (role.includes('Мэр')) return 'role-mayor-badge';
    if (role.includes('Заместитель')) return 'role-deputy-badge';
    if (role.includes('Сотрудник')) return 'role-employee-badge';
    return 'role-citizen-badge';
}

// Функции статистики больше не нужны, но оставим пустыми, чтобы не ломать другие файлы
async function getTotalCitizens() { return 0; }
async function getTotalEmployees() { return 0; }
async function getRecentUsers() { return []; }