/**
 * Notification Store - Alpine.js Store & Components
 *
 * Global state management and UI components for notifications
 */
(function() {
    'use strict';

    if (typeof window.NotificationManager === 'undefined') {
        console.error('NotificationManager is required for NotificationStore');
        return;
    }

    const manager = new window.NotificationManager();
    let registered = false;

    function registerComponents() {
        if (typeof Alpine === 'undefined' || typeof Alpine.store === 'undefined' || typeof Alpine.data === 'undefined') {
            return false;
        }

        if (Alpine.store('notifications')) {
            return true;
        }

    Alpine.store('notifications', {
        items: [],
        unreadCount: 0,
        isLoading: false,
        currentPage: 1,
        hasMore: false,
        isOpen: false,
        manager: manager,

        init() {
            if (manager.options.enablePolling && manager.options.apiUrl) {
                this.loadNotifications();
                manager.startPolling(this);
            }
        },

        addNotification(notification) {
            const exists = this.items.find(n => n.id === notification.id);
            if (!exists) {
                notification._isNew = true;
                this.items.unshift(notification);

                if (!notification.read_at) {
                    this.unreadCount++;
                }

                setTimeout(() => {
                    notification._isNew = false;
                }, 5000);
            }
        },

        removeNotification(id) {
            const index = this.items.findIndex(n => n.id === id);
            if (index !== -1) {
                const notification = this.items[index];
                if (!notification.read_at) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.items.splice(index, 1);
            }
        },

        async markAsRead(id) {
            const notification = this.items.find(n => n.id === id);
            if (!notification || notification.read_at) return;

            const isLocalNotification = typeof id === 'string' && id.startsWith('notif-');

            if (isLocalNotification) {
                notification.read_at = new Date().toISOString();
                const index = this.items.findIndex(n => n.id === id);
                if (index !== -1) {
                    this.items.splice(index, 1);
                }
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                return;
            }

            try {
                const success = await manager.markAsRead(id);
                if (success) {
                    const index = this.items.findIndex(n => n.id === id);
                    if (index !== -1) {
                        this.items.splice(index, 1);
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                }
            } catch (error) {
                console.warn('Failed to mark notification as read via API, hiding locally:', error);
                notification.read_at = new Date().toISOString();
                const index = this.items.findIndex(n => n.id === id);
                if (index !== -1) {
                    this.items.splice(index, 1);
                }
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
        },

        async markAllAsRead() {
            const unreadIds = this.items
                .filter(n => !n.read_at)
                .map(n => n.id);

            if (unreadIds.length === 0) return;

            const success = await manager.markAllAsRead();
            if (success) {
                this.items = this.items.filter(n => n.read_at);
                this.unreadCount = 0;
            }
        },

        async loadNotifications(page = 1, append = false) {
            if (this.isLoading || !manager.options.apiUrl) return;

            this.isLoading = true;

            try {
                const result = await manager.loadNotifications(page, append);

                if (result.success) {
                    if (append) {
                        this.items.push(...result.data);
                    } else {
                        this.items = result.data;
                    }

                    this.currentPage = page;
                    this.hasMore = result.hasMore || false;
                    if (result.unreadCount !== undefined) {
                        this.unreadCount = result.unreadCount;
                    }
                }
            } finally {
                this.isLoading = false;
            }
        },

        async loadMore() {
            if (this.hasMore && !this.isLoading) {
                await this.loadNotifications(this.currentPage + 1, true);
            }
        },

        setOpen(state) {
            this.isOpen = state;
        },

        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen && this.items.length === 0) {
                this.loadNotifications();
            }
        }
    });

    function detectTheme(element) {
        if (element && element.closest('[data-theme]')) {
            const themeAttr = element.closest('[data-theme]').getAttribute('data-theme');
            if (themeAttr === 'dark' || themeAttr === 'light') {
                return themeAttr;
            }
        }

        if (document.documentElement.hasAttribute('data-theme')) {
            const docTheme = document.documentElement.getAttribute('data-theme');
            if (docTheme === 'dark' || docTheme === 'light') {
                return docTheme;
            }
        }

        if (document.documentElement.classList.contains('dark')) {
            return 'dark';
        }

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    Alpine.data('notificationBell', (config) => ({
        init() {
            const wrapper = this.$el;
            const detectedTheme = detectTheme(wrapper);
            const explicitTheme = config?.theme;

            this.config = {
                position: config?.position || 'right',
                theme: explicitTheme || detectedTheme,
                mode: config?.mode || 'dropdown',
                markReadOnClick: config?.markReadOnClick !== false,
                ...config
            };

            wrapper.setAttribute('data-theme', this.config.theme);

            if (!explicitTheme && window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleThemeChange = (e) => {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.config.theme = newTheme;
                    wrapper.setAttribute('data-theme', newTheme);
                };
                mediaQuery.addEventListener('change', handleThemeChange);
            }
        },

        get store() {
            return Alpine.store('notifications');
        },

        get unreadCount() {
            return this.store.unreadCount;
        },

        get isOpen() {
            return this.store.isOpen;
        },

        toggle() {
            this.store.toggle();
        },

        handleClickOutside(event) {
            const bell = document.getElementById(this.config.bellId || 'notificationsBell');
            const dropdown = document.getElementById(this.config.dropdownId || 'notificationsDropdown');
            if (bell && dropdown && !bell.contains(event.target) && !dropdown.contains(event.target)) {
                this.store.setOpen(false);
            }
        }
    }));

    Alpine.data('notificationList', () => ({
        get store() {
            return Alpine.store('notifications');
        },

        get items() {
            return this.store.items;
        },

        get isLoading() {
            return this.store.isLoading;
        },

        get hasMore() {
            return this.store.hasMore;
        },

        getNotificationData(notification) {
            const manager = this.store.manager;
            let actions = notification.actions || [];
            if (Array.isArray(actions)) {
                actions = actions.map(action => {
                    if (action && typeof action.toObject === 'function') {
                        return action.toObject();
                    }
                    return action;
                }).filter(action => action && (action.name || action.label));
            }
            return {
                notification: notification,
                icon: manager.getNotificationIcon(notification),
                title: manager.getNotificationTitle(notification),
                message: manager.getNotificationMessage(notification),
                timeAgo: manager.formatTimeAgo(notification.created_at),
                actions: actions
            };
        },

        async loadMore() {
            await this.store.loadMore();
        },

        async markAllAsRead() {
            await this.store.markAllAsRead();
        }
    }));

    Alpine.data('notificationItem', (data) => ({
        notification: data.notification,
        icon: data.icon,
        title: data.title,
        message: data.message,
        timeAgo: data.timeAgo,
        get actions() {
            const actions = data.actions || [];
            if (!Array.isArray(actions)) return [];
            return actions.map(action => {
                if (action && typeof action.toObject === 'function') {
                    return action.toObject();
                }
                return action;
            }).filter(action => action && (action.name || action.label));
        },

        get store() {
            return Alpine.store('notifications');
        },

        async markAsRead() {
            await this.store.markAsRead(this.notification.id);
        },

        async deleteNotification() {
            const success = await this.store.manager.deleteNotification(this.notification.id);
            if (success) {
                this.store.removeNotification(this.notification.id);
            }
        },

        handleAction(action, notification) {
            if (!action || action.isDisabled === true) {
                return;
            }

            if (action.url) {
                if (action.openInNewTab === true) {
                    window.open(action.url, '_blank');
                } else {
                    window.location.href = action.url;
                }
            } else if (action.event) {
                const event = new CustomEvent(action.event, {
                    detail: {
                        notificationId: notification.id,
                        actionName: action.name,
                        ...(action.eventData || {})
                    },
                    bubbles: true,
                    cancelable: true
                });
                this.$el.dispatchEvent(event);
            }

            if (action.shouldClose === true) {
                this.store.setOpen(false);
            }
        }
    }));

        return true;
    }

    function initStore() {
        const store = Alpine.store('notifications');
        if (store) {
            store.init();
        }
    }

    document.addEventListener('alpine:init', () => {
        if (!registered && registerComponents()) {
            registered = true;
            initStore();
        }
    });

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
