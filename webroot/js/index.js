/**
 * CakePHP Notification System - Main Entry Point
 *
 * Provides a unified API for notifications with pluggable modules.
 * Compatible with both old and new integration patterns.
 */

let managerInstance = null;
let widgetInstance = null;
let rendererInstance = null;

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

    rendererInstance = new window.CakeNotificationRenderer({
        markReadOnClick: config.markReadOnClick
    });

    managerInstance = new window.CakeNotificationManager({
        apiUrl: config.apiUrl,
        pollInterval: config.pollInterval,
        enablePolling: config.enablePolling,
        perPage: config.perPage
    });

    widgetInstance = new window.CakeNotificationWidget(
        managerInstance,
        rendererInstance,
        {
            bellId: config.bellId,
            dropdownId: config.dropdownId,
            contentId: config.contentId,
            badgeId: config.badgeId
        }
    );

    managerInstance.init();

    window.CakeNotificationManager.instance = managerInstance;
    window.CakeNotificationManager.get = () => {
        if (!managerInstance) {
            throw new Error('Notification manager not initialized. Call initializeNotifications() first.');
        }
        return managerInstance;
    };

    window.CakeNotificationWidget.instance = widgetInstance;
    window.CakeNotificationWidget.get = () => {
        if (!widgetInstance) {
            throw new Error('Notification widget not initialized. Call initializeNotifications() first.');
        }
        return widgetInstance;
    };

    window.CakeNotificationRenderer.instance = rendererInstance;
    window.CakeNotificationRenderer.get = () => {
        if (!rendererInstance) {
            throw new Error('Notification renderer not initialized. Call initializeNotifications() first.');
        }
        return rendererInstance;
    };

    return {
        manager: managerInstance,
        widget: widgetInstance,
        renderer: rendererInstance
    };
};

window.CakeNotificationManager = window.CakeNotificationManager || {};
window.CakeNotificationManager.get = () => {
    if (!managerInstance) {
        throw new Error('Notification manager not initialized. Call initializeNotifications() first.');
    }
    return managerInstance;
};

window.getNotificationManager = () => window.CakeNotificationManager.get();
window.getNotificationWidget = () => window.CakeNotificationWidget.get();
window.getNotificationRenderer = () => window.CakeNotificationRenderer.get();

window.registerNotificationModule = (module) => {
    const manager = window.CakeNotificationManager.get();
    return manager.registerModule(module);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNotifications: window.initializeNotifications,
        CakeNotification: window.CakeNotification,
        CakeNotificationAction: window.CakeNotificationAction,
        CakeNotificationManager: window.CakeNotificationManager,
        CakeNotificationRenderer: window.CakeNotificationRenderer,
        CakeNotificationWidget: window.CakeNotificationWidget
    };
}
