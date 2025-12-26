<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\Service;

/**
 * @phpcs:disable Generic.Files.LineLength
 * This file intentionally uses fully qualified class names for Broadcasting classes
 * to prevent fatal errors when the Broadcasting plugin is not installed.
 * Do not convert these to use statements.
 */

use Cake\Datasource\EntityInterface;

/**
 * Notification Broadcasting Service
 *
 * Handles broadcasting of notification update events (mark as read, mark all as read)
 * to user's notification channels for real-time UI updates.
 */
class NotificationBroadcastingService
{
    /**
     * Check if broadcasting is enabled and configured
     *
     * @return bool True if broadcasting is available and enabled
     */
    public function isBroadcastingEnabled(): bool
    {
        if (!class_exists('Crustum\Broadcasting\Broadcasting')) {
            return false;
        }

        if (!\Crustum\Broadcasting\Broadcasting::enabled()) {
            return false;
        }

        $configured = \Crustum\Broadcasting\Broadcasting::configured();

        return !empty($configured);
    }

    /**
     * Get user's notification channel name
     *
     * Uses the same channel pattern as BroadcastChannel for consistency.
     *
     * @param \Cake\Datasource\EntityInterface $user The user entity
     * @return string The channel name
     */
    public function getUserChannel(EntityInterface $user): string
    {
        return \Crustum\BroadcastingNotification\Channel\BroadcastChannel::getNotifiableChannelName($user);
    }

    /**
     * Broadcast notification marked as read event
     *
     * @param string $notificationId The notification ID that was marked as read
     * @param \Cake\Datasource\EntityInterface $user The user entity
     * @param int $unreadCount The new unread count after marking as read
     * @return void
     */
    public function broadcastMarkAsRead(string $notificationId, EntityInterface $user, int $unreadCount): void
    {
        if (!$this->isBroadcastingEnabled()) {
            return;
        }

        $channelName = $this->getUserChannel($user);
        $channel = new \Crustum\Broadcasting\Channel\PrivateChannel($channelName);

        \Crustum\Broadcasting\Broadcasting::to([$channel])
            ->event('notification.marked-read')
            ->data([
                'notification_id' => $notificationId,
                'unread_count' => $unreadCount,
                'action' => 'mark-read',
            ])
            ->send();
    }

    /**
     * Broadcast all notifications marked as read event
     *
     * @param \Cake\Datasource\EntityInterface $user The user entity
     * @param int $markedCount The number of notifications marked as read
     * @return void
     */
    public function broadcastMarkAllAsRead(EntityInterface $user, int $markedCount): void
    {
        if (!$this->isBroadcastingEnabled()) {
            return;
        }

        $channelName = $this->getUserChannel($user);
        $channel = new \Crustum\Broadcasting\Channel\PrivateChannel($channelName);

        \Crustum\Broadcasting\Broadcasting::to([$channel])
            ->event('notification.marked-all-read')
            ->data([
                'marked_count' => $markedCount,
                'unread_count' => 0,
                'action' => 'mark-all-read',
            ])
            ->send();
    }
}
