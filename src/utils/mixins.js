import { AccessType } from '@/constants';

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
 * Provides read/write-style lock with non-reactive components such that
 * the lock can be used as a side-effect in (especially async) computed properties.
 * Includes debouncing.
 */
const countlock = {
  data() {
    return {
      locked: false,
    };
  },
  methods: {
    lock() {
      this.countlock += 1;
      if (this.countlock > 0) {
        this.toggleLock(true);
      }
    },
    unlock() {
      this.countlock -= 1;
      if (this.countlock === 0) {
        this.toggleLock(false);
      }
    },
    toggleLock(bool) {
      if (this.locktimeout) {
        clearTimeout(this.locktimeout);
      }
      this.locktimeout = setTimeout(() => {
        this.locked = bool;
      }, this.locktime);
    },
  },
  created() {
    this.countlock = 0;
    this.locktimeout = null;
    this.locktime = 200;
  },
};

export {
  accessLevelChecker,
  countlock,
  sizeFormatter,
};
