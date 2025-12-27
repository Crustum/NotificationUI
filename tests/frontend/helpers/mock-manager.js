import { vi } from 'vitest';

export function createMockManager(options = {}) {
    return {
        options: {
            apiUrl: '/notification/notifications/unread.json',
            pollInterval: 30000,
            enablePolling: true,
            perPage: 10,
            ...options
        },
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        loadNotifications: vi.fn().mockResolvedValue({
            success: true,
            data: [],
            hasMore: false,
            unreadCount: 0
        }),
        markAsRead: vi.fn().mockResolvedValue(true),
        markAllAsRead: vi.fn().mockResolvedValue(true),
        deleteNotification: vi.fn().mockResolvedValue(true),
        getNotificationIcon: vi.fn().mockReturnValue(''),
        getNotificationTitle: vi.fn((n) => n.title || n.data?.title || ''),
        getNotificationMessage: vi.fn((n) => n.message || n.data?.message || ''),
        formatTimeAgo: vi.fn(() => 'just now')
    };
}

