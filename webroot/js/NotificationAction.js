/**
 * CakePHP Notification Action - Action Builder
 *
 * Provides a fluent API for building notification action buttons.
 *
 * @example
 * CakeNotificationAction.make('delete')
 *     .label('Delete Post')
 *     .danger()
 *     .dispatch('post:delete', { id: 123 })
 *     .close();
 */
class CakeNotificationAction {
    constructor(name) {
        this._data = {
            name: name,
            label: name,
            color: null,
            icon: null,
            url: null,
            openInNewTab: false,
            event: null,
            eventData: null,
            shouldClose: false,
            isDisabled: false
        };
    }

    static make(name) {
        return new CakeNotificationAction(name);
    }

    name(name) {
        this._data.name = name;
        return this;
    }

    label(label) {
        this._data.label = label;
        return this;
    }

    color(color) {
        this._data.color = color;
        return this;
    }

    icon(icon) {
        this._data.icon = icon;
        return this;
    }

    url(url, openInNewTab = false) {
        this._data.url = url;
        this._data.openInNewTab = openInNewTab;
        return this;
    }

    openUrlInNewTab(condition = true) {
        this._data.openInNewTab = condition;
        return this;
    }

    dispatch(event, data = null) {
        this._data.event = event;
        this._data.eventData = data;
        return this;
    }

    close(condition = true) {
        this._data.shouldClose = condition;
        return this;
    }

    disabled(condition = true) {
        this._data.isDisabled = condition;
        return this;
    }

    button() {
        return this.color('primary');
    }

    link() {
        return this;
    }

    danger() {
        return this.color('danger');
    }

    success() {
        return this.color('success');
    }

    warning() {
        return this.color('warning');
    }

    info() {
        return this.color('info');
    }

    toObject() {
        return JSON.parse(JSON.stringify(this._data));
    }

    static fromObject(obj) {
        const action = new CakeNotificationAction(obj.name);
        action._data = { ...obj };
        return action;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationAction: CakeNotificationAction };
} else {
    window.CakeNotificationAction = CakeNotificationAction;
}

