<?php
/**
 * HTML/Alpine.js Templates for Notification Rendering
 *
 * These templates are rendered server-side as HTML with Alpine.js directives
 * and can be overridden at the application level by copying this file to:
 * templates/element/notifications/templates.php
 *
 * @var \Cake\View\View $this
 */
?>

<template x-if="isLoading">
    <div class="notifications-loading">Loading...</div>
</template>

<template x-if="!isLoading && items.length === 0">
    <div class="notifications-empty">
        <div class="notifications-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
        </div>
        <p class="notifications-empty-message">No notifications</p>
    </div>
</template>

<template x-for="notification in items" :key="notification.id">
    <div class="notification-item"
         :class="{
             'notification-unread': !notification.read_at,
             'notification-new': notification._isNew,
             'notification-success': notification.type === 'success',
             'notification-danger': notification.type === 'danger' || notification.type === 'error',
             'notification-warning': notification.type === 'warning',
             'notification-info': notification.type === 'info'
         }"
         :data-notification-id="notification.id"
         x-data="notificationItem(getNotificationData(notification))">
        <div class="notification-content">
            <template x-if="icon">
                <div class="notification-icon" x-html="icon"></div>
            </template>
            <div class="notification-text">
                <div class="notification-title" x-text="title"></div>
                <div class="notification-message" x-text="message"></div>
                <div class="notification-time" x-text="timeAgo"></div>
            </div>
        </div>
        <template x-if="actions && Array.isArray(actions) && actions.length > 0">
            <div class="notification-actions">
                <template x-for="(action, index) in actions" :key="`action-${notification.id}-${index}-${action.name || action.label || index}`">
                    <button type="button"
                            :class="['notification-action', (action.color || action.type) ? 'btn-' + (action.color || action.type) : '']"
                            :disabled="action.isDisabled === true"
                            @click.prevent="handleAction(action, notification)">
                        <template x-if="action.icon">
                            <i :class="action.icon" aria-hidden="true"></i>
                        </template>
                        <span x-text="action.label || action.name || 'Action'"></span>
                    </button>
                </template>
            </div>
        </template>
        <button type="button"
                x-show="!notification.read_at"
                @click="$store.notifications.markAsRead(notification.id)"
                class="notification-action-btn mark-read-btn"
                :data-id="notification.id"
                title="Mark as read">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </button>
    </div>
</template>

<template x-if="hasMore && !isLoading">
    <button type="button"
            @click="loadMore()"
            class="load-more-btn">
        Load More
    </button>
</template>
