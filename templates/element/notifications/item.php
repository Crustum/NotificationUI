<?php
/**
 * Single Notification Item Element
 *
 * @var \Cake\View\View $this
 * @var \Crustum\Notification\Model\Entity\Notification $notification
 * @var bool $allowDelete Show delete button (default: true)
 * @var bool $markReadOnView Auto-mark as read (default: false)
 */

use Cake\I18n\FrozenTime;

$allowDelete = $allowDelete ?? true;
$markReadOnView = $markReadOnView ?? false;
$isUnread = is_null($notification->read_at);
$typeIcon = $this->Notifications->getNotificationIcon($notification);
?>

<div class="notification-item <?= $isUnread ? 'notification-unread' : 'notification-read' ?>"
     data-notification-id="<?= h($notification->id) ?>"
     data-read="<?= $isUnread ? 'false' : 'true' ?>">

    <div class="notification-icon">
        <svg class="icon icon-<?= h($typeIcon) ?>" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <?php if ($typeIcon === 'bell'): ?>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <?php elseif ($typeIcon === 'dollar-sign'): ?>
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            <?php elseif ($typeIcon === 'truck'): ?>
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
            <?php else: ?>
                <circle cx="12" cy="12" r="10"/>
            <?php endif; ?>
        </svg>
    </div>

    <div class="notification-content">
        <div class="notification-title">
            <?= h($this->Notifications->getNotificationTitle($notification)) ?>
        </div>

        <div class="notification-message">
            <?= h($this->Notifications->getNotificationMessage($notification)) ?>
        </div>

        <div class="notification-time">
            <?= $notification->created->timeAgoInWords([
                'accuracy' => ['day' => 'day'],
                'end' => '+1 year',
            ]) ?>
        </div>
    </div>

    <div class="notification-actions">
        <?php if ($isUnread): ?>
            <button type="button"
                    class="notification-action-btn mark-read-btn"
                    data-action="markRead"
                    data-notification-id="<?= h($notification->id) ?>"
                    title="<?= __('Mark as read') ?>">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </button>
        <?php endif; ?>

        <?php if ($allowDelete): ?>
            <button type="button"
                    class="notification-action-btn delete-btn"
                    data-action="delete"
                    data-notification-id="<?= h($notification->id) ?>"
                    title="<?= __('Delete') ?>">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        <?php endif; ?>
    </div>
</div>
