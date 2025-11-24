import mitt from 'mitt';

export default class NotificationBus {
  constructor($rest, {
    EventSource = window.EventSource,
    listenToRestClient = true,
    pollingInterval = [500, 5000, 1000],
    since = new Date(),
    useEventSource = false,
    withCredentials = true,
  } = {}) {
    this.emitter = mitt();           // Event bus replacement for $emit/$on
    this.$rest = $rest;
    this.EventSource = EventSource;
    this.pollingInterval = pollingInterval;
    this.since = since;
    this.useEventSource = useEventSource;
    this.withCredentials = withCredentials;
    this._eventSource = null;
    this._poller = null;

    if (listenToRestClient) {
      $rest.on?.('userLoggedIn', () => { this.connect(); });
      $rest.on?.('userLoggedOut', () => { this.disconnect(); });
    }
  }

  on(event, handler) {
    this.emitter.on(event, handler);
  }

  off(event, handler) {
    this.emitter.off(event, handler);
  }

  emit(event, payload) {
    this.emitter.emit(event, payload);
  }

  _emitNotification(notification) {
    const { type, updated } = notification;
    if (updated) {
      this.since = new Date(Math.max(+this.since, +new Date(updated)));
    }
    for (let i = type.indexOf('.'); i !== -1; i = type.indexOf('.', i + 1)) {
      this.emit(`message:${type.substring(0, i)}`, notification);
    }
    this.emit(`message:${type}`, notification);
    this.emit('message', notification);
  }

  _onSseMessage({ data }) {
    this._emitNotification(JSON.parse(data));
  }

  _onSseError(e) {
    this.emit('error', e);
    this.disconnect();
    this.useEventSource = false;
    this.connect();
  }

  get connected() {
    return !!(this._eventSource || this._poller);
  }

  connect() {
    if (this.connected) {return;}

    if (this.useEventSource && this.EventSource) {
      const since = Math.ceil(+this.since / 1000);
      const url = `${this.$rest.apiRoot}/notification/stream?since=${since}`;
      this._eventSource = new this.EventSource(url, { withCredentials: this.withCredentials });
      this._eventSource.onmessage = this._onSseMessage.bind(this);
      this._eventSource.onerror = this._onSseError.bind(this);
      this.emit('start', this);
    } else {
      this._poll();
    }
  }

  disconnect() {
    this._stopPolling();
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
      this.emit('stop', this);
    }
  }

  _poll(interval = 0) {
    const [min, max, step] = this.pollingInterval;
    let nextInterval;

    this._poller = setTimeout(async () => {
      try {
        const { data } = await this.$rest.get(`/notification?since=${this.since.toISOString()}`);
        data.forEach(this._emitNotification.bind(this));
        if (data.length) {nextInterval = min;}
        else if (interval === 0) {nextInterval = max;}
        else {nextInterval = Math.min(interval + step, max);}
      } catch (_err) {
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