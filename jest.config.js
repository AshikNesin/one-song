module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
  },
  moduleNameMapper: {
    '^@/App$': '<rootDir>/App.tsx',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-track-player$': '<rootDir>/__mocks__/react-native-track-player.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.ts',
    '^react-native-permissions$': '<rootDir>/__mocks__/react-native-permissions.ts',
    '^@react-native-documents/picker$': '<rootDir>/__mocks__/@react-native-documents/picker.ts',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native.ts',
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.ts',
  },
  resolver: require.resolve('@react-native/jest-preset/jest/resolver.js'),
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-track-player|react-native-permissions|react-native-safe-area-context|@react-native-documents/picker|react-native-fs|id3-parser)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: require.resolve('@react-native/jest-preset/jest/react-native-env.js'),
};
