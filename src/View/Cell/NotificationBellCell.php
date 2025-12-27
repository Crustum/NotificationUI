<?php
declare(strict_types=1);

namespace Crustum\NotificationUI\View\Cell;

use Cake\ORM\Locator\LocatorAwareTrait;
use Cake\View\Cell;
use Exception;

/**
 * NotificationBell cell
 */
class NotificationBellCell extends Cell
{
    use LocatorAwareTrait;

    /**
     * Default display method.
     *
     * @param string $position Position of dropdown
     * @param string|null $theme Theme ('light'|'dark'|null for auto-detect)
     * @param string $mode Display mode ('dropdown'|'panel')
     * @param int $pollInterval Poll interval in milliseconds
     * @param string $apiUrl API endpoint for fetching notifications
     * @param bool $enablePolling Enable database polling
     * @param int $perPage Number of notifications per page
     * @param string $bellId DOM ID for bell element
     * @param string $dropdownId DOM ID for dropdown element
     * @param string $contentId DOM ID for content element
     * @param string $badgeId DOM ID for badge element
     * @param bool $markReadOnClick Mark notification as read on click
     * @param array<string, mixed>|bool $broadcasting Enable broadcasting (false or config array)
     * @param int|null $unreadCount Initial unread count (null to auto-calculate)
     * @param mixed $userId User ID
     * @param mixed $userName User name
     * @param array<string, mixed>|null $pusherConfig Pusher configuration
     * @param array<string, mixed> $options Additional options
     * @return void
     */
    public function display(
        string $position = 'right',
        ?string $theme = null,
        string $mode = 'dropdown',
        int $pollInterval = 30000,
        string $apiUrl = '/notification/notifications/unread.json',
        bool $enablePolling = true,
        int $perPage = 10,
        string $bellId = 'notificationsBell',
        string $dropdownId = 'notificationsDropdown',
        string $contentId = 'notificationsContent',
        string $badgeId = 'notificationsBadge',
        bool $markReadOnClick = true,
        bool|array $broadcasting = false,
        ?int $unreadCount = null,
        mixed $userId = null,
        mixed $userName = null,
        ?array $pusherConfig = null,
        array $options = [],
    ): void {
        if ($unreadCount === null) {
            $unreadCount = $this->calculateUnreadCount();
        }

        $this->set([
            'position' => $position,
            'theme' => $theme,
            'mode' => $mode,
            'pollInterval' => $pollInterval,
            'apiUrl' => $apiUrl,
            'enablePolling' => $enablePolling,
            'perPage' => $perPage,
            'bellId' => $bellId,
            'dropdownId' => $dropdownId,
            'contentId' => $contentId,
            'badgeId' => $badgeId,
            'markReadOnClick' => $markReadOnClick,
            'broadcasting' => $broadcasting,
            'unreadCount' => $unreadCount,
            'userId' => $userId,
            'userName' => $userName,
            'pusherConfig' => $pusherConfig,
            'options' => $options,
        ]);
    }

    /**
     * Calculate unread notification count for current user.
     *
     * @return int
     */
    protected function calculateUnreadCount(): int
    {
        $identity = $this->request->getAttribute('identity');
        if (!$identity) {
            return 0;
        }

        $entity = $identity->getOriginalData();
        if (!$entity) {
            return 0;
        }

        $modelName = 'Users';
        if (method_exists($entity, 'getSource')) {
            /** @phpstan-ignore-next-line */
            $modelName = $entity->getSource();
        } elseif (method_exists($entity, 'getNotifiableModelName')) {
            /** @phpstan-ignore-next-line */
            $modelName = $entity->getNotifiableModelName();
        }

        $userId = $entity->id ?? $identity->getIdentifier();
        if (!$userId) {
            return 0;
        }

        try {
            $Notifications = $this->fetchTable('Crustum/Notification.Notifications');

            return $Notifications->find()
                ->where([
                    'Notifications.model' => $modelName,
                    'Notifications.foreign_key' => $userId,
                    'Notifications.read_at IS' => null,
                ])
                ->count();
        } catch (Exception $e) {
            return 0;
        }
    }
}
