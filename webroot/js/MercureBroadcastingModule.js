/**
 * Mercure Broadcasting Notification Module for Crustum Notifications
 *
 * Extends the modular notification system with real-time Mercure SSE capabilities
 */
class MercureBroadcastingModule {
    constructor(options) {
        this.options = {
            userId: null,
            userName: 'Anonymous',
            mercureUrl: '/.well-known/mercure',
            authEndpoint: '/broadcasting/auth',
            channelName: null,
            ...options
        };

        this.echo = null;
        this.connected = false;
        this.manager = null;
    }

    init(manager = null) {
        if (typeof Echo === 'undefined') {
            console.warn('Mercure Broadcasting Module: Laravel Echo not loaded');
            return;
        }

        if (typeof MercureConnector === 'undefined') {
            console.warn('Mercure Broadcasting Module: MercureConnector not loaded');
            return;
        }

        if (manager) {
            this.manager = manager;
        } else {
            try {
                this.manager = window.CakeNotificationManager.get();
            } catch (e) {
                console.error('Mercure Broadcasting Module: Notification manager not initialized');
                return;
            }
        }

        this.initializeEcho();
    }

    initializeEcho() {
        this.echo = new Echo({
            broadcaster: MercureConnector,
            mercure: {
                url: this.options.mercureUrl
            },
            authEndpoint: this.options.authEndpoint
        });

        window.Echo = this.echo;

        this.echo.connector.on('connected', () => {
            this.connected = true;
        });

        this.echo.connector.on('disconnected', () => {
            this.connected = false;
        });

        this.echo.connector.on('error', (error) => {
            console.warn('Mercure Broadcasting Module: Connection error', error);
        });

        this.subscribeToChannel();
    }

    subscribeToChannel() {
        if (!this.options.channelName) {
            console.warn('Mercure Broadcasting Module: No channel name provided');
            return;
        }

        const channel = this.echo.private(this.options.channelName);

        channel.listen('*', (eventName, data) => {
            this.handleBroadcastEvent(eventName, data);
        });
    }

    handleBroadcastEvent(eventName, data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn('Mercure Broadcasting Module: Could not parse event data', data);
                return;
            }
        }

        if (eventName === 'notification.marked-read') {
            this.handleMarkAsReadUpdate(data);
            return;
        }

        if (eventName === 'notification.marked-all-read') {
            this.handleMarkAllAsReadUpdate(data);
            return;
        }

        const notification = {
            id: data.id || this.generateId(),
            title: data.title || data.data?.title || eventName.replace(/\./g, ' '),
            message: data.message || data.data?.message || data.body || data.data?.body || '',
            type: data.type || eventName,
            data: data.data || data,
            created_at: data.created_at || data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
            _source: 'broadcast'
        };

        if (data.icon || data.data?.icon) {
            notification.data.icon = data.icon || data.data.icon;
        }
        if (data.icon_class || data.iconClass || data.data?.icon_class || data.data?.iconClass) {
            notification.data.icon_class = data.icon_class || data.iconClass || data.data?.icon_class || data.data?.iconClass;
        }
        if (data.action_url || data.actionUrl || data.data?.action_url || data.data?.actionUrl) {
            notification.data.action_url = data.action_url || data.actionUrl || data.data?.action_url || data.data?.actionUrl;
        }
        if (data.actions || data.data?.actions) {
            notification.actions = data.actions || data.data.actions;
        }

        this.manager.addNotification(notification);
    }

    handleMarkAsReadUpdate(data) {
        if (!this.manager) {
            return;
        }

        const notificationId = data.notification_id;
        this.manager.removeNotification(notificationId);
        this.manager.unreadCount = data.unread_count || Math.max(0, this.manager.unreadCount - 1);
        this.manager.emit('notification:marked-read', { notificationId });
    }

    handleMarkAllAsReadUpdate(data) {
        if (!this.manager) {
            return;
        }

        this.manager.notifications = [];
        this.manager.unreadCount = data.unread_count || 0;
        this.manager.emit('notifications:changed', { notifications: [] });
        this.manager.emit('notifications:all-marked-read');
    }

    generateId() {
        return `mercure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy() {
        if (this.echo) {
            this.echo.disconnect();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const broadcastConfig = window.broadcastingConfig;
    if (!broadcastConfig) return;

    if (broadcastConfig.broadcaster !== 'mercure') {
        return;
    }

    const initBroadcasting = () => {
        try {
            const manager = window.CakeNotificationManager.get();
            const module = new MercureBroadcastingModule(broadcastConfig);
            module.init(manager);
        } catch (e) {
            console.error('Mercure Broadcasting Module: Initialization failed, retrying...', e.message);
            setTimeout(initBroadcasting, 100);
        }
    };

    setTimeout(initBroadcasting, 100);
});

