/**
 * Broadcasting Notification Module for CakeNotifications
 *
 * Extends the modular notification system with real-time WebSocket capabilities
 */
class BroadcastNotificationsModule {
    constructor(options) {
        this.options = {
            userId: null,
            userName: 'Anonymous',
            pusherKey: 'app-key',
            pusherHost: '127.0.0.1',
            pusherPort: 8080,
            pusherCluster: 'mt1',
            channelName: null,
            ...options
        };

        this.echo = null;
        this.connected = false;
        this.manager = null;
    }

    init(manager = null) {
        if (typeof Echo === 'undefined') {
            console.warn('Broadcasting Module: Laravel Echo not loaded');
            return;
        }

        if (typeof Pusher === 'undefined') {
            console.warn('Broadcasting Module: Pusher not loaded');
            return;
        }

        if (manager) {
            this.manager = manager;
        } else {
            try {
                this.manager = window.CakeNotificationManager.get();
            } catch (e) {
                console.error('Broadcasting Module: Notification manager not initialized');
                return;
            }
        }

        this.initializeEcho();
    }

    initializeEcho() {
        window.Pusher = Pusher;

        this.echo = new Echo({
            broadcaster: 'pusher',
            key: this.options.pusherKey,
            cluster: this.options.pusherCluster,
            wsHost: this.options.pusherHost,
            wsPort: this.options.pusherPort,
            wssPort: this.options.pusherPort,
            wsPath: '',
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
            forceTLS: false,
        });

        window.Echo = this.echo;

        if (this.echo.connector && this.echo.connector.pusher) {
            this.echo.connector.pusher.connection.bind('connected', () => {
                this.connected = true;
                this.subscribeToChannel();
            });

            this.echo.connector.pusher.connection.bind('disconnected', () => {
                this.connected = false;
            });

            this.echo.connector.pusher.connection.bind('error', (error) => {
                console.warn('Broadcasting Module: Connection error', error);
            });
        }
    }

    subscribeToChannel() {
        if (!this.options.channelName) {
            console.warn('Broadcasting Module: No channel name provided');
            return;
        }

        const channel = this.echo.private(this.options.channelName);

        channel.subscription.bind('pusher:subscription_succeeded', () => {
        });

        channel.subscription.bind('pusher:subscription_error', (error) => {
            console.error('Broadcasting Module: Subscription error', error);
        });

        this.echo.connector.pusher.bind_global((eventName, data) => {
            if (eventName.startsWith('pusher:')) return;

            this.handleBroadcastEvent(eventName, data);
        });
    }

    handleBroadcastEvent(eventName, data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn('Broadcasting Module: Could not parse event data', data);
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
            title: data.title || eventName.replace(/\./g, ' '),
            message: data.message || data.body || '',
            type: data.type,
            data: data.data || data,
            created_at: data.created_at || data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString(),
            _source: 'broadcast'
        };

        if (data.icon) {
            notification.data.icon = data.icon;
        }
        if (data.icon_class || data.iconClass) {
            notification.data.icon_class = data.icon_class || data.iconClass;
        }
        if (data.action_url || data.actionUrl) {
            notification.data.action_url = data.action_url || data.actionUrl;
        }
        if (data.actions) {
            notification.actions = data.actions;
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
        return `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy() {
        if (this.echo) {
            this.echo.disconnect();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Broadcasting Module: Initialization ...');
    const broadcastConfig = window.broadcastingConfig;
    if (!broadcastConfig) return;

    console.log('Broadcasting Module: Initialization ...');
    if (broadcastConfig.broadcaster === 'mercure') {
        return;
    }
    console.log('Broadcasting Module: Initialization ...');
    console.log(broadcastConfig);

    const initBroadcasting = () => {
        try {
            const manager = window.CakeNotificationManager.get();
            const module = new BroadcastNotificationsModule(broadcastConfig);
            module.init(manager);
            console.log('Broadcasting Module: Initialization ...');
        } catch (e) {
            console.error('Broadcasting Module: Initialization failed, retrying...', e.message);
            setTimeout(initBroadcasting, 100);
        }
    };

    setTimeout(initBroadcasting, 100);
});

