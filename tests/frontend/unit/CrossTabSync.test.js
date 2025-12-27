import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockManager } from '../helpers/mock-manager.js';
import { BroadcastingBase } from '../../../webroot/js/BroadcastingBase.js';

describe('Cross-Tab Synchronization Bug', () => {
    let tab1Store;
    let tab2Store;
    let broadcaster;

    beforeEach(() => {
        const manager1 = createMockManager();
        const manager2 = createMockManager();

        tab1Store = {
            items: [],
            unreadCount: 0,
            manager: manager1,
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
            }
        };

        tab2Store = {
            items: [],
            unreadCount: 0,
            manager: manager2,
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
            }
        };

        broadcaster = new BroadcastingBase({
            userId: 1,
            userName: 'Test User',
            channelName: 'test-channel'
        });
    });

    it('BUG REPRODUCTION: marking read in tab2 causes incorrect unreadCount (becomes 0 instead of 1)', () => {
        const notification1 = {
            id: 1,
            title: 'Notification 1',
            message: 'First notification',
            read_at: null,
            created_at: new Date().toISOString()
        };

        const notification2 = {
            id: 2,
            title: 'Notification 2',
            message: 'Second notification',
            read_at: null,
            created_at: new Date().toISOString()
        };

        broadcaster.store = tab1Store;
        broadcaster.handleBroadcastEvent('notification.created', notification1);
        expect(tab1Store.unreadCount).toBe(1);
        expect(tab1Store.items).toHaveLength(1);

        broadcaster.store = tab2Store;
        broadcaster.handleBroadcastEvent('notification.created', notification1);
        expect(tab2Store.unreadCount).toBe(1);
        expect(tab2Store.items).toHaveLength(1);

        broadcaster.store = tab1Store;
        broadcaster.handleBroadcastEvent('notification.created', notification2);
        expect(tab1Store.unreadCount).toBe(2);
        expect(tab1Store.items).toHaveLength(2);

        broadcaster.store = tab2Store;
        broadcaster.handleBroadcastEvent('notification.created', notification2);
        expect(tab2Store.unreadCount).toBe(2);
        expect(tab2Store.items).toHaveLength(2);

        broadcaster.store = tab2Store;

        const markReadEvent = {
            notification_id: 1,
            unread_count: 1
        };

        broadcaster.handleBroadcastEvent('notification.marked-read', markReadEvent);

        expect(tab2Store.items).toHaveLength(1);
        expect(tab2Store.items[0].id).toBe(2);

        expect(tab2Store.unreadCount).toBe(1);
    });

    it('BUG: handleMarkAsReadUpdate double-decrements when unread_count is provided', () => {
        tab2Store.items = [
            { id: 1, read_at: null },
            { id: 2, read_at: null }
        ];
        tab2Store.unreadCount = 2;

        broadcaster.store = tab2Store;

        const markReadData = {
            notification_id: 1,
            unread_count: 1
        };

        console.log('Before handleMarkAsReadUpdate:', {
            unreadCount: tab2Store.unreadCount,
            itemsCount: tab2Store.items.length
        });

        broadcaster.handleMarkAsReadUpdate(markReadData);

        console.log('After handleMarkAsReadUpdate:', {
            unreadCount: tab2Store.unreadCount,
            itemsCount: tab2Store.items.length,
            expected: 1
        });

        expect(tab2Store.items).toHaveLength(1);
        expect(tab2Store.items[0].id).toBe(2);

        expect(tab2Store.unreadCount).toBe(1);
    });

    it('BUG REPRODUCTION: When unread_count is missing/undefined, it double-decrements', () => {
        tab2Store.items = [
            { id: 1, read_at: null },
            { id: 2, read_at: null }
        ];
        tab2Store.unreadCount = 2;

        broadcaster.store = tab2Store;

        const markReadData = {
            notification_id: 1
        };

        broadcaster.handleMarkAsReadUpdate(markReadData);

        expect(tab2Store.items).toHaveLength(1);
        expect(tab2Store.items[0].id).toBe(2);

        expect(tab2Store.unreadCount).toBe(1);
    });

    it('should trust server unread_count even when it is 0 (falsy)', () => {
        tab2Store.items = [
            { id: 1, read_at: null }
        ];
        tab2Store.unreadCount = 1;

        broadcaster.store = tab2Store;

        const markReadData = {
            notification_id: 1,
            unread_count: 0
        };

        broadcaster.handleMarkAsReadUpdate(markReadData);

        expect(tab2Store.items).toHaveLength(0);
        expect(tab2Store.unreadCount).toBe(0);
    });

    it('should correctly handle mark as read broadcast with unread_count from server', () => {
        const notification1 = {
            id: 1,
            title: 'Notification 1',
            message: 'First notification',
            read_at: null,
            created_at: new Date().toISOString()
        };

        const notification2 = {
            id: 2,
            title: 'Notification 2',
            message: 'Second notification',
            read_at: null,
            created_at: new Date().toISOString()
        };

        broadcaster.store = tab1Store;
        broadcaster.handleBroadcastEvent('notification.created', notification1);
        broadcaster.handleBroadcastEvent('notification.created', notification2);
        expect(tab1Store.unreadCount).toBe(2);

        broadcaster.store = tab2Store;
        broadcaster.handleBroadcastEvent('notification.created', notification1);
        broadcaster.handleBroadcastEvent('notification.created', notification2);
        expect(tab2Store.unreadCount).toBe(2);

        broadcaster.store = tab2Store;
        const markReadData = {
            notification_id: 1,
            unread_count: 1
        };
        broadcaster.handleBroadcastEvent('notification.marked-read', markReadData);

        expect(tab2Store.unreadCount).toBe(1);
        expect(tab2Store.items).toHaveLength(1);
        expect(tab2Store.items[0].id).toBe(2);
    });

    it('should use server unread_count when provided in mark-read event', () => {
        tab1Store.items = [
            { id: 1, read_at: null },
            { id: 2, read_at: null }
        ];
        tab1Store.unreadCount = 2;

        tab2Store.items = [
            { id: 1, read_at: null },
            { id: 2, read_at: null }
        ];
        tab2Store.unreadCount = 2;

        broadcaster.store = tab2Store;
        broadcaster.handleBroadcastEvent('notification.marked-read', {
            notification_id: 1,
            unread_count: 1
        });

        expect(tab2Store.unreadCount).toBe(1);
    });
});

