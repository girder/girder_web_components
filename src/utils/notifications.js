import Vue from 'vue';

export default class NotificationBus extends Vue {
  /**
   * This class is a Vue instance that polls the Girder server for notification events
   * and emits messages when they are received. It can use either long polling via the
   * EventSource API, or normal polling.
   * @param $rest {girder.rest.RestClient} An axios instance used for communicating with Girder.
   * @param opts {Object} options for this instance.
   * @param opts.EventSource {Object} A window.EventSource compliant interface. You should not
   *     override this in normal usage, it's mostly exposed for injection in testing.
   * @param opts.listenToRestClient {boolean} If true, binds to the login and logout events
   *     of the RestClient instance to automatically enable and disable the stream.
   * @param opts.pollingInterval {Number[]} An array of three numbers: minimum polling interval,
   *     maximum polling interval, and step value, all in milliseconds. The polling rate will
   *     fluctuate linearly between the min and max based on whether messages have been received
   *     recently. Only used in standard polling mode.
   * @param opts.withCredentials {boolean} Whether to set the withCredentials flag on the
   *     EventSource instance when using long polling.
   * @param opts.useEventSource {boolean} Whether to use long polling.
   * @param opts.since {Date} Date threshold to use when fetching notifications.
   */
  constructor($rest, {
    EventSource = window.EventSource,
    listenToRestClient = true,
    pollingInterval = [500, 5000, 1000],
    since = new Date(),
    useEventSource = false,
    withCredentials = true,
  } = {}) {
    super();
    Object.assign(this, {
      $rest, EventSource, pollingInterval, since, useEventSource, withCredentials,
    });

    if (listenToRestClient) {
      $rest.$on('login', () => { this.connect(); });
      $rest.$on('logout', () => { this.disconnect(); });
    }
  }

  _emitNotification(notification) {
    const { type, updated } = notification;
    if (updated) {
      this.since = new Date(Math.max(+this.since, +new Date(updated)));
    }
    for (let i = type.indexOf('.'); i !== -1; i = type.indexOf('.', i + 1)) {
      this.$emit(`message:${type.substring(0, i)}`, notification, this);
    }
    this.$emit(`message:${type}`, notification, this);
    this.$emit('message', notification, this);
  }

  _onSseMessage({ data }) {
    this._emitNotification(JSON.parse(data));
  }

  _onSseError(e) {
    // Fall back to polling on error. This could be made more sophisticated by
    // distinguishing temporary failures, using exponential back-off, etc.
    this.$emit('error', e, this);
    this.disconnect();
    this.useEventSource = false;
    this.connect();
  }

  get connected() {
    return !!(this._eventSource || this._poller);
  }

  connect() {
    if (this.connected) {
      return;
    }

    if (this.useEventSource && this.EventSource) {
      const since = Math.ceil(+this.since / 1000);
      const url = `${this.$rest.apiRoot}/notification/stream?since=${since}`;
      this._eventSource = new this.EventSource(url, {
        withCredentials: this.withCredentials,
      });
      this._eventSource.onmessage = this._onSseMessage.bind(this);
      this._eventSource.onerror = this._onSseError.bind(this);
      this.$emit('start', this);
    } else {
      this._poll();
    }
  }

  disconnect() {
    this._stopPolling();
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
      this.$emit('stop', this);
    }
  }

  _poll(interval = 0) {
    const [min, max, step] = this.pollingInterval;
    let nextInterval;

    this._poller = setTimeout(async () => {
      try {
        const { data } = await this.$rest.get(`/notification?since=${this.since.toISOString()}`);
        data.forEach(this._emitNotification.bind(this));
        if (data.length) {
          nextInterval = min;
        } else if (interval === 0) {
          nextInterval = max;
        } else {
          nextInterval = Math.min(interval + step, max);
        }
      } catch (e) {
        nextInterval = max;
      } finally {
        this._poll(nextInterval);
      }
    }, interval);
  }

  _stopPolling() {
    clearTimeout(this._poller);
    this._poller = null;
  }
}
