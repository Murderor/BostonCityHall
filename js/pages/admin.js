async function renderAdminPanel() {
    const content = document.getElementById('page-content');
    
    const users = await getAllUsers();
    
    content.innerHTML = `
        <div class="admin-container">
            <h1>Управление пользователями</h1>
            <div class="dashboard-card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Имя</th>
                                <th>Static ID</th>
                                <th>Пол</th>
                                <th>Роль</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>${user.character_name}</td>
                                    <td>${user.static_id}</td>
                                    <td>${user.gender}</td>
                                    <td>
                                        <select class="role-select" data-user-id="${user.id}">
                                            ${Object.keys(ROLES).map(role => `
                                                <option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>
                                            `).join('')}
                                        </select>
                                    </td>
                                    <td>
                                        <button class="btn-save-role" data-user-id="${user.id}">Сохранить</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.querySelectorAll('.btn-save-role').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            const select = document.querySelector(`.role-select[data-user-id="${userId}"]`);
            const newRole = select.value;
            
            const { error } = await supabaseClient
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (!error) {
                alert('Роль обновлена');
                if (currentUser.id == userId) {
                    currentUser.role = newRole;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    await loadNav();
                }
            } else {
                alert('Ошибка обновления');
            }
        });
    });
}

async function getAllUsers() {
    const { data } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
}