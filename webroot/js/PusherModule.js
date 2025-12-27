/**
 * Pusher Broadcasting Module
 *
 * Extends BroadcastingBase for Pusher-specific WebSocket connection
 */
class PusherBroadcastingModule extends BroadcastingBase {
    constructor(options) {
        super(options);
        this.options = {
            pusherKey: 'app-key',
            pusherHost: '127.0.0.1',
            pusherPort: 8080,
            pusherCluster: 'mt1',
            ...this.options
        };

        this.echo = null;
    }

    initializeConnection() {
        if (typeof Echo === 'undefined') {
            console.warn('Pusher Module: Laravel Echo not loaded');
            return;
        }

        if (typeof Pusher === 'undefined') {
            console.warn('Pusher Module: Pusher not loaded');
            return;
        }

        window.Pusher = Pusher;

        this.echo = new Echo({
            broadcaster: 'pusher',
            key: this.options.pusherKey,
            cluster: this.options.pusherCluster,
            wsHost: this.options.pusherHost,
            wsPort: this.options.pusherPort,
            wssPort: this.options.pusherPort,
            wsPath: '',
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
            forceTLS: false,
        });

        window.Echo = this.echo;

        if (this.echo.connector && this.echo.connector.pusher) {
            this.echo.connector.pusher.connection.bind('connected', () => {
                this.connected = true;
                this.subscribeToChannel();
            });

            this.echo.connector.pusher.connection.bind('disconnected', () => {
                this.connected = false;
            });

            this.echo.connector.pusher.connection.bind('error', (error) => {
                console.warn('Pusher Module: Connection error', error);
            });
        }
    }

    subscribeToChannel() {
        if (!this.options.channelName) {
            console.warn('Pusher Module: No channel name provided');
            return;
        }

        if (!this.echo) {
            return;
        }

        const channel = this.echo.private(this.options.channelName);

        channel.subscription.bind('pusher:subscription_succeeded', () => {
        });

        channel.subscription.bind('pusher:subscription_error', (error) => {
            console.error('Pusher Module: Subscription error', error);
        });

        this.echo.connector.pusher.bind_global((eventName, data) => {
            if (eventName.startsWith('pusher:')) return;
            this.handleBroadcastEvent(eventName, data);
        });
    }

    destroy() {
        if (this.echo) {
            this.echo.disconnect();
        }
        super.destroy();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const broadcastConfig = window.broadcastingConfig;
    if (!broadcastConfig) return;

    if (broadcastConfig.broadcaster === 'mercure') {
        return;
    }

    const initBroadcasting = () => {
        try {
            if (typeof Alpine === 'undefined') {
                setTimeout(initBroadcasting, 100);
                return;
            }

            const store = Alpine.store('notifications');
            if (!store) {
                setTimeout(initBroadcasting, 100);
                return;
            }
            const module = new PusherBroadcastingModule(broadcastConfig);
            module.init(store);
        } catch (e) {
            console.error('Pusher Module: Initialization failed, retrying...', e.message);
            setTimeout(initBroadcasting, 100);
        }
    };

    setTimeout(initBroadcasting, 100);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PusherBroadcastingModule };
} else {
    window.PusherBroadcastingModule = PusherBroadcastingModule;
}
