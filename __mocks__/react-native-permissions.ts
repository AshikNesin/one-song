export const PERMISSIONS = {
  ANDROID: {
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    READ_MEDIA_AUDIO: 'android.permission.READ_MEDIA_AUDIO',
  },
  IOS: {},
};

export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};

export const check = jest.fn().mockResolvedValue(RESULTS.GRANTED);
export const request = jest.fn().mockResolvedValue(RESULTS.GRANTED);
