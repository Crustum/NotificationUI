<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\Controller;

use Cake\Controller\Controller;
use Cake\Datasource\EntityInterface;
use Cake\Datasource\QueryInterface;
use Cake\I18n\DateTime;
use Cake\ORM\Locator\LocatorAwareTrait;
use Crustum\Notification\Model\Table\NotificationsTable;
use Crustum\NotificationUI\Service\NotificationBroadcastingService;
use Exception;

/**
 * Notifications Controller
 *
 * Provides JSON API for managing database notifications
 *
 * @property \Authentication\Controller\Component\AuthenticationComponent $Authentication
 */
class NotificationsController extends Controller
{
    use LocatorAwareTrait;

    /**
     * Notifications table instance
     *
     * @var \Crustum\Notification\Model\Table\NotificationsTable
     */
    protected NotificationsTable $Notifications;

    /**
     * Notification broadcasting service instance
     *
     * @var \Crustum\NotificationUI\Service\NotificationBroadcastingService
     */
    protected NotificationBroadcastingService $broadcastingService;

    /**
     * Initialize method
     *
     * @return void
     */
    public function initialize(): void
    {
        parent::initialize();

        if ($this->components()->has('Authentication')) {
            $this->loadComponent('Authentication.Authentication');
        }
        /** @var \Crustum\Notification\Model\Table\NotificationsTable $Notifications */
        $Notifications = $this->fetchTable('Crustum/Notification.Notifications');
        $this->Notifications = $Notifications;
        $this->broadcastingService = new NotificationBroadcastingService();
        $this->viewBuilder()->setClassName('Json');
    }

    /**
     * Get notifiable identity information
     *
     * Extracts model name and ID from authenticated identity
     *
     * @return array{model: string, id: mixed}
     */
    protected function getNotifiableIdentity(): array
    {
        $identity = $this->request->getAttribute('identity');
        $entity = $identity?->getOriginalData();

        $modelName = 'Users';

        if (is_object($entity)) {
            if (method_exists($entity, 'getSource')) {
                $modelName = $entity->getSource();
            } elseif (method_exists($entity, 'getNotifiableModelName')) {
                $modelName = $entity->getNotifiableModelName();
            }
        }

        return [
            'model' => $modelName,
            'id' => $entity ? $entity->id : $identity->getIdentifier(),
        ];
    }

    /**
     * Build base query for current identity's notifications
     *
     * @return \Cake\Datasource\QueryInterface
     */
    protected function buildNotificationsQuery(): QueryInterface
    {
        $notifiable = $this->getNotifiableIdentity();

        return $this->Notifications->find()
            ->where([
                'Notifications.model' => $notifiable['model'],
                'Notifications.foreign_key' => $notifiable['id'],
            ])
            ->orderByDesc('Notifications.created');
    }

    /**
     * Verify notification ownership
     *
     * @param string $notificationId Notification ID
     * @return \Crustum\Notification\Model\Entity\Notification|null
     */
    protected function verifyNotificationOwnership(string $notificationId)
    {
        $notifiable = $this->getNotifiableIdentity();

        return $this->Notifications->find()
            ->where([
                'Notifications.id' => $notificationId,
                'Notifications.model' => $notifiable['model'],
                'Notifications.foreign_key' => $notifiable['id'],
            ])
            ->first();
    }

    /**
     * Index - Get paginated notifications
     *
     * @return void
     */
    public function index(): void
    {
        $this->request->allowMethod(['get']);

        $query = $this->buildNotificationsQuery();

        $status = $this->request->getQuery('status', 'all');
        if ($status === 'unread') {
            $query->where(['Notifications.read_at IS' => null]);
        } elseif ($status === 'read') {
            $query->where(['Notifications.read_at IS NOT' => null]);
        }

        $type = $this->request->getQuery('type');
        if ($type) {
            $query->where(['Notifications.type' => $type]);
        }

        try {
            $notifications = $this->paginate($query);
            $paging = $notifications->pagingParams();

            $unreadCount = $this->buildNotificationsQuery()
                ->where(['Notifications.read_at IS' => null])
                ->count();

            $this->set([
                'success' => true,
                'data' => $notifications,
                'pagination' => [
                    'current_page' => $paging['currentPage'],
                    'per_page' => $paging['perPage'],
                    'total' => $paging['totalCount'],
                    'total_pages' => $paging['pageCount'],
                    'has_next_page' => $paging['hasNextPage'],
                    'has_prev_page' => $paging['hasPrevPage'],
                ],
                'meta' => [
                    'unread_count' => $unreadCount,
                ],
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'data', 'pagination', 'meta']);
        } catch (Exception $e) {
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => __('An error occurred while retrieving notifications'),
                'code' => 'internal_error',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);
        }
    }

    /**
     * Unread - Get unread notifications only
     *
     * @return void
     */
    public function unread(): void
    {
        $this->request->allowMethod(['get']);

        $query = $this->buildNotificationsQuery()
            ->where(['Notifications.read_at IS' => null]);

        $type = $this->request->getQuery('type');
        if ($type) {
            $query->where(['Notifications.type' => $type]);
        }

        try {
            $notifications = $this->paginate($query);
            $paging = $notifications->pagingParams();

            $totalUnread = $this->buildNotificationsQuery()
                ->where(['Notifications.read_at IS' => null])
                ->count();

            $this->set([
                'success' => true,
                'data' => $notifications,
                'pagination' => [
                    'current_page' => $paging['currentPage'],
                    'per_page' => $paging['perPage'],
                    'total' => $paging['totalCount'],
                    'total_pages' => $paging['pageCount'],
                    'has_next_page' => $paging['hasNextPage'],
                    'has_prev_page' => $paging['hasPrevPage'],
                ],
                'meta' => [
                    'count' => $totalUnread,
                    'showing' => $notifications->count(),
                ],
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'data', 'pagination', 'meta']);
        } catch (Exception $e) {
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => __('An error occurred while retrieving notifications'),
                'code' => 'internal_error',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);
        }
    }

    /**
     * View - Get single notification
     *
     * @param string $id Notification ID
     * @return void
     */
    public function view(string $id): void
    {
        $this->request->allowMethod(['get']);

        $notification = $this->verifyNotificationOwnership($id);

        if (!$notification) {
            $this->response = $this->response->withStatus(404);
            $this->set([
                'success' => false,
                'message' => __('Notification not found'),
                'code' => 'notification_not_found',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);

            return;
        }

        $this->set([
            'success' => true,
            'data' => $notification,
        ]);
        $this->viewBuilder()->setOption('serialize', ['success', 'data']);
    }

    /**
     * Mark as read - Mark single notification as read
     *
     * @param string $id Notification ID
     * @return void
     */
    public function markAsRead(string $id): void
    {
        $this->request->allowMethod(['patch', 'post']);

        $notification = $this->verifyNotificationOwnership($id);

        if (!$notification) {
            $this->response = $this->response->withStatus(404);
            $this->set([
                'success' => false,
                'message' => __('Notification not found'),
                'code' => 'notification_not_found',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);

            return;
        }

        if ($notification->read_at !== null) {
            $this->set([
                'success' => true,
                'message' => __('Notification was already read'),
                'data' => [
                    'id' => $notification->id,
                    'read_at' => $notification->read_at,
                ],
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'data']);

            return;
        }

        $notification->read_at = new DateTime();

        if ($this->Notifications->save($notification)) {
            $notifiable = $this->getNotifiableIdentity();
            $userEntity = $this->request->getAttribute('identity')?->getOriginalData();

            if ($userEntity instanceof EntityInterface) {
                $unreadCount = $this->buildNotificationsQuery()
                    ->where(['Notifications.read_at IS' => null])
                    ->count();

                $this->broadcastingService->broadcastMarkAsRead(
                    $notification->id,
                    $userEntity,
                    $unreadCount,
                );
            }

            $this->set([
                'success' => true,
                'message' => __('Notification marked as read'),
                'data' => [
                    'id' => $notification->id,
                    'read_at' => $notification->read_at,
                ],
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'data']);
        } else {
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => __('Failed to mark notification as read'),
                'code' => 'update_failed',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);
        }
    }

    /**
     * Mark all as read - Mark all unread notifications as read
     *
     * @return void
     */
    public function markAllAsRead(): void
    {
        $this->request->allowMethod(['patch', 'post']);

        $notifiable = $this->getNotifiableIdentity();

        $conditions = [
            'Notifications.model' => $notifiable['model'],
            'Notifications.foreign_key' => $notifiable['id'],
            'Notifications.read_at IS' => null,
        ];

        $type = $this->request->getData('type');
        if ($type) {
            $conditions['Notifications.type'] = $type;
        }

        $before = $this->request->getData('before');
        if ($before) {
            $conditions['Notifications.created <'] = $before;
        }

        $count = $this->Notifications->updateAll(
            ['read_at' => DateTime::now()],
            $conditions,
        );

        $userEntity = $this->request->getAttribute('identity')?->getOriginalData();

        if ($userEntity instanceof EntityInterface) {
            $this->broadcastingService->broadcastMarkAllAsRead($userEntity, $count);
        }

        $this->set([
            'success' => true,
            'message' => __('All notifications marked as read'),
            'data' => [
                'marked_count' => $count,
            ],
        ]);
        $this->viewBuilder()->setOption('serialize', ['success', 'message', 'data']);
    }

    /**
     * Delete - Delete single notification
     *
     * @param string $id Notification ID
     * @return void
     */
    public function delete(string $id): void
    {
        $this->request->allowMethod(['delete', 'post']);

        $notification = $this->verifyNotificationOwnership($id);

        if (!$notification) {
            $this->response = $this->response->withStatus(404);
            $this->set([
                'success' => false,
                'message' => __('Notification not found'),
                'code' => 'notification_not_found',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);

            return;
        }

        if ($this->Notifications->delete($notification)) {
            $this->set([
                'success' => true,
                'message' => __('Notification deleted'),
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message']);
        } else {
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => __('Failed to delete notification'),
                'code' => 'delete_failed',
            ]);
            $this->viewBuilder()->setOption('serialize', ['success', 'message', 'code']);
        }
    }

    /**
     * Delete all - Delete multiple notifications
     *
     * @return void
     */
    public function deleteAll(): void
    {
        $this->request->allowMethod(['delete', 'post']);

        $notifiable = $this->getNotifiableIdentity();

        $conditions = [
            'Notifications.model' => $notifiable['model'],
            'Notifications.foreign_key' => $notifiable['id'],
        ];

        $status = $this->request->getData('status');
        if ($status === 'read') {
            $conditions['Notifications.read_at IS NOT'] = null;
        } elseif ($status === 'unread') {
            $conditions['Notifications.read_at IS'] = null;
        }

        $before = $this->request->getData('before');
        if ($before) {
            $conditions['Notifications.created <'] = $before;
        }

        $count = $this->Notifications->deleteAll($conditions);

        $this->set([
            'success' => true,
            'message' => __('Notifications deleted'),
            'data' => [
                'deleted_count' => $count,
            ],
        ]);
        $this->viewBuilder()->setOption('serialize', ['success', 'message', 'data']);
    }
}
