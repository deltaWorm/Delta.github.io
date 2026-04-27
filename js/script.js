// js/script.js

// ========== НАСТРОЙКИ JSONBIN ==========
const BIN_ID = "69ef4067856a68218979b08a";          // замените на ваш Bin ID
const API_KEY = "$2a$10$Dc.opl3vipqmBcnBHEpjuONNcea7nVvxpfc8nr9wvCh62kyQHU/n6";        // замените на ваш API Key
const BASE_URL = `https://api.jsonbin.io/v3/b/69ef4067856a68218979b08a`;

// Функция загрузки всех данных из JSONBin
async function loadData() {
    const response = await fetch(BASE_URL, {
        headers: { 'X-Master-Key': API_KEY }
    });
    const data = await response.json();
    return data.record; // объект с users, events, reviews, applications
}

// Функция сохранения всех данных в JSONBin
async function saveData(data) {
    await fetch(BASE_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
}

// Глобальные переменные для кэша (чтобы не грузить постоянно)
let cachedData = null;

// Обновить кэш и сохранить
async function updateCacheAndSave(newData) {
    cachedData = newData;
    await saveData(cachedData);
}

// Получить актуальные данные (с кэшем)
async function getData() {
    if (!cachedData) {
        cachedData = await loadData();
    }
    return cachedData;
}

// Инициализация (если данных нет, создаём структуру)
async function initStorage() {
    try {
        const data = await loadData();
        if (!data.users) {
            // Первый запуск – инициализируем
            const defaultData = {
                users: [
                    { id: 1, name: "Администратор", email: "admin@youth.ru", password: "admin", role: "admin" }
                ],
                events: [],
                reviews: [],
                applications: []
            };
            await saveData(defaultData);
            cachedData = defaultData;
        } else {
            cachedData = data;
        }
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
}

// ========== ПОЛЬЗОВАТЕЛИ ==========
async function getUsers() { const data = await getData(); return data.users; }
async function saveUsers(users) { const data = await getData(); data.users = users; await updateCacheAndSave(data); }
async function addUser(user) {
    const users = await getUsers();
    const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    users.push(newUser);
    await saveUsers(users);
    return newUser;
}
async function updateUser(userId, updates) {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        await saveUsers(users);
        return true;
    }
    return false;
}
async function getUserById(id) {
    const users = await getUsers();
    return users.find(u => u.id === id);
}
async function getUserByEmail(email) {
    const users = await getUsers();
    return users.find(u => u.email === email);
}

// ========== МЕРОПРИЯТИЯ ==========
async function getEvents() { const data = await getData(); return data.events; }
async function saveEvents(events) { const data = await getData(); data.events = events; await updateCacheAndSave(data); }
async function addEvent(event) {
    const events = await getEvents();
    const newId = events.length ? Math.max(...events.map(e => e.id)) + 1 : 1;
    const newEvent = { ...event, id: newId, createdAt: new Date().toISOString().split('T')[0] };
    events.push(newEvent);
    await saveEvents(events);
    return newEvent;
}
async function updateEvent(eventId, updatedData) {
    const events = await getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updatedData };
        await saveEvents(events);
        return true;
    }
    return false;
}
async function deleteEvent(eventId) {
    let events = await getEvents();
    events = events.filter(e => e.id !== eventId);
    await saveEvents(events);
    // также удаляем связанные отзывы и заявки
    let reviews = await getReviews();
    reviews = reviews.filter(r => r.eventId !== eventId);
    await saveReviews(reviews);
    let apps = await getApplications();
    apps = apps.filter(a => a.eventId !== eventId);
    await saveApplications(apps);
}
async function getEventById(id) {
    const events = await getEvents();
    return events.find(e => e.id === id);
}
async function getEventsWithDetails() {
    const events = await getEvents();
    return events.sort((a,b) => a.date.localeCompare(b.date));
}

// ========== ОТЗЫВЫ ==========
async function getReviews() { const data = await getData(); return data.reviews; }
async function saveReviews(reviews) { const data = await getData(); data.reviews = reviews; await updateCacheAndSave(data); }
async function addReview(review) {
    const reviews = await getReviews();
    const newId = reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    const newReview = { ...review, id: newId, replies: [] };
    reviews.push(newReview);
    await saveReviews(reviews);
    return newReview;
}
async function getReviewsForEvent(eventId) {
    const reviews = await getReviews();
    const users = await getUsers();
    const eventReviews = reviews.filter(r => r.eventId === eventId);
    return eventReviews.map(r => {
        const author = users.find(u => u.id === r.userId);
        return { ...r, userName: author ? author.name : 'Гость' };
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
}
async function deleteReview(reviewId, currentUserId, currentUserRole) {
    let reviews = await getReviews();
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
    let reviews = await getReviews();
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
async function getApplications() { const data = await getData(); return data.applications; }
async function saveApplications(apps) { const data = await getData(); data.applications = apps; await updateCacheAndSave(data); }
async function addApplication(application) {
    const apps = await getApplications();
    const newId = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    const newApp = { ...application, id: newId, createdAt: new Date().toISOString().split('T')[0], status: 'pending' };
    apps.push(newApp);
    await saveApplications(apps);
    return newApp;
}
async function updateApplicationStatus(appId, status) {
    let apps = await getApplications();
    const app = apps.find(a => a.id === appId);
    if (app) {
        app.status = status;
        await saveApplications(apps);
        return true;
    }
    return false;
}
async function getUserApplications(userId, userEmail) {
    const apps = await getApplications();
    return apps.filter(a => a.userId === userId || a.guestEmail === userEmail);
}

// ========== ПОЛЬЗОВАТЕЛЬСКАЯ СЕССИЯ ==========
let currentUser = null;
function getCurrentUser() { return currentUser; }
async function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
        currentUser = null;
    }
}
async function restoreSession() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        const users = await getUsers();
        const valid = users.find(u => u.id === currentUser.id);
        if (!valid) currentUser = null;
    }
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
async function updateNav() {
    const user = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const profileLink = document.getElementById('profileLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginLink) loginLink.style.display = user ? 'none' : 'inline';
    if (registerLink) registerLink.style.display = user ? 'none' : 'inline';
    if (profileLink) profileLink.style.display = user ? 'inline' : 'none';
    if (logoutBtn) logoutBtn.style.display = user ? 'inline' : 'none';
    if (adminLink && user && user.role === 'admin') adminLink.style.display = 'inline';
    else if (adminLink) adminLink.style.display = 'none';
}
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
        container.innerHTML = '<div style="padding:40px; text-align:center;">Нет мероприятий. Добавьте их через админ-панель.</div>';
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
async function logout() {
    await setCurrentUser(null);
    window.location.href = 'index.html';
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await initStorage();
    await restoreSession();
    await updateNav();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});
