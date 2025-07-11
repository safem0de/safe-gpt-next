module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './test/babel.config.js' }], // ให้ babel-jest แปลง ts/tsx ด้วย
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './test/babel.config.js' }],
    },
};
