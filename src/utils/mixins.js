import { AccessType } from '../constants';

/**
 * for components that need to show a locale-formatted date
 */
const dateFormatter = {
  methods: {
    formatDate(datestring) {
      const d = new Date(datestring);
      return d.toLocaleString();
    },
  },
};

/**
 * Any view component that needs to display human-readable data sizes should use this.
 */
const sizeFormatter = {
  methods: {
    formatSize(size, { base = 1024, unit = 'B' } = {}) {
      if (size < base) {
        return `${size} ${unit}`;
      }

      let i;
      let val = size;
      for (i = 0; val >= base && i < 4; i += 1) {
        val /= base;
      }

      return `${val.toFixed(2)}  ${['', 'K', 'M', 'G', 'T'][i]}${unit}`;
    },
  },
};

/**
 * This mixin exposes helper methods for components that need to check that the current user has
 * a certain access level on a given resource.
 */
const accessLevelChecker = {
  methods: {
    hasWriteAccess: resource => resource._accessLevel >= AccessType.WRITE,
    hasAdminAccess: resource => resource._accessLevel >= AccessType.ADMIN,
  },
};

/**
 * Convert file progress properties to percent.
 */
const progressReporter = {
  methods: {
    progressPercent(progress) {
      if (!progress.total) {
        return 0;
      }
      return Math.round((100 * (progress.current || 0)) / progress.total);
    },
  },
};

/**
 * For components that need to show a full formatted username
 */
const usernameFormatter = {
  methods: {
    formatUsername(user) {
      return `${user.firstName} ${user.lastName} (${user.login})`;
    },
  },
};

export {
  accessLevelChecker,
  dateFormatter,
  progressReporter,
  sizeFormatter,
  usernameFormatter,
};
