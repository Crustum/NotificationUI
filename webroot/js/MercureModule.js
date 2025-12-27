/**
 * Mercure Broadcasting Module
 *
 * Extends BroadcastingBase for Mercure SSE connection
 */
class MercureBroadcastingModule extends BroadcastingBase {
    constructor(options) {
        super(options);
        this.options = {
            mercureUrl: '/.well-known/mercure',
            authEndpoint: '/broadcasting/auth',
            ...this.options
        };

        this.echo = null;
    }

    initializeConnection() {
        if (typeof Echo === 'undefined') {
            console.warn('Mercure Module: Laravel Echo not loaded');
            return;
        }

        if (typeof MercureConnector === 'undefined') {
            console.warn('Mercure Module: MercureConnector not loaded');
            return;
        }

        this.echo = new Echo({
            broadcaster: MercureConnector,
            mercure: {
                url: this.options.mercureUrl
            },
            authEndpoint: this.options.authEndpoint
        });

        window.Echo = this.echo;

        this.echo.connector.on('connected', () => {
            this.connected = true;
        });

        this.echo.connector.on('disconnected', () => {
            this.connected = false;
        });

        this.echo.connector.on('error', (error) => {
            console.warn('Mercure Module: Connection error', error);
        });

        this.subscribeToChannel();
    }

    subscribeToChannel() {
        if (!this.options.channelName) {
            console.warn('Mercure Module: No channel name provided');
            return;
        }

        if (!this.echo) {
            return;
        }

        const channel = this.echo.private(this.options.channelName);

        channel.listen('*', (eventName, data) => {
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

    if (broadcastConfig.broadcaster !== 'mercure') {
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
            const module = new MercureBroadcastingModule(broadcastConfig);
            module.init(store);
        } catch (e) {
            console.error('Mercure Module: Initialization failed, retrying...', e.message);
            setTimeout(initBroadcasting, 100);
        }
    };

    setTimeout(initBroadcasting, 100);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MercureBroadcastingModule };
} else {
    window.MercureBroadcastingModule = MercureBroadcastingModule;
}
