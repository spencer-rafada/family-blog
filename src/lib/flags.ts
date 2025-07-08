import { flag } from 'flags/next';

// Feature flag for discover functionality
export const discoverFlag = flag<boolean>({
  key: 'discover',
  description: 'Enable discover page and album discovery features',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});

// Feature flag for profile page
export const profileFlag = flag<boolean>({
  key: 'profile',
  description: 'Enable profile management page',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});

// Feature flag for admin dashboard
export const adminFlag = flag<boolean>({
  key: 'admin',
  description: 'Enable admin dashboard and administrative features',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});

// Feature flag for general settings
export const settingsFlag = flag<boolean>({
  key: 'settings',
  description: 'Enable general application settings page',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});

// Feature flag for public posts
export const publicPostsFlag = flag<boolean>({
  key: 'public-posts',
  description: 'Enable public posts feature',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});

// Feature flag for about page
export const aboutFlag = flag<boolean>({
  key: 'about',
  description: 'Enable about page',
  decide() {
    return false; // Disabled by default
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' }
  ]
});