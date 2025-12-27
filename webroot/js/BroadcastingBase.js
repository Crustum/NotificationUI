/**
 * Broadcasting Base Class
 *
 * Shared logic for all broadcasting modules (Pusher, Mercure, etc.)
 * Eliminates code duplication between broadcasting implementations
 */
class BroadcastingBase {
    constructor(options) {
        this.options = {
            userId: null,
            userName: 'Anonymous',
            channelName: null,
            ...options
        };

        this.store = null;
        this.connected = false;
    }

    init(store) {
        this.store = store;
        this.initializeConnection();
        this.subscribeToChannel();
    }

    initializeConnection() {
        throw new Error('initializeConnection() must be implemented by subclass');
    }

    subscribeToChannel() {
        throw new Error('subscribeToChannel() must be implemented by subclass');
    }

    handleBroadcastEvent(eventName, data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn('Broadcasting Base: Could not parse event data', data);
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

        const notification = this.normalizeNotification(eventName, data);
        if (this.store) {
            this.store.addNotification(notification);
        }
    }

    normalizeNotification(eventName, data) {
        const notification = {
            id: data.id || this.generateId(),
            title: data.title || data.data?.title || eventName.replace(/\./g, ' '),
            message: data.message || data.data?.message || data.body || data.data?.body || '',
            type: data.type || eventName,
            data: data.data || data,
            created_at: data.created_at || (data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString()),
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

        return notification;
    }

    handleMarkAsReadUpdate(data) {
        if (!this.store) {
            return;
        }

        const notificationId = data.notification_id;
        this.store.removeNotification(notificationId);

        if (typeof data.unread_count === 'number') {
            this.store.unreadCount = data.unread_count;
        }
    }

    handleMarkAllAsReadUpdate(data) {
        if (!this.store) {
            return;
        }

        this.store.items = [];
        this.store.unreadCount = data.unread_count || 0;
    }

    generateId() {
        return `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy() {
        this.store = null;
        this.connected = false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BroadcastingBase };
} else {
    window.BroadcastingBase = BroadcastingBase;
}
