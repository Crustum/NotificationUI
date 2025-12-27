<?php
/**
 * Notification Bell Icon Element (Unified with Broadcasting Support)
 *
 * This is the unified notification bell that uses the modular JS architecture.
 * Broadcasting is enabled conditionally based on the 'broadcasting' parameter.
 *
 * @var \Cake\View\View $this
 * @var string $position Position of dropdown ('left'|'right')
 * @var string $theme Theme ('light'|'dark')
 * @var string $mode Display mode ('dropdown'|'panel')
 * @var int $pollInterval Poll interval in milliseconds
 * @var string|null $apiUrl API endpoint for fetching notifications
 * @var bool $enablePolling Enable database polling (default: true)
 * @var int $perPage Number of notifications per page
 * @var string $bellId DOM ID for bell element
 * @var string $dropdownId DOM ID for dropdown element
 * @var string $contentId DOM ID for content element
 * @var string $badgeId DOM ID for badge element
 * @var bool $markReadOnClick Mark notification as read on click
 * @var bool|array $broadcasting Enable broadcasting (false or config array)
 * @var int $unreadCount Initial unread count
 */

use Cake\Core\Configure;

$position = $position ?? 'right';
$theme = $theme ?? null;
$mode = $mode ?? 'dropdown'; // 'dropdown' or 'panel'
$pollInterval = $pollInterval ?? 30000;
$apiUrl = $apiUrl ?? '/notification/notifications/unread.json';
$enablePolling = $enablePolling ?? true;
$perPage = $perPage ?? 10;
$bellId = $bellId ?? 'notificationsBell';
$dropdownId = $dropdownId ?? 'notificationsDropdown';
$contentId = $contentId ?? 'notificationsContent';
$badgeId = $badgeId ?? 'notificationsBadge';
$markReadOnClick = $markReadOnClick ?? true;
$broadcasting = $broadcasting ?? false;
$unreadCount = $unreadCount ?? 0;

if (!$enablePolling) {
    $apiUrl = null;
}

$broadcastingConfig = null;
$broadcasterType = 'pusher';
if ($broadcasting && is_array($broadcasting)) {
    $broadcasterType = $broadcasting['broadcaster'] ?? 'pusher';

    if ($broadcasterType === 'mercure') {
        $broadcastingConfig = array_merge([
            'broadcaster' => 'mercure',
            'userId' => null,
            'userName' => 'Anonymous',
            'mercureUrl' => '/.well-known/mercure',
            'authEndpoint' => '/broadcasting/auth',
            'channelName' => null,
        ], $broadcasting);
    } else {
        $broadcastingConfig = array_merge([
            'broadcaster' => 'pusher',
            'userId' => null,
            'userName' => 'Anonymous',
            'pusherKey' => 'app-key',
            'pusherHost' => '127.0.0.1',
            'pusherPort' => 8080,
            'pusherCluster' => 'mt1',
            'channelName' => null,
        ], $broadcasting);
    }

    if (!$broadcastingConfig['channelName'] && isset($broadcastingConfig['userId'])) {
        $broadcastingConfig['channelName'] = "App.Model.Entity.User.{$broadcastingConfig['userId']}";
    }
}
?>

<div class="notifications-wrapper notifications-mode-<?= h($mode) ?>"
     <?php if ($theme !== null): ?>data-theme="<?= h($theme) ?>"<?php endif; ?>
     x-data="notificationBell({
         position: '<?= h($position) ?>',
         <?php if ($theme !== null): ?>theme: '<?= h($theme) ?>',<?php endif; ?>
         mode: '<?= h($mode) ?>',
         bellId: '<?= h($bellId) ?>',
         dropdownId: '<?= h($dropdownId) ?>',
         contentId: '<?= h($contentId) ?>',
         badgeId: '<?= h($badgeId) ?>',
         markReadOnClick: <?= $markReadOnClick ? 'true' : 'false' ?>
     })"
     @click.outside="handleClickOutside($event)">
    <a href="#"
       class="notifications-bell"
       id="<?= h($bellId) ?>"
       @click.prevent="toggle()"
       :aria-expanded="$store.notifications.isOpen"
       aria-label="Notifications"
       aria-haspopup="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <?php if ($unreadCount > 0): ?>
        <span class="notifications-badge"
              id="<?= h($badgeId) ?>"
              x-show="$store && $store.notifications && $store.notifications.unreadCount > 0"
              x-text="$store && $store.notifications ? $store.notifications.unreadCount : <?= (int)$unreadCount ?>"
              aria-label="Unread notifications">
            <?= (int)$unreadCount ?>
        </span>
        <?php else: ?>
        <span class="notifications-badge"
              id="<?= h($badgeId) ?>"
              x-show="$store && $store.notifications && $store.notifications.unreadCount > 0"
              x-text="$store && $store.notifications ? $store.notifications.unreadCount : ''"
              aria-label="Unread notifications"
              style="display: none;">
        </span>
        <?php endif; ?>
    </a>

    <div class="notifications-dropdown notifications-<?= h($theme) ?> notifications-position-<?= h($position) ?>"
         id="<?= h($dropdownId) ?>"
         x-show="$store.notifications.isOpen"
         :class="$store.notifications.isOpen ? 'notifications-open' : ''"
         x-cloak
         role="dialog"
         aria-labelledby="notifications-title"
         aria-modal="true">
        <div class="notifications-header">
            <h3 class="notifications-title" id="notifications-title">Notifications</h3>
            <button type="button"
                    class="notifications-mark-all-btn"
                    @click="$store.notifications.markAllAsRead()"
                    title="Mark all as read"
                    aria-label="Mark all notifications as read">
                Mark All
            </button>
        </div>
        <div class="notifications-content"
             id="<?= h($contentId) ?>"
             x-data="notificationList()"
             role="list"
             aria-live="polite"
             aria-label="Notification list">
            <?= $this->element('Crustum/NotificationUI.notifications/templates') ?>
        </div>
    </div>

    <?php if ($mode === 'panel'): ?>
        <div class="notifications-backdrop"
             id="notificationsBackdrop"
             x-show="$store.notifications.isOpen"
             x-cloak
             @click="$store.notifications.setOpen(false)">
        </div>
    <?php endif; ?>
</div>
<?= $this->AssetCompress->css('Crustum/NotificationUI.notifications', ['raw' => Configure::read('debug')]) ?>
<?= $this->AssetCompress->script('Crustum/NotificationUI.alpine.js', ['raw' => Configure::read('debug'), 'defer' => true]) ?>
<?= $this->AssetCompress->script('Crustum/NotificationUI.notifications', ['raw' => Configure::read('debug')]) ?>

<?php if ($broadcastingConfig): ?>
<?php if ($broadcasterType === 'mercure'): ?>
<?= $this->AssetCompress->script('Crustum/NotificationUI.mercure-broadcasting', ['raw' => Configure::read('debug')]) ?>
<?php else: ?>
<?= $this->AssetCompress->script('Crustum/NotificationUI.broadcasting', ['raw' => Configure::read('debug')]) ?>
<?php endif; ?>

<script>
window.broadcastingConfig = <?= json_encode($broadcastingConfig) ?>;
</script>
<?php endif; ?>

<?= $this->element('Crustum/NotificationUI.notifications/templates') ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    window.initializeNotifications({
        apiUrl: <?= json_encode($apiUrl) ?>,
        pollInterval: <?= (int)$pollInterval ?>,
        enablePolling: <?= json_encode($enablePolling) ?>,
        perPage: <?= (int)$perPage ?>,
        bellId: <?= json_encode($bellId) ?>,
        dropdownId: <?= json_encode($dropdownId) ?>,
        contentId: <?= json_encode($contentId) ?>,
        badgeId: <?= json_encode($badgeId) ?>,
        markReadOnClick: <?= json_encode($markReadOnClick) ?>,
        position: <?= json_encode($position) ?>,
        theme: <?= json_encode($theme) ?>,
        mode: <?= json_encode($mode) ?>,
        initialUnreadCount: <?= (int)$unreadCount ?>
    });
});
</script>
