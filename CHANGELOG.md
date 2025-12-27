# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0]

### Changed

- **Complete rewrite to Alpine.js**: Migrated from vanilla JavaScript to Alpine.js for reactive state management and declarative UI
- **CakePHP Cell architecture**: Refactored notification bell to use `NotificationBellCell` for better component organization and separation of concerns
- **Broadcasting architecture**: Introduced `BroadcastingBase` abstract class eliminating 42% code duplication between Pusher and Mercure modules

### Added

- **Alpine.js store**: New `NotificationStore` providing centralized state management with reactive updates
- **Automatic theme detection**: Support for light/dark theme detection with system preference fallback
- **Template customization**: Server-side PHP templates can now be overridden via CakePHP element system

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

