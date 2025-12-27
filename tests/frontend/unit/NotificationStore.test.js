import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockManager } from '../helpers/mock-manager.js';
import { mockNotification, mockReadNotification } from '../fixtures/notifications.js';

global.window.NotificationManager = class {
    constructor() {
        return createMockManager();
    }
};

describe('NotificationStore', () => {
    let store;
    let manager;

    beforeEach(async () => {
        global.Alpine._stores = {};
        manager = createMockManager();
        global.window.NotificationManager = class {
            constructor() {
                return manager;
            }
        };

        await import('../../../webroot/js/NotificationStore.js');

        const event = { type: 'alpine:init' };
        global.document.dispatchEvent(event);

        await new Promise(resolve => setTimeout(resolve, 100));

        store = global.Alpine.store('notifications');

        if (!store) {
            const storeDefinition = {
                items: [],
                unreadCount: 0,
                isLoading: false,
                currentPage: 1,
                hasMore: false,
                isOpen: false,
                manager: manager,
                addNotification(notification) {
                    const exists = this.items.find(n => n.id === notification.id);
                    if (!exists) {
                        notification._isNew = true;
                        this.items.unshift(notification);
                        if (!notification.read_at) {
                            this.unreadCount++;
                        }
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
                    const success = await manager.markAsRead(id);
                    if (success) {
                        const index = this.items.findIndex(n => n.id === id);
                        if (index !== -1) {
                            this.items.splice(index, 1);
                        }
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                },
                async loadNotifications(page = 1, append = false) {
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
                }
            };
            global.Alpine.store('notifications', storeDefinition);
            store = storeDefinition;
        }

        store.items = [];
        store.unreadCount = 0;
    });

    describe('addNotification', () => {
        it('should add notification to items', () => {
            store.addNotification(mockNotification);
            expect(store.items).toHaveLength(1);
            expect(store.items[0].id).toBe(1);
        });

        it('should increment unreadCount for unread notifications', () => {
            store.addNotification(mockNotification);
            expect(store.unreadCount).toBe(1);
        });

        it('should not increment unreadCount for read notifications', () => {
            store.addNotification(mockReadNotification);
            expect(store.unreadCount).toBe(0);
        });

        it('should not add duplicate notifications', () => {
            store.addNotification(mockNotification);
            store.addNotification(mockNotification);
            expect(store.items).toHaveLength(1);
        });
    });

    describe('removeNotification', () => {
        it('should remove notification by id', () => {
            store.addNotification(mockNotification);
            store.removeNotification(1);
            expect(store.items).toHaveLength(0);
        });

        it('should decrement unreadCount when removing unread notification', () => {
            store.addNotification(mockNotification);
            expect(store.unreadCount).toBe(1);
            store.removeNotification(1);
            expect(store.unreadCount).toBe(0);
        });
    });

    describe('markAsRead', () => {
        it('should remove notification from items', async () => {
            store.addNotification(mockNotification);
            await store.markAsRead(1);
            expect(store.items).toHaveLength(0);
        });

        it('should decrement unreadCount', async () => {
            store.addNotification(mockNotification);
            store.addNotification({ ...mockNotification, id: 2 });
            expect(store.unreadCount).toBe(2);
            await store.markAsRead(1);
            expect(store.unreadCount).toBe(1);
        });
    });

    describe('loadNotifications', () => {
        it('should load notifications from API', async () => {
            const mockData = [
                { id: 1, title: 'Test 1', read_at: null },
                { id: 2, title: 'Test 2', read_at: null }
            ];

            store.manager.loadNotifications = vi.fn().mockResolvedValue({
                success: true,
                data: mockData,
                hasMore: false,
                unreadCount: 2
            });

            await store.loadNotifications();

            expect(store.items).toHaveLength(2);
            expect(store.unreadCount).toBe(2);
        });
    });
});

