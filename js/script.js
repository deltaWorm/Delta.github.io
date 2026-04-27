// js/script.js

// ========== НАСТРОЙКИ JSONBIN ==========
const BIN_ID = "69ef4067856a68218979b08a";          // замените на ваш Bin ID
const API_KEY = "$2a$10$Dc.opl3vipqmBcnBHEpjuONNcea7nVvxpfc8nr9wvCh62kyQHU/n6";        // замените на ваш API Key
const BASE_URL = `https://api.jsonbin.io/v3/b/69ef4067856a68218979b08a`;
// Глобальный кэш данных
let appData = null;
let currentUser = null;

// Загрузка данных из JSONBin
async function loadData() {
    try {
        const response = await fetch(BASE_URL, {
            headers: { 'X-Master-Key': API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        return json.record;
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        return null;
    }
}

// Сохранение данных в JSONBin
async function saveData(data) {
    try {
        await fetch(BASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error("Ошибка сохранения:", error);
        throw error;
    }
}

// Инициализация: загружаем данные, если их нет – создаём структуру
async function initStorage() {
    let data = await loadData();
    if (!data || !data.users) {
        // Первый запуск – создаём стартовую структуру
        const defaultData = {
            users: [
                { id: 1, name: "Администратор", email: "admin@youth.ru", password: "admin", role: "admin" }
            ],
            events: [],
            reviews: [],
            applications: []
        };
        await saveData(defaultData);
        appData = defaultData;
    } else {
        appData = data;
    }
    return appData;
}

// Получить актуальные данные (с обновлением кэша)
async function refreshData() {
    appData = await loadData();
    return appData;
}

// Обновить весь объект данных в хранилище
async function updateData(newData) {
    appData = newData;
    await saveData(appData);
}

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ==========
async function getUsers() { return appData.users; }
async function saveUsers(users) { appData.users = users; await updateData(appData); }
async function addUser(user) {
    const users = appData.users;
    const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    users.push(newUser);
    await saveUsers(users);
    return newUser;
}
async function updateUser(userId, updates) {
    const users = appData.users;
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        await saveUsers(users);
        return true;
    }
    return false;
}
async function getUserById(id) {
    return appData.users.find(u => u.id === id);
}
async function getUserByEmail(email) {
    return appData.users.find(u => u.email === email);
}

// ========== МЕРОПРИЯТИЯ ==========
async function getEvents() { return appData.events; }
async function saveEvents(events) { appData.events = events; await updateData(appData); }
async function addEvent(event) {
    const events = appData.events;
    const newId = events.length ? Math.max(...events.map(e => e.id)) + 1 : 1;
    const newEvent = { ...event, id: newId, createdAt: new Date().toISOString().split('T')[0] };
    events.push(newEvent);
    await saveEvents(events);
    return newEvent;
}
async function updateEvent(eventId, updatedData) {
    const events = appData.events;
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updatedData };
        await saveEvents(events);
        return true;
    }
    return false;
}
async function deleteEvent(eventId) {
    let events = appData.events;
    events = events.filter(e => e.id !== eventId);
    await saveEvents(events);
    // удалить связанные отзывы и заявки
    let reviews = appData.reviews;
    reviews = reviews.filter(r => r.eventId !== eventId);
    appData.reviews = reviews;
    let applications = appData.applications;
    applications = applications.filter(a => a.eventId !== eventId);
    appData.applications = applications;
    await updateData(appData);
}
async function getEventById(id) {
    return appData.events.find(e => e.id === id);
}
async function getEventsWithDetails() {
    return [...appData.events].sort((a,b) => a.date.localeCompare(b.date));
}

// ========== ОТЗЫВЫ ==========
async function getReviews() { return appData.reviews; }
async function saveReviews(reviews) { appData.reviews = reviews; await updateData(appData); }
async function addReview(review) {
    const reviews = appData.reviews;
    const newId = reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    const newReview = { ...review, id: newId, replies: [] };
    reviews.push(newReview);
    await saveReviews(reviews);
    return newReview;
}
async function getReviewsForEvent(eventId) {
    const reviews = appData.reviews.filter(r => r.eventId === eventId);
    const users = appData.users;
    return reviews.map(r => {
        const author = users.find(u => u.id === r.userId);
        return { ...r, userName: author ? author.name : 'Гость' };
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
}
async function deleteReview(reviewId, currentUserId, currentUserRole) {
    let reviews = appData.reviews;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;
    if (review.userId === currentUserId || currentUserRole === 'admin') {
        reviews = reviews.filter(r => r.id !== reviewId);
        await saveReviews(reviews);
        return true;
    }
    return false;
}
async function addReplyToReview(reviewId, replyText, authorId, authorName) {
    let reviews = appData.reviews;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;
    if (!review.replies) review.replies = [];
    review.replies.push({
        authorId: authorId,
        authorName: authorName,
        text: replyText,
        date: new Date().toISOString().split('T')[0]
    });
    await saveReviews(reviews);
    return true;
}

// ========== ЗАЯВКИ ==========
async function getApplications() { return appData.applications; }
async function saveApplications(apps) { appData.applications = apps; await updateData(appData); }
async function addApplication(application) {
    const apps = appData.applications;
    const newId = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    const newApp = { ...application, id: newId, createdAt: new Date().toISOString().split('T')[0], status: 'pending' };
    apps.push(newApp);
    await saveApplications(apps);
    return newApp;
}
async function updateApplicationStatus(appId, status) {
    const apps = appData.applications;
    const app = apps.find(a => a.id === appId);
    if (app) {
        app.status = status;
        await saveApplications(apps);
        return true;
    }
    return false;
}
async function getUserApplications(userId, userEmail) {
    return appData.applications.filter(a => a.userId === userId || a.guestEmail === userEmail);
}

// ========== УПРАВЛЕНИЕ СЕССИЕЙ ==========
async function restoreSession() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        const user = JSON.parse(stored);
        // Проверим, существует ли такой пользователь в актуальных данных
        await refreshData(); // обновим из облака
        const valid = appData.users.find(u => u.id === user.id);
        if (valid) {
            currentUser = valid;
        } else {
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    } else {
        currentUser = null;
    }
}
function getCurrentUser() { return currentUser; }
async function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}
async function logout() {
    await setCurrentUser(null);
    window.location.href = 'index.html';
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<div class="notification-content"><i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span></div>`;
    notif.style.cssText = `position:fixed; top:20px; right:20px; z-index:10000; background:white; border-left:4px solid ${type==='success'?'#4CAF50':'#f44336'}; padding:12px 20px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Обновление навигации (показывает ссылки в зависимости от авторизации)
async function updateNav() {
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
        else if (adminLink) adminLink.style.display = 'none';
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (registerLink) registerLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Загрузка списка мероприятий на главную (используется в index.html)
async function loadEventsList(containerId, filter = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;
    let events = await getEvents();
    const now = new Date().toISOString().split('T')[0];
    if (filter === 'upcoming') {
        events = events.filter(e => e.date >= now);
    } else if (filter === 'past') {
        events = events.filter(e => e.date < now);
    }
    events.sort((a,b) => a.date.localeCompare(b.date));
    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Нет мероприятий. Добавьте их через админ-панель.</div>';
        return;
    }
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img class="event-image" src="${event.image}" alt="${escapeHtml(event.title)}">` : '<div class="event-image" style="background:#d9eef5;"></div>'}
            <div class="event-info">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-date">📅 ${event.date}</div>
                <div class="event-time">🕒 ${event.start_time} – ${event.end_time}</div>
                <div class="event-location">📍 ${event.location}</div>
                <a href="event.html?id=${event.id}" class="btn">Подробнее</a>
            </div>
        </div>
    `).join('');
}

// Инициализация при загрузке любой страницы
document.addEventListener('DOMContentLoaded', async () => {
    await initStorage();   // загружаем данные из облака
    await restoreSession(); // восстанавливаем сессию
    await updateNav();      // обновляем меню
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
});
