export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_CACHE_TTL: 300, // 5 minutes in seconds
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
};

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USERS_LIST: 'users:list',
  TASK: (id: string) => `task:${id}`,
  PROJECT: (id: string) => `project:${id}`,
};
