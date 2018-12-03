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

/*
 * For any view whose consumer may need to embed synchronous hooks into
 * the execution of user workflows.
 */
const registerHooks = allHooks => ({
  props: {
    hooks: {
      default: () => ({}),
      type: Object,
      validator(val) {
        const keys = Object.keys(val);
        return keys
          .filter(k => (allHooks.indexOf(k) >= 0) && typeof val[k] === 'function')
          .length === keys.length;
      },
    },
  },
  methods: {
    async waitForHook(hook) {
      if (hook in this.hooks) {
        try {
          await Promise.resolve(this.hooks[hook]());
        } catch (error) {
          this.$emit('error', { error });
        }
      }
    },
  },
});

export { registerHooks, sizeFormatter };
