/**
 * CakePHP Notification - Fluent API Builder
 *
 * Provides a clean, chainable API for building notification objects.
 * Inspired by Filament Notifications.
 *
 * @example
 * CakeNotification.make()
 *     .title('Post saved')
 *     .message('Your post has been saved successfully')
 *     .success()
 *     .actionUrl('/posts/view/123')
 *     .send();
 */
class CakeNotification {
    constructor(id = null) {
        this._data = {
            id: id || this.generateId(),
            title: null,
            message: null,
            type: null,
            icon: null,
            icon_class: null,
            action_url: null,
            actions: [],
            created_at: new Date().toISOString(),
            read_at: null,
            data: {},
            _source: 'js'
        };
    }

    static make(id = null) {
        return new CakeNotification(id);
    }

    id(id) {
        this._data.id = id;
        return this;
    }

    title(title) {
        this._data.title = title;
        return this;
    }

    message(message) {
        this._data.message = message;
        return this;
    }

    body(body) {
        return this.message(body);
    }

    type(type) {
        this._data.type = type;
        return this;
    }

    icon(icon) {
        this._data.data.icon = icon;
        return this;
    }

    iconClass(iconClass) {
        this._data.data.icon_class = iconClass;
        return this;
    }

    actionUrl(url) {
        this._data.data.action_url = url;
        return this;
    }

    actions(actions) {
        this._data.actions = actions;
        return this;
    }

    data(key, value = undefined) {
        if (typeof key === 'object') {
            this._data.data = { ...this._data.data, ...key };
        } else if (value !== undefined) {
            this._data.data[key] = value;
        }
        return this;
    }

    success() {
        return this.type('success').icon('check');
    }

    warning() {
        return this.type('warning').icon('alert');
    }

    danger() {
        return this.type('danger').icon('alert');
    }

    error() {
        return this.danger();
    }

    info() {
        return this.type('info').icon('info');
    }

    send() {
        if (typeof Alpine !== 'undefined' && Alpine.store('notifications')) {
            const store = Alpine.store('notifications');
            store.addNotification(this.toObject());
            return this;
        }
        if (typeof window.CakeNotificationManager !== 'undefined' &&
            typeof window.CakeNotificationManager.addNotification === 'function') {
            return window.CakeNotificationManager.addNotification(this.toObject());
        } else {
            console.warn('Notification system not initialized');
            return this;
        }
    }

    toObject() {
        const data = JSON.parse(JSON.stringify(this._data));
        if (data.actions && Array.isArray(data.actions)) {
            data.actions = data.actions.map(action => {
                if (action && typeof action.toObject === 'function') {
                    return action.toObject();
                }
                return action;
            });
        }
        return data;
    }

    static fromObject(obj) {
        const notification = new CakeNotification(obj.id);
        notification._data = { ...obj };
        return notification;
    }

    generateId() {
        return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Notification: CakeNotification };
} else {
    window.CakeNotification = CakeNotification;
}
