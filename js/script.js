// js/script.js

// Инициализация хранилищ (если пустые)
function initStorage() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, name: "Администратор", email: "admin@youth.ru", password: "admin", role: "admin" }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    if (!localStorage.getItem('reviews')) {
        localStorage.setItem('reviews', JSON.stringify([]));
    }
    if (!localStorage.getItem('applications')) {
        localStorage.setItem('applications', JSON.stringify([]));
    }
}

// Получение текущего пользователя
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Сохранение текущего пользователя
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// Выход
function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
}

// Проверка, админ ли
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Обновление навигации на всех страницах
function updateNav() {
    const user = getCurrentUser();
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

// Утилита: экранирование HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<div class="notification-content"><i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span></div>`;
    notif.style.cssText = `position:fixed; top:20px; right:20px; z-index:10000; background:white; border-left:4px solid ${type==='success'?'#4CAF50':'#f44336'}; padding:12px 20px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Загрузка списка мероприятий на главную (с фильтрацией)
function loadEventsList(containerId, filter = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;
    let events = JSON.parse(localStorage.getItem('events') || '[]');
    const now = new Date().toISOString().split('T')[0];
    if (filter === 'upcoming') {
        events = events.filter(e => e.date >= now);
    } else if (filter === 'past') {
        events = events.filter(e => e.date < now);
    }
    events.sort((a,b) => a.date.localeCompare(b.date));
    if (events.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding:40px;">Нет мероприятий. Добавьте их через админ-панель.</div>';
        return;
    }
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img class="event-image" src="${event.image}" alt="${escapeHtml(event.title)}">` : '<div class="event-image" style="background:#d9eef5;"></div>'}
            <div class="event-info">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-date">📅 ${event.date}</div>
                <div class="event-time">🕒 ${event.time}</div>
                <div class="event-location">📍 ${event.location}</div>
                <a href="event.html?id=${event.id}" class="btn">Подробнее</a>
            </div>
        </div>
    `).join('');
}

// Функция для обновления имени пользователя (в профиле)
function updateUserName(newName) {
    const user = getCurrentUser();
    if (!user) return false;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index].name = newName;
        localStorage.setItem('users', JSON.stringify(users));
        setCurrentUser({ ...user, name: newName });
        return true;
    }
    return false;
}

// Функция для добавления ответа на отзыв
function addReplyToReview(reviewId, replyText) {
    const user = getCurrentUser();
    if (!user) return false;
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const review = reviews.find(r => r.id == reviewId);
    if (!review) return false;
    if (!review.replies) review.replies = [];
    review.replies.push({
        authorId: user.id,
        authorName: user.name,
        text: replyText,
        date: new Date().toISOString().split('T')[0]
    });
    localStorage.setItem('reviews', JSON.stringify(reviews));
    return true;
}

// Инициализация страницы (общая)
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    updateNav();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});