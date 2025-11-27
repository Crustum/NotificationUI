/**
 * CakePHP Notification Widget
 *
 * Handles UI interactions for the notification bell and dropdown.
 * Integrates manager and renderer to provide complete notification UI.
 */
class CakeNotificationWidget {
    constructor(manager, renderer, options = {}) {
        this.manager = manager;
        this.renderer = renderer;
        this.options = {
            bellId: 'notificationsBell',
            dropdownId: 'notificationsDropdown',
            contentId: 'notificationsContent',
            badgeId: 'notificationsBadge',
            ...options
        };

        this.bell = document.getElementById(this.options.bellId);
        this.dropdown = document.getElementById(this.options.dropdownId);
        this.content = document.getElementById(this.options.contentId);
        this.badge = document.getElementById(this.options.badgeId);
        this.wrapper = this.bell ? this.bell.closest('.notifications-wrapper') : null;

        this.isOpen = false;
        this.currentPage = 1;
        this.hasMore = false;
        this.timestampUpdateTimer = null;

        this.init();
    }

    init() {
        if (!this.bell || !this.dropdown || !this.content) {
            console.error('Notifications: Required elements not found');
            return;
        }

        this.setupEventListeners();
        this.subscribeToManager();
    }

    setupEventListeners() {
        this.bell.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (this.isPanelMode()) {
                if (e.target.id === 'notificationsBackdrop') {
                    this.close();
                }
            } else {
                if (!this.bell.contains(e.target) && !this.dropdown.contains(e.target)) {
                    this.close();
                }
            }
        });

        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this.adjustDropdownPosition();
            }
        });

        window.addEventListener('scroll', () => {
            if (this.isOpen) {
                this.adjustDropdownPosition();
            }
        });

        document.addEventListener('click', async (e) => {
            await this.handleActionClick(e);
        });
    }

    subscribeToManager() {
        this.manager.on('notifications:changed', ({ notifications, pagination }) => {
            this.hasMore = pagination?.has_next_page || false;
            this.render(notifications);
        });

        this.manager.on('notifications:loading', () => {
            if (this.currentPage === 1) {
                this.content.innerHTML = this.renderer.defaultLoadingState();
            }
        });

        this.manager.on('notifications:error', ({ error }) => {
            this.content.innerHTML = this.renderer.defaultErrorState(error);
        });

        this.manager.on('notifications:changed', () => {
            this.updateBadge(this.manager.getUnreadCount());
        });
    }

    async handleActionClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const notificationId = target.dataset.id;
        const actionName = target.dataset.actionName;

        if (action === 'markRead' && notificationId) {
            e.preventDefault();
            await this.manager.markAsRead(notificationId);
        } else if (action === 'loadMore') {
            e.preventDefault();
            await this.loadMore();
        } else if (action === 'markAllRead') {
            e.preventDefault();
            if (confirm('Mark all notifications as read?')) {
                await this.manager.markAllAsRead();
            }
        } else if (action === 'custom' && actionName) {
            e.preventDefault();
            await this.handleCustomAction(target, notificationId, actionName);
        } else if (action === 'link' && actionName) {
            e.preventDefault();
            const url = target.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        }
    }

    async handleCustomAction(element, notificationId, actionName) {
        const notification = this.manager.getNotifications().find(n => n.id === notificationId);
        if (!notification) return;

        const actionData = notification.actions.find(a => a.name === actionName);
        if (!actionData) return;

        if (actionData.url) {
            if (actionData.openInNewTab) {
                window.open(actionData.url, '_blank');
            } else {
                window.location.href = actionData.url;
            }
        }

        if (actionData.event) {
            window.dispatchEvent(new CustomEvent(actionData.event, {
                detail: actionData.eventData
            }));
        }

        if (actionData.shouldClose) {
            this.manager.removeNotification(notificationId);
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.dropdown.style.display = 'flex';
        this.dropdown.classList.add('notifications-visible');
        this.bell.setAttribute('aria-expanded', 'true');
        this.isOpen = true;

        if (this.isPanelMode()) {
            this.dropdown.classList.add('notifications-open');
            this.showBackdrop();
        } else {
            this.adjustDropdownPosition();
        }

        this.startTimestampUpdates();
    }

    close() {
        this.dropdown.style.display = 'none';
        this.dropdown.classList.remove('notifications-visible');
        this.bell.setAttribute('aria-expanded', 'false');
        this.isOpen = false;

        if (this.isPanelMode()) {
            this.dropdown.classList.remove('notifications-open');
            this.hideBackdrop();
        }

        this.stopTimestampUpdates();
    }

    render(notifications) {
        const html = this.renderer.renderNotifications(notifications, this.hasMore);
        this.content.innerHTML = html;
    }

    updateBadge(count) {
        if (this.badge) {
            if (count > 0) {
                this.badge.textContent = count > 99 ? '99+' : count;
                this.badge.style.display = 'inline-block';
            } else {
                this.badge.style.display = 'none';
            }
        }
    }

    async loadMore() {
        const btn = document.querySelector('.load-more-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Loading...';
        }
        await this.manager.loadNotifications(this.currentPage + 1, true);
        this.currentPage++;
    }

    startTimestampUpdates() {
        this.stopTimestampUpdates();
        this.timestampUpdateTimer = setInterval(() => {
            this.updateTimestamps();
        }, 60000);
    }

    stopTimestampUpdates() {
        if (this.timestampUpdateTimer) {
            clearInterval(this.timestampUpdateTimer);
            this.timestampUpdateTimer = null;
        }
    }

    updateTimestamps() {
        const notifications = this.manager.getNotifications();
        const timeElements = this.content.querySelectorAll('.notification-time');
        timeElements.forEach((el, index) => {
            if (notifications[index]) {
                const dateString = notifications[index].created_at || notifications[index].created;
                el.textContent = this.renderer.formatTimeAgo(dateString);
            }
        });
    }

    adjustDropdownPosition() {
        if (!this.dropdown || !this.bell) return;

        const rect = this.bell.getBoundingClientRect();
        const dropdown = this.dropdown;
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        dropdown.style.left = '';
        dropdown.style.right = '';
        dropdown.style.top = '';
        dropdown.style.bottom = '';

        const dropdownWidth = 350;
        const rightEdge = rect.right + dropdownWidth;

        if (rightEdge > viewport.width) {
            dropdown.style.left = `${rect.left - dropdownWidth + rect.width}px`;
            dropdown.style.right = 'auto';
        } else {
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.right = 'auto';
        }

        const dropdownHeight = Math.min(400, viewport.height - 100);
        const bottomEdge = rect.bottom + dropdownHeight;

        if (bottomEdge > viewport.height) {
            dropdown.style.top = `${rect.top - dropdownHeight - 8}px`;
            dropdown.style.bottom = 'auto';
        } else {
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.bottom = 'auto';
        }

        const finalRect = dropdown.getBoundingClientRect();

        if (finalRect.left < 8) {
            dropdown.style.left = '8px';
        }

        if (finalRect.right > viewport.width - 8) {
            dropdown.style.right = '8px';
            dropdown.style.left = 'auto';
        }

        if (finalRect.top < 8) {
            dropdown.style.top = '8px';
        }

        if (finalRect.bottom > viewport.height - 8) {
            dropdown.style.bottom = '8px';
            dropdown.style.top = 'auto';
        }
    }

    isPanelMode() {
        const isPanel = this.wrapper && this.wrapper.classList.contains('notifications-mode-panel');
        console.log('Panel mode check:', isPanel, this.wrapper);
        return isPanel;
    }


    showBackdrop() {
        const backdrop = document.getElementById('notificationsBackdrop');
        if (backdrop) {
            if (backdrop.parentNode !== document.body) {
                this.originalBackdropParent = backdrop.parentNode;
                this.originalBackdropNextSibling = backdrop.nextSibling;
                document.body.appendChild(backdrop);
            }

            backdrop.style.display = 'block';
            backdrop.offsetHeight;
            backdrop.classList.add('notifications-backdrop-visible');
        }
    }

    hideBackdrop() {
        const backdrop = document.getElementById('notificationsBackdrop');
        if (backdrop) {
            backdrop.classList.remove('notifications-backdrop-visible');
            setTimeout(() => {
                if (!this.isOpen) {
                    backdrop.style.display = 'none';
                    this.moveBackdropBackToOriginal();
                }
            }, 300);
        }
    }

    moveBackdropBackToOriginal() {
        const backdrop = document.getElementById('notificationsBackdrop');
        if (backdrop && this.originalBackdropParent) {
            if (this.originalBackdropNextSibling) {
                this.originalBackdropParent.insertBefore(backdrop, this.originalBackdropNextSibling);
            } else {
                this.originalBackdropParent.appendChild(backdrop);
            }

            this.originalBackdropParent = null;
            this.originalBackdropNextSibling = null;
        }
    }

    destroy() {
        this.stopTimestampUpdates();
        this.close();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationWidget: CakeNotificationWidget };
} else {
    window.CakeNotificationWidget = CakeNotificationWidget;
}

