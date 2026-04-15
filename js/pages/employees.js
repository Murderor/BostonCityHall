async function renderEmployees() {
    const content = document.getElementById('page-content');
    
    // Получаем всех сотрудников
    const allEmployees = await getAllEmployees();
    
    // Разделяем по юрисдикции
    const losSantosEmployees = allEmployees.filter(emp => 
        emp.role.includes('Лос Сантос') || 
        (emp.role === 'Сотрудник мэрии' && !emp.role.includes('Блэйн'))
    );
    
    const blaineEmployees = allEmployees.filter(emp => 
        emp.role.includes('Блэйн') || 
        (emp.role === 'Сотрудник мэрии' && emp.role.includes('Блэйн'))
    );
    
    // Сортируем по должности (от высшей к низшей)
    const sortByRole = (a, b) => {
        const roleOrder = {
            'Мэр города Лос Сантос': 1,
            'Мэр округа Блэйн': 1,
            'Заместитель мэра города Лос Сантос': 2,
            'Заместитель Мэра Округа Блэйн': 2,
            'Сотрудник мэрии': 3
        };
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
    };
    
    losSantosEmployees.sort(sortByRole);
    blaineEmployees.sort(sortByRole);
    
    content.innerHTML = `
        <div class="employees-container">
            <h1>👥 Сотрудники мэрии</h1>
            <p class="employees-subtitle">Официальный состав администраций</p>
            
            <!-- Мэрия Лос-Сантос -->
            <div class="municipality-section">
                <div class="section-header">
                    <div class="section-icon">🏙️</div>
                    <div class="section-title">
                        <h2>Мэрия города Лос-Сантос</h2>
                        <p>Администрация центрального района</p>
                    </div>
                </div>
                
                <div class="employees-grid">
                    ${losSantosEmployees.length > 0 ? `
                        <div class="table-container">
                            <table class="employees-table">
                                <thead>
                                    <tr>
                                        <th>Должность</th>
                                        <th>Имя персонажа</th>
                                        <th>Static ID</th>
                                        <th>Пол</th>
                                        <th>Дата назначения</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${losSantosEmployees.map(emp => `
                                        <tr class="role-${getRoleClassName(emp.role)}">
                                            <td>
                                                <div class="role-cell">
                                                    <span class="role-icon">${ROLES[emp.role]?.icon || '👤'}</span>
                                                    <span class="role-name">${emp.role}</span>
                                                </div>
                                            </td>
                                            <td><strong>${emp.character_name}</strong></td>
                                            <td>${emp.static_id}</td>
                                            <td>${emp.gender}</td>
                                            <td>${new Date(emp.created_at).toLocaleDateString('ru-RU')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>Нет сотрудников</p>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Мэрия округа Блэйн -->
            <div class="municipality-section">
                <div class="section-header">
                    <div class="section-icon">🏜️</div>
                    <div class="section-title">
                        <h2>Мэрия округа Блэйн</h2>
                        <p>Администрация сельских территорий</p>
                    </div>
                </div>
                
                <div class="employees-grid">
                    ${blaineEmployees.length > 0 ? `
                        <div class="table-container">
                            <table class="employees-table">
                                <thead>
                                    <tr>
                                        <th>Должность</th>
                                        <th>Имя персонажа</th>
                                        <th>Static ID</th>
                                        <th>Пол</th>
                                        <th>Дата назначения</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${blaineEmployees.map(emp => `
                                        <tr class="role-${getRoleClassName(emp.role)}">
                                            <td>
                                                <div class="role-cell">
                                                    <span class="role-icon">${ROLES[emp.role]?.icon || '👤'}</span>
                                                    <span class="role-name">${emp.role}</span>
                                                </div>
                                            </td>
                                            <td><strong>${emp.character_name}</strong></td>
                                            <td>${emp.static_id}</td>
                                            <td>${emp.gender}</td>
                                            <td>${new Date(emp.created_at).toLocaleDateString('ru-RU')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>Нет сотрудников</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

async function getAllEmployees() {
    const { data } = await supabaseClient
        .from('users')
        .select('*')
        .neq('role', 'Гражданин')
        .neq('role', 'Гражданка')
        .order('created_at', { ascending: false });
    return data || [];
}

function getRoleClassName(role) {
    if (role.includes('Мэр') && role.includes('Лос Сантос')) return 'mayor-ls';
    if (role.includes('Мэр') && role.includes('Блэйн')) return 'mayor-blaine';
    if (role.includes('Заместитель') && role.includes('Лос Сантос')) return 'deputy-ls';
    if (role.includes('Заместитель') && role.includes('Блэйн')) return 'deputy-blaine';
    if (role === 'Сотрудник мэрии') return 'employee';
    return 'default';
}