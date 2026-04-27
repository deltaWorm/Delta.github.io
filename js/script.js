// js/script.js
// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initStorage() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, name: "Администратор", email: "admin@youth.ru", password: "admin", role: "admin" }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('events')) localStorage.setItem('events', '[]');
    if (!localStorage.getItem('reviews')) localStorage.setItem('reviews', '[]');
    if (!localStorage.getItem('applications')) localStorage.setItem('applications', '[]');
}

// ========== ПОЛЬЗОВАТЕЛИ ==========
function getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); }
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
function addUser(user) {
    const users = getUsers();
    const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        saveUsers(users);
        return true;
    }
    return false;
}
function getUserById(id) {
    return getUsers().find(u => u.id === id);
}
function getUserByEmail(email) {
    return getUsers().find(u => u.email === email);
}

// ========== МЕРОПРИЯТИЯ ==========
function getEvents() { return JSON.parse(localStorage.getItem('events') || '[]'); }
function saveEvents(events) { localStorage.setItem('events', JSON.stringify(events)); }
function addEvent(event) {
    const events = getEvents();
    const newId = events.length ? Math.max(...events.map(e => e.id)) + 1 : 1;
    const newEvent = { ...event, id: newId, createdAt: new Date().toISOString().split('T')[0] };
    events.push(newEvent);
    saveEvents(events);
    return newEvent;
}
function updateEvent(eventId, updatedData) {
    const events = getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updatedData };
        saveEvents(events);
        return true;
    }
    return false;
}
function deleteEvent(eventId) {
    let events = getEvents();
    events = events.filter(e => e.id !== eventId);
    saveEvents(events);
    let reviews = getReviews();
    reviews = reviews.filter(r => r.eventId !== eventId);
    saveReviews(reviews);
    let apps = getApplications();
    apps = apps.filter(a => a.eventId !== eventId);
    saveApplications(apps);
}
function getEventById(id) {
    return getEvents().find(e => e.id === id);
}
function getEventsWithDetails() {
    return getEvents().sort((a,b) => a.date.localeCompare(b.date));
}

// ========== ОТЗЫВЫ ==========
function getReviews() { return JSON.parse(localStorage.getItem('reviews') || '[]'); }
function saveReviews(reviews) { localStorage.setItem('reviews', JSON.stringify(reviews)); }
function addReview(review) {
    const reviews = getReviews();
    const newId = reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    const newReview = { ...review, id: newId, replies: [] };
    reviews.push(newReview);
    saveReviews(reviews);
    return newReview;
}
function getReviewsForEvent(eventId) {
    const reviews = getReviews().filter(r => r.eventId === eventId);
    const users = getUsers();
    return reviews.map(r => {
        const author = users.find(u => u.id === r.userId);
        return { ...r, userName: author ? author.name : 'Гость' };
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
}
function deleteReview(reviewId, currentUserId, currentUserRole) {
    let reviews = getReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;
    if (review.userId === currentUserId || currentUserRole === 'admin') {
        reviews = reviews.filter(r => r.id !== reviewId);
        saveReviews(reviews);
        return true;
    }
    return false;
}
function addReplyToReview(reviewId, replyText, authorId, authorName) {
    let reviews = getReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;
    if (!review.replies) review.replies = [];
    review.replies.push({
        authorId: authorId,
        authorName: authorName,
        text: replyText,
        date: new Date().toISOString().split('T')[0]
    });
    saveReviews(reviews);
    return true;
}

// ========== ЗАЯВКИ ==========
function getApplications() { return JSON.parse(localStorage.getItem('applications') || '[]'); }
function saveApplications(apps) { localStorage.setItem('applications', JSON.stringify(apps)); }
function addApplication(application) {
    const apps = getApplications();
    const newId = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    const newApp = { ...application, id: newId, createdAt: new Date().toISOString().split('T')[0], status: 'pending' };
    apps.push(newApp);
    saveApplications(apps);
    return newApp;
}
function updateApplicationStatus(appId, status) {
    const apps = getApplications();
    const app = apps.find(a => a.id === appId);
    if (app) {
        app.status = status;
        saveApplications(apps);
        return true;
    }
    return false;
}
function getUserApplications(userId, userEmail) {
    return getApplications().filter(a => a.userId === userId || a.guestEmail === userEmail);
}

// ========== СЕССИЯ ==========
let currentUser = null;
function getCurrentUser() { return currentUser; }
function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}
function restoreSession() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        const users = getUsers();
        const valid = users.find(u => u.id === currentUser.id);
        if (!valid) currentUser = null;
    }
}
function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
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
function updateNav() {
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
function loadEventsList(containerId, filter = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;
    let events = getEvents();
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
                <div class="event-time">🕒 ${event.start_time || '--:--'} – ${event.end_time || '--:--'}</div>
                <div class="event-location">📍 ${event.location}</div>
                <a href="event.html?id=${event.id}" class="btn">Подробнее</a>
            </div>
        </div>
    `).join('');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    restoreSession();
    updateNav();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});
