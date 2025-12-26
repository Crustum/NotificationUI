/**
 * CakePHP Notification Manager
 *
 * Manages notification state, API communication, and polling.
 * Central hub for all notification operations.
 */
class CakeNotificationManager {
    constructor(options = {}) {
        this.options = {
            apiUrl: '/notification/notifications/unread.json',
            pollInterval: 30000,
            enablePolling: true,
            perPage: 10,
            ...options
        };

        this.notifications = [];
        this.unreadCount = 0;
        this.lastCheckTime = null;
        this.isLoading = false;
        this.pollTimer = null;
        this.listeners = {};
        this.modules = [];
    }

    registerModule(module) {
        this.modules.push(module);
        if (typeof module.init === 'function') {
            module.init(this);
        }
        return this;
    }

    async init() {
        if (this.options.enablePolling && this.options.apiUrl) {
            await this.loadNotifications();
            this.startPolling();
        }
        return this;
    }

    addNotification(notification) {
        const exists = this.notifications.find(n => n.id === notification.id);
        if (!exists) {
            notification._isNew = true;
            this.notifications.unshift(notification);

            if (!notification.read_at) {
                this.unreadCount++;
            }

            this.emit('notification:added', { notification });
            this.emit('notifications:changed', { notifications: this.notifications });

            setTimeout(() => {
                notification._isNew = false;
                this.emit('notifications:changed', { notifications: this.notifications });
            }, 5000);
        }
        return this;
    }

    async loadNotifications(page = 1, append = false) {
        if (this.isLoading || !this.options.apiUrl) return;

        this.isLoading = true;
        this.emit('notifications:loading', { page, append });

        try {
            const url = new URL(this.options.apiUrl, window.location.origin);
            url.searchParams.set('page', page);
            url.searchParams.set('limit', this.options.perPage);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();

            if (result.success) {
                this.handleLoadSuccess(result, append);
            } else {
                throw new Error(result.message || 'Failed to load');
            }
        } catch (error) {
            this.emit('notifications:error', { error });
        } finally {
            this.isLoading = false;
            this.emit('notifications:loaded');
        }
    }

    handleLoadSuccess(result, append) {
        const normalizeNotification = (notification) => {
            if (notification.data?.actions && !notification.actions) {
                notification.actions = notification.data.actions;
            }
            notification._source = 'api';
            return notification;
        };

        if (append) {
            const normalized = (result.data || []).map(normalizeNotification);
            this.notifications = this.notifications.concat(normalized);
        } else {
            const preserved = this.notifications.filter(n => n._source !== 'api');
            const preservedIds = new Set(preserved.map(n => n.id));
            const apiItems = (result.data || [])
                .filter(n => !preservedIds.has(n.id))
                .map(normalizeNotification);
            this.notifications = preserved.concat(apiItems);
            this.lastCheckTime = new Date();
        }

        this.unreadCount = result.meta?.count || 0;
        this.emit('notifications:changed', {
            notifications: this.notifications,
            pagination: result.pagination
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/notification/notifications/${notificationId}/read.json`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                await this.loadNotifications();
                this.emit('notification:marked-read', { notificationId });
            } else {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification && notification._source !== 'api') {
                    this.removeNotification(notificationId);
                }
            }
        } catch (error) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && notification._source !== 'api') {
                this.removeNotification(notificationId);
            }
            this.emit('notifications:error', { error });
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/notification/notifications/mark-all-read.json', {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                this.notifications = [];
                this.unreadCount = 0;
                this.emit('notifications:changed', { notifications: [] });
                this.emit('notifications:all-marked-read');
            }
        } catch (error) {
            this.emit('notifications:error', { error });
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.unreadCount = 0;
        this.emit('notifications:changed', { notifications: [] });
        this.emit('notifications:all-marked-read');
    }

    removeNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            const notification = this.notifications[index];
            if (!notification.read_at) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.notifications.splice(index, 1);
            this.emit('notification:removed', { notificationId });
            this.emit('notifications:changed', { notifications: this.notifications });
        }
    }

    startPolling() {
        if (!this.options.enablePolling || !this.options.apiUrl) return;
        if (this.options.pollInterval > 0) {
            this.pollTimer = setInterval(() => {
                this.checkForNewNotifications();
            }, this.options.pollInterval);
        }
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    async checkForNewNotifications() {
        if (this.isLoading || !this.lastCheckTime) return;

        try {
            const url = new URL(this.options.apiUrl, window.location.origin);
            url.searchParams.set('page', 1);
            url.searchParams.set('limit', 50);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) return;

            const result = await response.json();

            if (result.success && result.data.length > 0) {
                const existingIds = new Set(this.notifications.map(n => n.id));
                const newNotifications = result.data.filter(notif => {
                    const notifTime = new Date(notif.created_at || notif.created);
                    if (notifTime <= this.lastCheckTime) {
                        return false;
                    }
                    if (existingIds.has(notif.id)) {
                        return false;
                    }
                    return true;
                });

                newNotifications.forEach(notif => {
                    if (notif.data?.actions && !notif.actions) {
                        notif.actions = notif.data.actions;
                    }
                    notif._isNew = true;
                    this.addNotification(notif);
                });
            }
        } catch (error) {
            console.error('Failed to check for new notifications:', error);
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.listeners[event]) return this;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        return this;
    }

    emit(event, data = {}) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
        return this;
    }

    getNotifications() {
        return [...this.notifications];
    }

    getUnreadCount() {
        return this.unreadCount;
    }

    getCsrfToken() {
        let meta = document.querySelector('meta[name="csrfToken"]');
        if (!meta) {
            meta = document.querySelector('meta[name="csrf-token"]');
        }
        return meta ? meta.getAttribute('content') : '';
    }

    destroy() {
        this.stopPolling();
        this.listeners = {};
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager: CakeNotificationManager };
} else {
    window.CakeNotificationManager = CakeNotificationManager;
}

