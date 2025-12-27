/**
 * CakePHP Notification System - Main Entry Point (Alpine.js)
 *
 * Initializes Alpine.js store and provides backward compatibility
 */
(function() {
    'use strict';

    window.initializeNotifications = function(options = {}) {
        const defaultOptions = {
            apiUrl: '/notification/notifications/unread.json',
            pollInterval: 30000,
            enablePolling: true,
            perPage: 10,
            bellId: 'notificationsBell',
            dropdownId: 'notificationsDropdown',
            contentId: 'notificationsContent',
            badgeId: 'notificationsBadge',
            markReadOnClick: true,
        };

        const config = { ...defaultOptions, ...options };

        function init() {
            if (typeof Alpine === 'undefined') {
                console.warn('NotificationUI: Alpine.js not yet available, waiting...');
                setTimeout(init, 50);
                return;
            }

            const store = Alpine.store('notifications');
            if (store && store.manager) {
                store.manager.options = { ...store.manager.options, ...config };
                if (config.initialUnreadCount !== undefined) {
                    store.unreadCount = config.initialUnreadCount;
                }
                if (config.enablePolling && config.apiUrl) {
                    store.manager.startPolling(store);
                }
            } else {
                console.warn('NotificationUI: Store not yet registered, waiting...');
                setTimeout(init, 50);
                return;
            }

            return {
                store: store,
                manager: store?.manager
            };
        }

        return init();
    };

    window.CakeNotificationManager = window.CakeNotificationManager || {};
    window.CakeNotificationManager.get = () => {
        if (typeof Alpine === 'undefined') {
            throw new Error('Alpine.js is not loaded. Ensure Alpine.js is loaded before accessing the notification manager.');
        }
        const store = Alpine.store('notifications');
        if (!store) {
            throw new Error('Notification store not initialized. Ensure Alpine.js is loaded and components are registered.');
        }
        return store.manager || null;
    };

    window.getNotificationManager = () => window.CakeNotificationManager.get();

    window.registerNotificationModule = (module) => {
        console.warn('registerNotificationModule is deprecated. Broadcasting modules now auto-initialize.');
        return null;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initializeNotifications: window.initializeNotifications,
            CakeNotification: window.CakeNotification,
            CakeNotificationAction: window.CakeNotificationAction,
        };
    }
})();
