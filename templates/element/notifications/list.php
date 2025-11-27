<?php
/**
 * Notification List Element
 *
 * @var \Cake\View\View $this
 * @var array|\Cake\ORM\ResultSet $notifications Array of notification entities
 * @var bool $paginated Enable pagination (default: false)
 * @var bool $showFilters Show filter controls (default: false)
 * @var bool $allowBulkActions Enable bulk actions (default: false)
 * @var bool $allowDelete Allow delete buttons (default: true)
 * @var bool $markReadOnView Auto-mark as read when viewed (default: false)
 * @var int $limit Number of notifications to show (default: 10)
 */

$paginated = $paginated ?? false;
$showFilters = $showFilters ?? false;
$allowBulkActions = $allowBulkActions ?? false;
$allowDelete = $allowDelete ?? true;
$markReadOnView = $markReadOnView ?? false;
$limit = $limit ?? 10;

if (!isset($notifications)) {
    $notifications = [];
}
?>

<div class="notifications-list-container">

    <?php if ($showFilters): ?>
        <div class="notifications-filters">
            <?= $this->Form->create(null, ['type' => 'get', 'class' => 'notifications-filter-form']) ?>

            <?= $this->Form->control('status', [
                'type' => 'select',
                'options' => [
                    'all' => __('All'),
                    'unread' => __('Unread'),
                    'read' => __('Read'),
                ],
                'empty' => false,
                'label' => __('Status'),
                'value' => $this->request->getQuery('status', 'all'),
            ]) ?>

            <?= $this->Form->control('type', [
                'type' => 'select',
                'options' => $this->Notifications->getNotificationTypes(),
                'empty' => __('All Types'),
                'label' => __('Type'),
                'value' => $this->request->getQuery('type'),
            ]) ?>

            <?= $this->Form->button(__('Filter'), ['class' => 'filter-btn']) ?>

            <?= $this->Form->end() ?>
        </div>
    <?php endif; ?>

    <?php if ($allowBulkActions && !empty($notifications)): ?>
        <div class="notifications-bulk-actions">
            <button type="button"
                    class="bulk-action-btn mark-all-read"
                    data-action="markAllRead">
                <?= __('Mark all as read') ?>
            </button>

            <button type="button"
                    class="bulk-action-btn delete-read"
                    data-action="deleteRead">
                <?= __('Delete read') ?>
            </button>
        </div>
    <?php endif; ?>

    <div class="notifications-list">
        <?php if (empty($notifications)): ?>
            <?= $this->element('Crustum/NotificationUI.notifications/empty') ?>
        <?php else: ?>
            <?php foreach ($notifications as $notification): ?>
                <?= $this->element('Crustum/NotificationUI.notifications/item', [
                    'notification' => $notification,
                    'allowDelete' => $allowDelete,
                    'markReadOnView' => $markReadOnView,
                ]) ?>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <?php if ($paginated && $this->Paginator->total() > 1): ?>
        <div class="notifications-pagination">
            <?= $this->Paginator->prev('< ' . __('Previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('Next') . ' >') ?>
        </div>
    <?php endif; ?>
</div>
