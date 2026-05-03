global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

global.__DEV__ = true;
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.nativeFabricUIManager = {};
global.performance = { now: jest.fn(Date.now) };
global.regeneratorRuntime = jest.requireActual('regenerator-runtime/runtime');
global.requestAnimationFrame = (callback) => setTimeout(() => callback(jest.now()), 0);
global.window = global;

jest.useFakeTimers();

jest.mock('react-native');
jest.mock('react-native-track-player');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-permissions');
jest.mock('@react-native-documents/picker');
jest.mock('react-native-safe-area-context');
jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn().mockReturnValue('1'),
  getVersion: jest.fn().mockReturnValue('0.0.1'),
}));

jest.mock('sp-react-native-in-app-updates', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkNeedsUpdate: jest.fn(),
    startUpdate: jest.fn(),
    installUpdate: jest.fn(),
    addStatusUpdateListener: jest.fn(),
  })),
  AndroidInstallStatus: {
    UNKNOWN: 0,
    PENDING: 1,
    DOWNLOADING: 2,
    INSTALLING: 3,
    INSTALLED: 4,
    FAILED: 5,
    CANCELED: 6,
    DOWNLOADED: 11,
  },
  IAUUpdateKind: {
    FLEXIBLE: 0,
    IMMEDIATE: 1,
  },
  IAUAvailabilityStatus: {
    UNKNOWN: 0,
    UNAVAILABLE: 1,
    AVAILABLE: 2,
    DEVELOPER_TRIGGERED: 3,
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  openSettings: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  Version: 33,
  select: jest.fn((obj) => obj.android),
}));
