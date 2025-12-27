export const mockNotification = {
    id: 1,
    title: 'Test Notification',
    message: 'This is a test message',
    read_at: null,
    created_at: new Date().toISOString(),
    type: 'info',
    data: {}
};

export const mockReadNotification = {
    ...mockNotification,
    id: 2,
    read_at: new Date().toISOString()
};

export const mockNotifications = [
    mockNotification,
    mockReadNotification,
    {
        id: 3,
        title: 'Another Notification',
        message: 'Another message',
        read_at: null,
        created_at: new Date().toISOString()
    }
];

