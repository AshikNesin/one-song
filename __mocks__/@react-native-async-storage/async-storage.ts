const storage: Record<string, string> = {};

export default {
  setItem: jest.fn(async (key: string, value: string) => {
    storage[key] = value;
  }),
  getItem: jest.fn(async (key: string) => {
    return storage[key] ?? null;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete storage[key];
  }),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach(key => delete storage[key]);
  }),
};
