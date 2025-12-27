<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\Test\TestCase\Service;

use Cake\TestSuite\TestCase;
use Crustum\Broadcasting\Broadcasting;
use Crustum\Broadcasting\TestSuite\BroadcastingTrait;
use Crustum\Broadcasting\TestSuite\TestBroadcaster;
use Crustum\NotificationUI\Service\NotificationBroadcastingService;
use TestApp\Model\Entity\User;

/**
 * Notification Broadcasting Service Test Case
 */
class NotificationBroadcastingServiceTest extends TestCase
{
    use BroadcastingTrait;

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        if (class_exists('Crustum\Broadcasting\Broadcasting')) {
            $this->setupTestBroadcaster();
        }
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        if (class_exists('Crustum\Broadcasting\Broadcasting')) {
            TestBroadcaster::clearBroadcasts();
            Broadcasting::drop('default');
        }

        parent::tearDown();
    }

    /**
     * Test getUserChannel generates correct channel name
     *
     * @return void
     */
    public function testGetUserChannelGeneratesCorrectName(): void
    {
        $service = new NotificationBroadcastingService();

        $user = new User(['id' => 123]);
        $user->setSource('Users');

        $channelName = $service->getUserChannel($user);

        $this->assertStringContainsString('123', $channelName);
    }

    /**
     * Test broadcastMarkAsRead sends broadcast event
     *
     * @return void
     */
    public function testBroadcastMarkAsReadSendsEvent(): void
    {
        if (!class_exists('Crustum\Broadcasting\Broadcasting')) {
            $this->markTestSkipped('Broadcasting plugin not available');
        }

        $service = new NotificationBroadcastingService();
        $user = new User(['id' => 789]);
        $user->setSource('Users');

        $service->broadcastMarkAsRead('test-notification-id', $user, 5);

        $this->assertBroadcastSent('notification.marked-read');
        $this->assertBroadcastPayloadContains('notification.marked-read', 'notification_id', 'test-notification-id');
        $this->assertBroadcastPayloadContains('notification.marked-read', 'unread_count', 5);
    }

    /**
     * Test broadcastMarkAllAsRead sends broadcast event
     *
     * @return void
     */
    public function testBroadcastMarkAllAsReadSendsEvent(): void
    {
        if (!class_exists('Crustum\Broadcasting\Broadcasting')) {
            $this->markTestSkipped('Broadcasting plugin not available');
        }

        $service = new NotificationBroadcastingService();
        $user = new User(['id' => 456]);
        $user->setSource('Users');

        $service->broadcastMarkAllAsRead($user, 10);

        $this->assertBroadcastSent('notification.marked-all-read');
        $this->assertBroadcastPayloadContains('notification.marked-all-read', 'marked_count', 10);
        $this->assertBroadcastPayloadContains('notification.marked-all-read', 'unread_count', 0);
    }
}
