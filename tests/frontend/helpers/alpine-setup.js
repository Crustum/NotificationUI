import { afterEach } from 'vitest';

global.Alpine = {
    store: (name, store) => {
        if (!global.Alpine._stores) {
            global.Alpine._stores = {};
        }
        if (store) {
            global.Alpine._stores[name] = store;
        }
        return global.Alpine._stores[name];
    },
    data: (name, factory) => {
        if (!global.Alpine._data) {
            global.Alpine._data = {};
        }
        global.Alpine._data[name] = factory;
        return factory;
    },
    effect: (callback) => callback(),
    _stores: {},
    _data: {}
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {}
    })
};

const eventListeners = {};

global.document = {
    addEventListener: (event, callback) => {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
    },
    removeEventListener: (event, callback) => {
        if (eventListeners[event]) {
            const index = eventListeners[event].indexOf(callback);
            if (index > -1) {
                eventListeners[event].splice(index, 1);
            }
        }
    },
    dispatchEvent: (event) => {
        const listeners = eventListeners[event.type] || [];
        listeners.forEach(callback => {
            try {
                callback(event);
            } catch (e) {
                console.error('Event listener error:', e);
            }
        });
    },
    createElement: (tag) => ({
        tagName: tag,
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        removeChild: () => {},
        innerHTML: '',
        textContent: ''
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

afterEach(() => {
    global.Alpine._stores = {};
    global.Alpine._data = {};
});

