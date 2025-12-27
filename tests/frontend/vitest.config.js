import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./helpers/alpine-setup.js'],
        include: ['./**/*.test.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['../../webroot/js/**/*.js'],
            exclude: ['../../webroot/js/vendor/**']
        }
    }
});

