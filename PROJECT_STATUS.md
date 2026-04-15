Вот обновленный файл `PROJECT_STATUS.md` с добавленной информацией о Discord интеграции и системе обращений:

```markdown
# Проект Мэрии Сан-Андреас - GTA 5 RP (Majestic)

## 📋 ОБЩАЯ ИНФОРМАЦИЯ

- **Проект**: Официальный сайт мэрии для GTA 5 RP сервера Majestic
- **Хостинг**: GitHub Pages / Localhost
- **Технологии**: HTML, CSS, JavaScript (Vanilla), Supabase, Discord OAuth2, Discord Webhooks
- **Структура**: Модульная, все страницы в отдельных файлах
- **Статус**: В разработке ✅
- **Дата последнего обновления**: 2026-04-15

---

## 🎨 ДИЗАЙН И СТИЛИ

### Цветовая палитра (Dark Blue Theme)

| Оттенок | HEX | Применение |
|---------|-----|------------|
| Темно-синий (самый темный) | `#0a0e1a` | Фон body, прелоадер |
| Глубокий синий | `#0f1422` | Основной фон |
| Базовый синий | `#141a2c` | Карточки, таблицы |
| Светлый синий | `#1a2238` | Hover состояния |
| Акцентный синий | `#2c5f8a` | Кнопки, границы |
| Акцентный синий светлый | `#3a7ca8` | Hover кнопок |
| Акцентный синий темный | `#1e3d5a` | Фон активных элементов |
| Акцентный золотой | `#c4a747` | Заголовки, акценты |
| Акцентный золотой светлый | `#d4b95a` | Hover акцентов |

---

## 🗄️ БАЗА ДАННЫХ (SUPABASE)

### Подключение
```javascript
URL: https://bdzrnrvjclysjfkfilgz.supabase.co
Anon Key: sb_publishable_WIsagGrDuRoJnshaFyZnCQ_YbvkwXJz
```

### Таблица: `users`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    character_name VARCHAR(100) UNIQUE NOT NULL,
    static_id VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Гражданин',
    discord_id VARCHAR(50) UNIQUE,
    discord_username VARCHAR(100),
    discord_avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `news`

```sql
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `appeals`

```sql
CREATE TABLE appeals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    character_name VARCHAR(100) NOT NULL,
    discord_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'question', 'complaint', 'suggestion', 'request'
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'resolved', 'rejected'
    admin_response TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    discord_thread_id VARCHAR(50),
    discord_thread_url TEXT,
    discord_channel_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `discord_settings`

```sql
CREATE TABLE discord_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `discord_notification_logs`

```sql
CREATE TABLE discord_notification_logs (
    id SERIAL PRIMARY KEY,
    appeal_id INTEGER REFERENCES appeals(id) ON DELETE CASCADE,
    thread_id VARCHAR(50),
    thread_url TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎭 РОЛИ И УРОВНИ ДОСТУПА

| Роль | Уровень | Иконка | Юрисдикция | Права |
|------|---------|--------|-------------|-------|
| Гражданин | 0 | 👤 | - | Просмотр новостей, подача обращений |
| Гражданка | 0 | 👩 | - | Просмотр новостей, подача обращений |
| Сотрудник мэрии | 1 | 👔 | Универсальная | + Управление обращениями |
| Заместитель мэра Лос Сантос | 2 | ⭐ | Лос Сантос | + Публикация новостей |
| Заместитель Мэра Блэйн | 2 | ⭐ | Блэйн | + Публикация новостей |
| Мэр Лос Сантос | 3 | 👑 | Лос Сантос | + Удаление новостей |
| Мэр Блэйн | 3 | 👑 | Блэйн | + Удаление новостей |

---

## 📁 СТРУКТУРА ПРОЕКТА

```
/
├── index.html                 # Авторизация/регистрация
├── dashboard.html            # Главная панель управления
├── PROJECT_STATUS.md         # Этот файл
│
├── assets/
│   └── seal.png             # Герб штата
│
├── css/
│   └── style.css            # Основные стили (Dark Blue Theme)
│
└── js/
    ├── config.js            # Конфигурация Supabase
    ├── auth.js              # Функции авторизации
    ├── components.js        # UI компоненты
    ├── router.js            # Маршрутизация
    │
    └── pages/
        ├── dashboard.js     # Главная страница (новости)
        ├── profile.js       # Личный кабинет
        ├── employees.js     # Сотрудники мэрии
        ├── appeals.js       # Обращения граждан + Discord интеграция
        └── admin.js         # Управление пользователями
```

---

## 🎯 РЕАЛИЗОВАННЫЙ ФУНКЦИОНАЛ

### ✅ Готово:

1. **Авторизация**
   - Вход по имени персонажа и паролю
   - Регистрация с указанием Static ID и пола
   - Автоматическое назначение роли
   - Сохранение сессии в localStorage

2. **Новостная лента (Главная страница)**
   - Отображение всех новостей от новых к старым
   - Карточки новостей с заголовком, текстом, автором, датой
   - Для уровня 2+: кнопка "Опубликовать новость"
   - Для уровня 3+: кнопка удаления новости
   - Модальное окно для создания новости

3. **Обращения граждан**
   - Требуется привязка Discord аккаунта
   - Категории: Вопрос, Жалоба, Предложение, Запрос
   - Отслеживание статуса (Ожидает/В обработке/Решено/Отклонено)
   - Для всех граждан: подача обращений, просмотр своих обращений
   - Для сотрудников мэрии (2+): управление обращениями, ответы, изменение статуса
   - **Discord интеграция**: автоматическое создание темы в форумном канале
   - **Ответы в Discord**: при ответе на обращение, ответ отправляется в ту же тему

4. **Discord OAuth2 Интеграция**
   - Привязка Discord аккаунта через Supabase Edge Function
   - Получение ID, username, avatar
   - Обязательное условие для подачи обращений
   - Отображение статуса привязки в профиле

5. **Discord Webhook Интеграция**
   - Автоматическое создание тем в форумном канале при создании обращения
   - Отправка ответов мэрии в существующие темы
   - Хранение webhook URL в Supabase (безопасность)
   - Логирование всех уведомлений
   - Формат названия темы: `[Тип] | Отправитель - Тема`

6. **Ролевая система**
   - 7 уровней доступа
   - Ограничение доступа к админке (уровень 2+)
   - Разные права на создание/удаление новостей

7. **Страницы**
   - **Главная**: Новостная лента, создание новостей (для админов)
   - **Профиль**: Информация о пользователе, статус Discord, прогресс-бар
   - **Сотрудники**: Два раздела (Лос Сантос и Блэйн) с таблицами сотрудников
   - **Обращения**: Форма подачи, список обращений, админ-панель, Discord интеграция
   - **Админка**: Управление ролями пользователей

8. **UI/UX**
   - Прелоадер с гербом и анимацией
   - Строгий официальный стиль в темно-синих тонах
   - Золотые акценты
   - Адаптивный дизайн
   - Модальные окна для форм
   - Уведомления о статусе операций
   - Toast уведомления с анимацией

### 🚧 В планах:
- [ ] Полная интеграция Discord OAuth через Edge Functions
- [ ] Система законов и указов
- [ ] Документооборот
- [ ] Календарь мероприятий
- [ ] Система обратной связи
- [ ] Статистика активности

---

## 🔧 ТЕХНИЧЕСКИЕ ОСОБЕННОСТИ

### Discord OAuth через Edge Function:

**Edge Function URL:**
```
https://bdzrnrvjclysjfkfilgz.supabase.co/functions/v1/discord-auth
```

### Discord Forum Webhook через Edge Function:

**Edge Function URL:**
```
https://bdzrnrvjclysjfkfilgz.supabase.co/functions/v1/discord-forum-notification
```

**Типы запросов:**
- `type: 'new_appeal'` - создание новой темы при обращении
- `type: 'send_response'` - отправка ответа в существующую тему
- `type: 'test_webhook'` - тестирование webhook соединения

**Формат названия темы:**
```
❓ Вопрос | JohnDoe - Проблема с документами
⚠️ Жалоба | JaneSmith - Жалоба на сотрудника
💡 Предложение | MikeJohnson - Предложение по улучшению
📋 Запрос | SarahWilliams - Запрос на получение справки
```

### Supabase операции:

**Получить новости:**
```javascript
const { data } = await supabaseClient
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
```

**Создать новость:**
```javascript
const { error } = await supabaseClient
    .from('news')
    .insert([{
        title: title,
        content: content,
        author_name: currentUser.character_name,
        author_role: currentUser.role
    }]);
```

**Получить обращения пользователя:**
```javascript
const { data } = await supabaseClient
    .from('appeals')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
```

**Обновить Discord ID:**
```javascript
const { error } = await supabaseClient
    .from('users')
    .update({ discord_id: discordId })
    .eq('id', currentUser.id);
```

**Создать обращение с Discord уведомлением:**
```javascript
// 1. Создаем обращение в БД
const { data: appealData } = await supabaseClient
    .from('appeals')
    .insert([{...}])
    .select()
    .single();

// 2. Отправляем уведомление в Discord
const response = await fetch(`${SUPABASE_URL}/functions/v1/discord-forum-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        type: 'new_appeal',
        appeal: appealData
    })
});
```

---

## 🐛 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

1. **Discord OAuth**: Требуется настройка Edge Function и переменных окружения
2. **Пароли**: Хранятся в открытом виде (нужно внедрить bcrypt)
3. **RLS Policy**: Временно отключена для разработки
4. **Discord Webhook**: Иногда не возвращает thread_id, но тема создается

---

## 📝 КЛЮЧЕВЫЕ ПЕРЕМЕННЫЕ

```javascript
// В config.js
const SUPABASE_URL = 'https://bdzrnrvjclysjfkfilgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WIsagGrDuRoJnshaFyZnCQ_YbvkwXJz';

// Глобальные переменные
window.currentUser     // Текущий пользователь
window.ROLES          // Объект с ролями
window.SUPABASE_URL   // URL Supabase
window.SUPABASE_ANON_KEY // Анонимный ключ
window.supabaseClient // Клиент Supabase

// Функции доступа
hasAccess(requiredLevel);  // Проверка уровня доступа
hasDiscordLinked();        // Проверка привязки Discord
updateDiscordId();         // Обновление Discord ID
```

---

## 🚀 ЗАПУСК ПРОЕКТА

### Локальная разработка:
```bash
# VS Code с Live Server
ext install ritwickdey.liveserver
# ПКМ по index.html → Open with Live Server

# Или используйте Python
python -m http.server 8000
```

### Настройка Supabase:
1. Создать проект на [supabase.com](https://supabase.com)
2. Выполнить SQL скрипты для создания таблиц
3. Настроить Edge Functions:
   - `discord-auth` - для OAuth авторизации
   - `discord-forum-notification` - для webhook уведомлений
4. Вставить переменные окружения в функции
5. Настроить Discord Webhook в таблице `discord_settings`

### Настройка Discord Webhook:
```sql
INSERT INTO discord_settings (setting_key, setting_value, description) 
VALUES ('forum_webhook_url', 'YOUR_WEBHOOK_URL', 'Webhook для форумного канала');
```

---

## 📊 СТАТУС РАЗРАБОТКИ

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| Авторизация | ✅ | Работает |
| Регистрация | ✅ | Работает |
| Ролевая система | ✅ | 7 ролей |
| Новостная лента | ✅ | Полностью готова |
| Обращения граждан | ✅ | Полностью готовы |
| Discord интеграция | ✅ | OAuth + Webhook |
| Discord Forum Webhook | ✅ | Создание тем и ответов |
| Профиль | ✅ | Discord статус |
| Сотрудники | ✅ | 2 раздела |
| Админ-панель | ✅ | Управление ролями |
| Мобильная версия | ✅ | Адаптив |
| Дизайн | ✅ | Dark Blue Theme |

---

## 🔄 ИСТОРИЯ ИЗМЕНЕНИЙ

### 2026-04-15
- Полностью обновлена цветовая схема на темно-синюю
- Добавлена система новостей на главную страницу
- Добавлена система обращений граждан
- Интеграция Discord OAuth2
- Интеграция Discord Forum Webhook
- Автоматическое создание тем в Discord при обращениях
- Отправка ответов мэрии в Discord темы
- Созданы Edge Functions для Discord интеграции
- Обновлены все страницы под новый дизайн
- Добавлены toast уведомления

---

## 📞 КОНТАКТЫ И РЕСУРСЫ

- **Тип проекта**: GTA 5 RP (Majestic)
- **Команда**: Мэрия Сан-Андреас
- **Назначение**: Официальный портал мэрии

### Полезные ссылки:
- [Supabase Documentation](https://supabase.com/docs)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Webhooks Documentation](https://discord.com/developers/docs/resources/webhook)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Discord OAuth**: Client Secret хранится только в Edge Function, не на клиенте
2. **Discord Webhook**: Webhook URL хранится в Supabase, не в клиентском коде
3. **Безопасность**: Никогда не выкладывайте реальные ключи в публичный репозиторий
4. **RLS**: Перед продакшеном включить Row Level Security
5. **Пароли**: Обязательно внедрить хеширование перед реальным использованием
6. **Edge Functions**: Требуют настройки переменных окружения в Supabase

---

**Статус проекта**: Активно развивается 🚀
```

Обновление включает:
- Новые таблицы `discord_settings` и `discord_notification_logs`
- Обновленную структуру таблицы `appeals` (добавлены поля для Discord)
- Полную информацию о Discord Webhook интеграции
- Технические детали Edge Functions
- Обновленный статус разработки
- Инструкции по настройке Discord Webhook