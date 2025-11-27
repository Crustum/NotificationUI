<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * Notifications Fixture
 *
 * Provides test data for notification-related tests
 */
class NotificationsFixture extends TestFixture
{
    /**
     * Import table schema from the notifications table
     *
     * @var array<string, mixed>
     */
    public array $import = ['table' => 'notifications'];

    /**
     * Test records
     *
     * @var array<array<string, mixed>>
     */
    public array $records = [
        [
            'id' => '550e8400-e29b-41d4-a716-446655440001',
            'model' => 'Users',
            'foreign_key' => '550e8400-e29b-41d4-a716-446655440100',
            'type' => 'App\\Notification\\WelcomeNotification',
            'data' => '{"message": "Welcome to our app!"}',
            'read_at' => '2025-10-12 10:00:00',
            'created' => '2025-10-12 09:00:00',
            'modified' => '2025-10-12 10:00:00',
        ],
        [
            'id' => '550e8400-e29b-41d4-a716-446655440002',
            'model' => 'Users',
            'foreign_key' => '550e8400-e29b-41d4-a716-446655440100',
            'type' => 'App\\Notification\\MessageNotification',
            'data' => '{"message": "You have a new message"}',
            'read_at' => null,
            'created' => '2025-10-13 08:00:00',
            'modified' => '2025-10-13 08:00:00',
        ],
        [
            'id' => '550e8400-e29b-41d4-a716-446655440003',
            'model' => 'Posts',
            'foreign_key' => '1',
            'type' => 'App\\Notification\\CommentNotification',
            'data' => '{"message": "New comment on your post"}',
            'read_at' => null,
            'created' => '2025-10-13 09:30:00',
            'modified' => '2025-10-13 09:30:00',
        ],
    ];
}
