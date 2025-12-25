/**
 * CakePHP Notification Renderer
 *
 * Pure rendering logic with template overloading support.
 * Converts notification objects to HTML without side effects.
 */
class CakeNotificationRenderer {
    constructor(options = {}) {
        this.options = {
            markReadOnClick: true,
            ...options
        };

        this.templates = {
            notification: null,
            notificationContent: null,
            notificationIcon: null,
            notificationActions: null,
            notificationAction: null,
            loadMoreButton: null,
            emptyState: null,
            errorState: null,
            loadingState: null
        };
    }

    registerTemplate(name, templateFn) {
        if (this.templates.hasOwnProperty(name)) {
            this.templates[name] = templateFn;
        } else {
            console.warn(`Unknown template: ${name}`);
        }
        return this;
    }

    registerTemplates(templates) {
        Object.keys(templates).forEach(name => {
            this.registerTemplate(name, templates[name]);
        });
        return this;
    }

    getTemplate(name, defaultFn) {
        return this.templates[name] || defaultFn;
    }

    renderNotifications(notifications, hasMore = false) {
        if (!Array.isArray(notifications) || notifications.length === 0) {
            const emptyTemplate = this.getTemplate('emptyState', this.defaultEmptyState.bind(this));
            return emptyTemplate();
        }

        const html = notifications.map(n => this.renderNotification(n)).join('');
        const footer = hasMore ? this.renderLoadMoreButton() : '';

        return html + footer;
    }

    renderNotification(notification) {
        const notificationTemplate = this.getTemplate('notification', this.defaultNotificationTemplate.bind(this));
        return notificationTemplate(notification, this);
    }

    renderNotificationContent(notification) {
        const contentTemplate = this.getTemplate('notificationContent', this.defaultNotificationContent.bind(this));
        return contentTemplate(notification, this);
    }

    renderNotificationIcon(notification) {
        const iconTemplate = this.getTemplate('notificationIcon', this.defaultNotificationIcon.bind(this));
        return iconTemplate(notification, this);
    }

    renderActions(actions) {
        const actionsTemplate = this.getTemplate('notificationActions', this.defaultActionsTemplate.bind(this));
        return actionsTemplate(actions, this);
    }

    renderAction(action) {
        const actionTemplate = this.getTemplate('notificationAction', this.defaultActionTemplate.bind(this));
        return actionTemplate(action, this);
    }

    renderLoadMoreButton() {
        const loadMoreTemplate = this.getTemplate('loadMoreButton', this.defaultLoadMoreButton.bind(this));
        return loadMoreTemplate();
    }

    defaultNotificationTemplate(notification, renderer) {
        const isUnread = !notification.read_at;
        const isNew = notification._isNew || false;
        const actionUrl = notification.data?.action_url || null;
        const actions = notification.actions || [];

        const wrapperTag = actionUrl ? 'a' : 'div';
        const wrapperAttrs = actionUrl ? `href="${renderer.escapeHtml(actionUrl)}"` : '';

        return `
            <div class="notification-item ${isUnread ? 'notification-unread' : ''} ${isNew ? 'notification-new' : ''}"
                 data-notification-id="${renderer.escapeHtml(notification.id)}"
                 ${renderer.options.markReadOnClick && isUnread ? 'data-mark-on-click="true"' : ''}>
                <${wrapperTag} class="notification-content" ${wrapperAttrs}>
                    ${renderer.renderNotificationContent(notification)}
                </${wrapperTag}>
                ${isUnread ? renderer.renderMarkAsReadButton(notification) : ''}
                ${actions.length > 0 ? `<div class="notification-item-footer">${renderer.renderActions(actions)}</div>` : ''}
            </div>
        `;
    }

    defaultNotificationContent(notification, renderer) {
        const icon = renderer.renderNotificationIcon(notification);
        const timeAgo = renderer.formatTimeAgo(notification.created_at || notification.created);
        const message = renderer.getNotificationMessage(notification);
        const title = renderer.getNotificationTitle(notification);

        return `
            ${icon ? `<div class="notification-icon">${icon}</div>` : ''}
            <div class="notification-text">
                <div class="notification-title">${renderer.escapeHtml(title)}</div>
                <div class="notification-message">${renderer.escapeHtml(message)}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
        `;
    }

    defaultNotificationIcon(notification, renderer) {
        return renderer.getNotificationIcon(notification);
    }

    defaultActionsTemplate(actions, renderer) {
        const actionsHtml = actions.map(action => renderer.renderAction(action)).join('');
        return `<div class="notification-actions">${actionsHtml}</div>`;
    }

    defaultActionTemplate(action, renderer) {
        const colorClass = action.color ? `btn-${action.color}` : (action.type ? `btn-${action.type}` : '');
        const disabled = action.isDisabled ? 'disabled' : '';
        const actionName = action.name || action.url || 'action';
        const actionUrl = action.url || null;

        return `
            <button class="notification-action ${colorClass}"
                    data-action="${actionUrl ? 'link' : 'custom'}"
                    data-action-name="${renderer.escapeHtml(actionName)}"
                    ${actionUrl ? `data-url="${renderer.escapeHtml(actionUrl)}"` : ''}
                    ${disabled}>
                ${action.icon ? `<span class="${action.icon}"></span>` : ''}
                ${renderer.escapeHtml(action.label)}
            </button>
        `;
    }

    defaultLoadMoreButton() {
        return `
            <div class="notifications-load-more">
                <button class="load-more-btn" data-action="loadMore">
                    Load more
                </button>
            </div>
        `;
    }

    defaultEmptyState() {
        return '<div class="notifications-empty">No new notifications</div>';
    }

    defaultErrorState(error) {
        return `<div class="notifications-error">${this.escapeHtml(error.message || 'An error occurred')}</div>`;
    }

    defaultLoadingState() {
        return '<div class="notifications-loading">Loading...</div>';
    }

    renderMarkAsReadButton(notification) {
        return `
            <button class="notification-action-btn mark-read-btn"
                    data-action="markRead"
                    data-id="${this.escapeHtml(notification.id)}"
                    title="Mark as read">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </button>
        `;
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationRenderer: CakeNotificationRenderer };
} else {
    window.CakeNotificationRenderer = CakeNotificationRenderer;
}

