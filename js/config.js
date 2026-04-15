// Supabase Configuration
const SUPABASE_URL = 'https://bdzrnrvjclysjfkfilgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WIsagGrDuRoJnshaFyZnCQ_YbvkwXJz';

// Создаем клиент с дополнительными настройками
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
const supabaseClient = window.supabaseClient;

// Роли и их уровни доступа
const ROLES = {
    'Гражданин': { level: 0, label: 'Гражданин', icon: '👤' },
    'Гражданка': { level: 0, label: 'Гражданка', icon: '👩' },
    'Сотрудник мэрии': { level: 1, label: 'Сотрудник мэрии', icon: '👔' },
    'Заместитель мэра города Лос Сантос': { level: 2, label: 'Зам. мэра ЛС', icon: '⭐' },
    'Заместитель Мэра Округа Блэйн': { level: 2, label: 'Зам. мэра Блэйн', icon: '⭐' },
    'Мэр города Лос Сантос': { level: 3, label: 'Мэр Лос Сантос', icon: '👑' },
    'Мэр округа Блэйн': { level: 3, label: 'Мэр Блэйн', icon: '👑' }
};

let currentUser = null;

// Делаем переменные глобальными для доступа из других файлов
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.supabaseClient = supabaseClient;
window.ROLES = ROLES;
window.currentUser = currentUser;

console.log('Supabase configured:', SUPABASE_URL);