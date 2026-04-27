// Функции для работы с токеном
function setToken(token) {
    localStorage.setItem('token', token);
}
function getToken() {
    return localStorage.getItem('token');
}
function clearToken() {
    localStorage.removeItem('token');
}
function isAuthenticated() {
    return !!getToken();
}
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}
function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}
function clearUser() {
    localStorage.removeItem('user');
}

// Обновление навигации
function updateNav() {
    const user = getUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const profileLink = document.getElementById('profileLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline';
        if (adminLink && user.role === 'admin') adminLink.style.display = 'inline';
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (registerLink) registerLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Выход
function logout() {
    clearToken();
    clearUser();
    window.location.href = 'index.html';
}

// Загрузка списка мероприятий (используется на главной)
async function loadEvents(filter = 'all') {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    eventsList.innerHTML = '<div class="loading">Загрузка...</div>';
    try {
        let url = '/api/events';
        if (filter !== 'all') url += `?filter=${filter}`;
        const res = await fetch(url);
        const events = await res.json();
        if (events.length === 0) {
            eventsList.innerHTML = '<div>Нет мероприятий</div>';
            return;
        }
        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                ${event.image_url ? `<img class="event-image" src="${event.image_url}" alt="${event.title}">` : '<div class="event-image" style="background:#d9eef5;"></div>'}
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">📅 ${event.date}</div>
                    <div class="event-time">🕒 ${event.time}</div>
                    <div class="event-location">📍 ${event.location}</div>
                    <a href="event.html?id=${event.id}" class="btn">Подробнее</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        eventsList.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// Добавляем обработчики на фильтры на главной
function initFilters() {
    const filterBtns = document.querySelectorAll('.filters button');
    if (!filterBtns.length) return;
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            loadEvents(filter);
        });
    });
    loadEvents('all');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Для главной страницы
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        initFilters();
    }
});
