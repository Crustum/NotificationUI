import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BroadcastingBase } from '../../../webroot/js/BroadcastingBase.js';

describe('BroadcastingBase', () => {
    let base;
    let mockStore;

    beforeEach(() => {
        mockStore = {
            addNotification: vi.fn(),
            removeNotification: vi.fn(),
            unreadCount: 0
        };

        base = new BroadcastingBase({
            userId: 1,
            userName: 'Test User',
            channelName: 'test-channel'
        });
    });

    describe('handleBroadcastEvent', () => {
        it('should add notification to store', () => {
            base.store = mockStore;

            base.handleBroadcastEvent('notification.created', {
                id: 1,
                title: 'Test',
                message: 'Test message'
            });

            expect(mockStore.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    title: 'Test'
                })
            );
        });

        it('should handle mark as read event', () => {
            base.store = mockStore;
            mockStore.unreadCount = 5;

            base.handleBroadcastEvent('notification.marked-read', {
                notification_id: 1,
                unread_count: 4
            });

            expect(mockStore.removeNotification).toHaveBeenCalledWith(1);
            expect(mockStore.unreadCount).toBe(4);
        });

        it('should handle mark all as read event', () => {
            base.store = mockStore;

            base.handleBroadcastEvent('notification.marked-all-read', {
                unread_count: 0
            });

            expect(mockStore.items).toEqual([]);
            expect(mockStore.unreadCount).toBe(0);
        });
    });

    describe('normalizeNotification', () => {
        it('should normalize notification data', () => {
            const normalized = base.normalizeNotification('test.event', {
                id: 1,
                title: 'Test',
                message: 'Message',
                data: { custom: 'value' }
            });

            expect(normalized).toEqual({
                id: 1,
                title: 'Test',
                message: 'Message',
                type: 'test.event',
                data: { custom: 'value' },
                created_at: expect.any(String),
                _source: 'broadcast'
            });
        });
    });
});

