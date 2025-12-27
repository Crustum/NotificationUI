/**
 * Notification Manager - API Client & Composables
 *
 * Handles API communication, polling, and provides composable functions
 * for use with Alpine.js components
 */
class NotificationManager {
    constructor(options = {}) {
        this.options = {
            apiUrl: '/notification/notifications/unread.json',
            pollInterval: 30000,
            enablePolling: true,
            perPage: 10,
            ...options
        };

        this.lastCheckTime = null;
        this.pollTimer = null;
    }

    async loadNotifications(page = 1, append = false) {
        if (!this.options.apiUrl) {
            return { success: false, data: [], hasMore: false };
        }

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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.lastCheckTime = new Date();
                const unreadCount = result.meta?.unread_count ?? result.meta?.count ?? result.unreadCount ?? 0;
                return {
                    success: true,
                    data: result.data.map(n => this.normalizeNotification(n)),
                    hasMore: result.pagination?.has_next_page ?? result.pagination?.hasMore ?? false,
                    unreadCount: unreadCount
                };
            } else {
                throw new Error(result.message || 'Failed to load');
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            return { success: false, data: [], hasMore: false, error };
        }
    }

        async markAsRead(id) {
            const isLocalNotification = typeof id === 'string' && id.startsWith('notif-');
            if (isLocalNotification) {
                return true;
            }

            try {
                const response = await fetch(`/notification/notifications/${id}/read.json`, {
                    method: 'PATCH',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': this.getCsrfToken()
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        errorData = { message: errorText };
                    }
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

                const result = await response.json();
                return result.success || false;
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
                throw error;
            }
        }

    async markAllAsRead() {
        try {
            const response = await fetch('/notification/notifications/mark-all-read.json', {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.success || false;
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            return false;
        }
    }

    async deleteNotification(id) {
        try {
            const response = await fetch(`/notification/notifications/${id}.json`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.success || false;
        } catch (error) {
            console.error('Failed to delete notification:', error);
            return false;
        }
    }

    normalizeNotification(notification) {
        const normalized = {
            id: notification.id,
            title: notification.data?.title || notification.title || '',
            message: notification.data?.message || notification.message || '',
            type: notification.type || '',
            data: notification.data || {},
            created_at: notification.created_at || notification.created || new Date().toISOString(),
            read_at: notification.read_at || null
        };

        if (!normalized.data.icon && normalized.type) {
            const iconMap = {
                'success': 'check',
                'danger': 'alert',
                'error': 'alert',
                'warning': 'alert',
                'info': 'info'
            };
            if (iconMap[normalized.type]) {
                normalized.data.icon = iconMap[normalized.type];
            }
        }

        if (notification.actions && Array.isArray(notification.actions)) {
            normalized.actions = this.normalizeActions(notification.actions);
        } else if (notification.data?.actions && Array.isArray(notification.data.actions)) {
            normalized.actions = this.normalizeActions(notification.data.actions);
        }

        return normalized;
    }

    startPolling(store) {
        if (!this.options.enablePolling || !this.options.apiUrl) return;
        if (this.options.pollInterval > 0) {
            this.pollTimer = setInterval(() => {
                this.checkForNewNotifications(store);
            }, this.options.pollInterval);
        }
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    async checkForNewNotifications(store) {
        if (!this.lastCheckTime) return;

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
                const existingIds = new Set(store.items.map(n => n.id));
                const newNotifications = result.data
                    .map(n => this.normalizeNotification(n))
                    .filter(notif => {
                        const notifTime = new Date(notif.created_at);
                        if (notifTime <= this.lastCheckTime) {
                            return false;
                        }
                        if (existingIds.has(notif.id)) {
                            return false;
                        }
                        return true;
                    });

                newNotifications.forEach(notif => {
                    notif._isNew = true;
                    store.addNotification(notif);
                });
            }
        } catch (error) {
            console.error('Failed to check for new notifications:', error);
        }
    }

    getCsrfToken() {
        let meta = document.querySelector('meta[name="csrfToken"]');
        if (!meta) {
            meta = document.querySelector('meta[name="csrf-token"]');
        }
        return meta ? meta.getAttribute('content') : '';
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();

        if (isNaN(date.getTime())) {
            return dateString;
        }

        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 0) return 'just now';
        if (seconds < 60) return 'just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return `${weeks}w ago`;
        }

        return date.toLocaleDateString();
    }

    normalizeActions(actions) {
        if (!Array.isArray(actions)) {
            return [];
        }

        return actions.map(action => {
            if (!action || typeof action !== 'object') {
                return null;
            }

            const normalized = {
                name: action.name || null,
                label: action.label || action.name || 'Action',
                url: action.url || null,
                icon: action.icon || null,
                color: action.color || action.type || null,
                type: action.type || action.color || null,
                isDisabled: action.isDisabled === true || action.disabled === true,
                openInNewTab: action.openInNewTab === true || action.target === '_blank',
                event: action.event || null,
                eventData: action.eventData || {},
                shouldClose: action.shouldClose === true
            };

            if (!normalized.color && normalized.type) {
                normalized.color = normalized.type;
            }

            return normalized;
        }).filter(action => action !== null);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getNotificationIcon(notification) {
        if (notification.data?.icon_class) {
            return `<span class="${this.escapeHtml(notification.data.icon_class)}"></span>`;
        }
        if (notification.data?.icon) {
            const iconMap = {
                'bell': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
                'post': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
                'user': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                'message': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
                'alert': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                'check': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                'info': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            };
            return iconMap[notification.data.icon] || iconMap['bell'];
        }
        return null;
    }

    getNotificationTitle(notification) {
        if (notification.data && notification.data.title) {
            return notification.data.title;
        }
        if (notification.title) {
            return notification.title;
        }
        const parts = (notification.type || '').split('\\');
        const className = parts[parts.length - 1];
        return className.replace(/([A-Z])/g, ' $1').trim();
    }

    getNotificationMessage(notification) {
        if (notification.data && notification.data.message) {
            return notification.data.message;
        }
        if (notification.message) {
            return notification.message;
        }
        if (notification.data && notification.data.title) {
            return notification.data.title;
        }
        return 'You have a new notification';
    }

    destroy() {
        this.stopPolling();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager };
} else {
    window.NotificationManager = NotificationManager;
}
