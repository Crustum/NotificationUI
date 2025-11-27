<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\Test\TestCase\Controller;

use Cake\I18n\DateTime;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;
use Crustum\Notification\Model\Entity\Notification;

/**
 * Notifications Controller Test Case
 *
 * Tests the JSON API for database notifications
 */
class NotificationsControllerTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected array $fixtures = [
        'plugin.Crustum/NotificationUI.Users',
        'plugin.Crustum/NotificationUI.Notifications',
    ];

    /**
     * @var \Crustum\Notification\Test\TestApp\Model\Entity\User
     */
    protected $user1;

    /**
     * @var \Crustum\Notification\Test\TestApp\Model\Entity\User
     */
    protected $user2;

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->enableCsrfToken();
        $this->enableSecurityToken();

        $usersTable = TableRegistry::getTableLocator()->get('TestApp.Users');
        $this->user1 = $usersTable->get('550e8400-e29b-41d4-a716-446655440100');
        $this->user2 = $usersTable->get('550e8400-e29b-41d4-a716-446655440101');
    }

    /**
     * Helper to create test notification
     *
     * @param array<string, mixed> $data Notification data
     * @return \Crustum\Notification\Model\Entity\Notification
     */
    protected function createTestNotification(array $data = []): Notification
    {
        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');

        $defaults = [
            'model' => 'TestApp.Users',
            'foreign_key' => '550e8400-e29b-41d4-a716-446655440100',
            'type' => 'TestApp\Notification\PostPublished',
            'data' => ['message' => 'Test notification'],
            'read_at' => null,
        ];

        $notification = $notificationsTable->newEntity(array_merge($defaults, $data));

        return $notificationsTable->saveOrFail($notification);
    }

    /**
     * Test index action returns notifications
     *
     * @return void
     */
    public function testIndexReturnsNotifications(): void
    {
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);

        $this->mockAuthIdentity($this->user1);

        $this->get('/notification/notifications.json');

        $this->assertResponseOk();
        $this->assertContentType('application/json');

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('pagination', $response);
        $this->assertArrayHasKey('meta', $response);
        $this->assertCount(2, $response['data']);
    }

    /**
     * Test user sees only their notifications
     *
     * @return void
     */
    public function testUserSeesOnlyTheirNotifications(): void
    {
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440101']);

        $this->mockAuthIdentity($this->user1);

        $this->get('/notification/notifications.json');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertCount(2, $response['data']);
    }

    /**
     * Test unread action returns only unread notifications
     *
     * @return void
     */
    public function testUnreadReturnsOnlyUnread(): void
    {
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => DateTime::now()]);

        $this->mockAuthIdentity($this->user1);

        $this->get('/notification/notifications/unread.json');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertCount(2, $response['data']);
        $this->assertEquals(2, $response['meta']['count']);
    }

    /**
     * Test view action returns single notification
     *
     * @return void
     */
    public function testViewReturnsSingleNotification(): void
    {
        $notification = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);

        $this->mockAuthIdentity($this->user1);

        $this->get("/notification/notifications/{$notification->id}.json");

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertEquals($notification->id, $response['data']['id']);
    }

    /**
     * Test user cannot access other user's notifications
     *
     * @return void
     */
    public function testUserCannotAccessOtherUsersNotification(): void
    {
        $notification = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440101']);

        $this->mockAuthIdentity($this->user1);

        $this->get("/notification/notifications/{$notification->id}.json");

        $this->assertResponseCode(404);
    }

    /**
     * Test mark as read action
     *
     * @return void
     */
    public function testMarkAsReadUpdatesNotification(): void
    {
        $notification = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);

        $this->mockAuthIdentity($this->user1);

        $this->patch("/notification/notifications/{$notification->id}/read.json");

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertEquals('Notification marked as read', $response['message']);

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $updated = $notificationsTable->get($notification->id);
        $this->assertNotNull($updated->read_at);
    }

    /**
     * Test mark as read when already read
     *
     * @return void
     */
    public function testMarkAsReadWhenAlreadyRead(): void
    {
        $notification = $this->createTestNotification([
            'foreign_key' => '550e8400-e29b-41d4-a716-446655440100',
            'read_at' => DateTime::now(),
        ]);

        $this->mockAuthIdentity($this->user1);

        $this->patch("/notification/notifications/{$notification->id}/read.json");

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertEquals('Notification was already read', $response['message']);
    }

    /**
     * Test mark all as read action
     *
     * @return void
     */
    public function testMarkAllAsReadUpdatesAllUnread(): void
    {
        $notif1 = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $notif2 = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);

        $this->mockAuthIdentity($this->user1);

        $this->patch('/notification/notifications/mark-all-read.json');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertEquals(2, $response['data']['marked_count']);

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $this->assertNotNull($notificationsTable->get($notif1->id)->read_at);
        $this->assertNotNull($notificationsTable->get($notif2->id)->read_at);
    }

    /**
     * Test mark all as read only affects current user
     *
     * @return void
     */
    public function testMarkAllAsReadOnlyAffectsCurrentUser(): void
    {
        $user1Notif = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $user2Notif = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440101', 'read_at' => null]);

        $this->mockAuthIdentity($this->user1);

        $this->patch('/notification/notifications/mark-all-read.json');

        $this->assertResponseOk();

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $this->assertNotNull($notificationsTable->get($user1Notif->id)->read_at);
        $this->assertNull($notificationsTable->get($user2Notif->id)->read_at);
    }

    /**
     * Test delete action
     *
     * @return void
     */
    public function testDeleteRemovesNotification(): void
    {
        $notification = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);

        $this->mockAuthIdentity($this->user1);

        $this->delete("/notification/notifications/{$notification->id}.json");

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $this->assertFalse($notificationsTable->exists(['id' => $notification->id]));
    }

    /**
     * Test user cannot delete other user's notification
     *
     * @return void
     */
    public function testUserCannotDeleteOtherUsersNotification(): void
    {
        $notification = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440101']);

        $this->mockAuthIdentity($this->user1);

        $this->delete("/notifications/{$notification->id}.json");

        $this->assertResponseCode(404);

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $this->assertTrue($notificationsTable->exists(['id' => $notification->id]));
    }

    /**
     * Test delete all action
     *
     * @return void
     */
    public function testDeleteAllRemovesUserNotifications(): void
    {
        $notif1 = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        $notif2 = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        $otherUserNotif = $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440101']);

        $this->mockAuthIdentity($this->user1);

        $this->delete('/notification/notifications.json');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertTrue($response['success']);
        $this->assertEquals(2, $response['data']['deleted_count']);

        $notificationsTable = TableRegistry::getTableLocator()->get('Crustum/Notification.Notifications');
        $this->assertFalse($notificationsTable->exists(['id' => $notif1->id]));
        $this->assertFalse($notificationsTable->exists(['id' => $notif2->id]));
        $this->assertTrue($notificationsTable->exists(['id' => $otherUserNotif->id]));
    }

    /**
     * Test pagination parameters
     *
     * @return void
     */
    public function testIndexPaginationWorks(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100']);
        }

        $this->mockAuthIdentity($this->user1);

        $this->get('/notification/notifications.json?page=1&limit=10');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertCount(10, $response['data']);
        $this->assertEquals(1, $response['pagination']['current_page']);
        $this->assertEquals(10, $response['pagination']['per_page']);
        $this->assertEquals(25, $response['pagination']['total']);
        $this->assertEquals(3, $response['pagination']['total_pages']);
        $this->assertTrue($response['pagination']['has_next_page']);
        $this->assertFalse($response['pagination']['has_prev_page']);
    }

    /**
     * Test filtering by status
     *
     * @return void
     */
    public function testIndexFiltersByStatus(): void
    {
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => null]);
        $this->createTestNotification(['foreign_key' => '550e8400-e29b-41d4-a716-446655440100', 'read_at' => DateTime::now()]);

        $this->mockAuthIdentity($this->user1);

        $this->get('/notification/notifications.json?status=unread');

        $this->assertResponseOk();

        $response = json_decode((string)$this->_response->getBody(), true);

        $this->assertCount(2, $response['data']);
    }

    /**
     * Mock authentication identity
     *
     * @param \Crustum\Notification\Test\TestApp\Model\Entity\User $user User entity
     * @return void
     */
    protected function mockAuthIdentity($user): void
    {
        $this->session(['Auth' => $user]);
    }
}
