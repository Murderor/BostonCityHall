// Auth Functions

// Функции авторизации
async function login(username, password) {
    try {
        console.log('Попытка входа:', username);
        
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('character_name', username)
            .single();

        if (error) {
            console.error('Ошибка поиска пользователя:', error);
            return { success: false, error: 'Пользователь не найден' };
        }

        if (!user) {
            return { success: false, error: 'Пользователь не найден' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Неверный пароль' };
        }

        window.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Ошибка сервера: ' + error.message };
    }
}

async function register(name, staticId, gender, password) {
    try {
        console.log('Попытка регистрации:', name);
        
        // Проверка на существование
        const { data: existing, error: findError } = await supabaseClient
            .from('users')
            .select('character_name')
            .eq('character_name', name)
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'Имя уже занято' };
        }

        // Вставка нового пользователя
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                character_name: name,
                static_id: staticId,
                gender: gender,
                password: password,
                role: gender === 'Мужской' ? 'Гражданин' : 'Гражданка',
                discord_id: null,
                discord_username: null,
                discord_avatar: null
            }])
            .select();

        if (error) {
            console.error('Ошибка вставки:', error);
            if (error.code === '42501') {
                return { success: false, error: 'Ошибка доступа к таблице. Пожалуйста, выполните SQL скрипт из консоли Supabase.' };
            }
            return { success: false, error: 'Ошибка регистрации: ' + error.message };
        }
        
        console.log('Регистрация успешна:', data);
        return { success: true };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: 'Ошибка: ' + error.message };
    }
}

async function checkAuth() {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
        return false;
    }
    window.currentUser = JSON.parse(stored);
    
    // Проверка в БД
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', window.currentUser.id)
        .maybeSingle();
    
    if (error || !data) {
        logout();
        return false;
    }
    
    window.currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(data));
    return true;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.currentUser = null;
    window.location.href = 'index.html';
}

function hasAccess(requiredLevel) {
    if (!window.currentUser) return false;
    const roleLevel = ROLES[window.currentUser.role]?.level;
    return roleLevel !== undefined && roleLevel >= requiredLevel;
}

// Функция для обновления Discord ID пользователя
async function updateDiscordId(discordId, discordUsername = null, discordAvatar = null) {
    if (!window.currentUser) {
        console.error('No user logged in');
        return { success: false, error: 'Пользователь не авторизован' };
    }
    
    try {
        const updateData = {
            discord_id: discordId,
            discord_username: discordUsername,
            discord_avatar: discordAvatar,
            updated_at: new Date()
        };
        
        const { data, error } = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', window.currentUser.id)
            .select();
        
        if (error) throw error;
        
        window.currentUser = { ...window.currentUser, ...updateData };
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
        
        return { success: true, data: window.currentUser };
    } catch (error) {
        console.error('Error updating Discord ID:', error);
        return { success: false, error: error.message };
    }
}

// Функция для проверки привязан ли Discord
function hasDiscordLinked() {
    return window.currentUser && window.currentUser.discord_id && window.currentUser.discord_id !== null;
}

// Функция для получения полной информации о пользователе
async function refreshUserData() {
    if (!window.currentUser) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', window.currentUser.id)
            .single();
        
        if (!error && data) {
            window.currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(data));
        }
        
        return window.currentUser;
    } catch (error) {
        console.error('Error refreshing user data:', error);
        return window.currentUser;
    }
}

// Делаем функции глобальными
window.login = login;
window.register = register;
window.checkAuth = checkAuth;
window.logout = logout;
window.hasAccess = hasAccess;
window.updateDiscordId = updateDiscordId;
window.hasDiscordLinked = hasDiscordLinked;
window.refreshUserData = refreshUserData;

console.log('Auth module loaded');