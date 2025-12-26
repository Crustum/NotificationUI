# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3]

### Added

- Real-time broadcasting updates for mark as read / mark all as read
- Cross-tab synchronization when notifications are marked as read

### Fixed

- Mark as read now works with broadcast notifications

## [1.0.2]

### Added

- Mercure broadcasting support via `MercureBroadcastingModule` for Server-Sent Events (SSE) real-time notifications
- Integration with `@crustum/laravel-echo-mercure` connector for Laravel Echo compatibility
- Automatic Mercure module loading when broadcaster is set to `mercure` in configuration
- Support for Mercure-specific configuration options (`mercureUrl`, `authEndpoint`)

## [1.0.0]

### Added

- Notification bell widget with dropdown and side panel display modes for displaying notifications in web interface
- Real-time broadcasting support with Pusher integration and automatic polling fallback for reliable notification delivery
- Complete JavaScript API with `NotificationManager`, `NotificationWidget`, and `NotificationRenderer` classes for managing notifications programmatically
- RESTful JSON API endpoints for notification management including mark as read, delete, and bulk operations
- Template overloading support allowing complete customization of notification rendering and UI components
- Event-driven architecture with JavaScript events for reacting to notification lifecycle events

