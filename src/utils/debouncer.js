import Vue from 'vue';

export default class DebounceCounter extends Vue {
  constructor(delay = 200) {
    super({
      data() {
        return { flag: false };
      },
    });
    this.count = 0;
    this.delay = delay;
    this.timeout = null;
  }

  inc() {
    this.count += 1;
    if (this.count > 0) {
      this._toggleFlag(true);
    }
  }

  dec() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      this._toggleFlag(false);
    }
  }

  _toggleFlag(val) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.flag = val;
    }, this.delay);
  }
}
