<?php
/**
 * Notification Bell Cell Template
 *
 * @var \Cake\View\View $this
 * @var string $position Position of dropdown
 * @var string|null $theme
 * @var string $mode Display mode
 * @var int $pollInterval Poll interval in milliseconds
 * @var string|null $apiUrl API endpoint for fetching notifications
 * @var bool $enablePolling Enable database polling
 * @var int $perPage Number of notifications per page
 * @var string $bellId DOM ID for bell element
 * @var string $dropdownId DOM ID for dropdown element
 * @var string $contentId DOM ID for content element
 * @var string $badgeId DOM ID for badge element
 * @var bool $markReadOnClick Mark notification as read on click
 * @var bool|array $broadcasting Enable broadcasting (false or config array)
 * @var int|null $unreadCount Initial unread count (null to auto-calculate)
 * @var mixed $userId User ID
 * @var mixed $userName User name
 * @var array|null $pusherConfig Pusher configuration
 * @var array $options Additional options
 */

echo $this->element('Crustum/NotificationUI.notifications/bell_icon', [
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

