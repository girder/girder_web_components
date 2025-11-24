export class DebounceCounter {
  constructor(delay = 200, onFlagChange = () => {}) {
    this.delay = delay;
    this.timeout = null;
    this.count = 0;
    this.flag = false;
    this.onFlagChange = onFlagChange;
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
      this.onFlagChange(val);
    }, this.delay);
  }
}