import mitt from 'mitt';

function getWebSocketBaseUrl(apiRoot) {
  if (/^https?:\/\//.test(apiRoot)) {
    const url = new URL(apiRoot);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const pathname = url.pathname.replace(/\/api\/v1\/?$/, '');
    return `${wsProtocol}//${url.host}${pathname.replace(/\/$/, '')}`;
  }

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsPath = apiRoot.replace(/\/api\/v1\/?$/, '') || '';
  return `${wsProtocol}//${window.location.host}${wsPath.replace(/\/$/, '')}`;
}

export default class NotificationBus {
  constructor($rest, {
    EventSource = window.EventSource,
    WebSocket = window.WebSocket,
    listenToRestClient = true,
    pollingInterval = [500, 5000, 1000],
    since = new Date(),
    useEventSource = false,
    useWebSocket = false,
    withCredentials = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = Infinity,
  } = {}) {
    this.emitter = mitt();
    this.$rest = $rest;
    this.EventSource = EventSource;
    this.WebSocket = WebSocket;
    this.pollingInterval = pollingInterval;
    this.since = since;
    this.useEventSource = useEventSource;
    this.useWebSocket = useWebSocket;
    this.withCredentials = withCredentials;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this._eventSource = null;
    this._poller = null;
    this._websocket = null;
    this._reconnectAttempts = 0;

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

  _getWebSocketUrl() {
    const token = this.$rest.token;
    if (!token) {
      throw new Error('No authentication token available');
    }

    const baseUrl = getWebSocketBaseUrl(this.$rest.apiRoot);
    return `${baseUrl}/notifications/me?token=${encodeURIComponent(token)}`;
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

  _onWebSocketMessage(event) {
    try {
      const notification = JSON.parse(event.data);
      this._emitNotification(notification);
      this._reconnectAttempts = 0;
    } catch (e) {
      this.emit('error', new Error(`Failed to parse notification: ${e.message}`));
    }
  }

  _onWebSocketError(e) {
    this.emit('error', e);
  }

  _onWebSocketClose(event) {
    this._websocket = null;
    this.emit('stop', this);

    if (event.code !== 1000 && this._reconnectAttempts < this.maxReconnectAttempts) {
      this._reconnectAttempts += 1;
      setTimeout(() => {
        if (this.$rest.token) {
          this.connect();
        }
      }, this.reconnectInterval);
    } else if (this._reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Maximum reconnection attempts reached'));
    }
  }

  get connected() {
    if (this._websocket) {
      return this._websocket.readyState === this.WebSocket.OPEN;
    }
    return !!(this._eventSource || this._poller);
  }

  connect() {
    if (this.connected) { return; }

    if (this.useWebSocket) {
      this._connectWebSocket();
    } else if (this.useEventSource && this.EventSource) {
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

  _connectWebSocket() {
    if (!this.$rest.token) {
      this.emit('error', new Error('Cannot connect: no authentication token'));
      return;
    }

    try {
      const url = this._getWebSocketUrl();
      this._websocket = new this.WebSocket(url);
      this._websocket.onmessage = this._onWebSocketMessage.bind(this);
      this._websocket.onerror = this._onWebSocketError.bind(this);
      this._websocket.onclose = this._onWebSocketClose.bind(this);
      this._websocket.onopen = () => {
        this._reconnectAttempts = 0;
        this.emit('start', this);
      };
    } catch (e) {
      this.emit('error', e);
    }
  }

  disconnect() {
    this._stopPolling();
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
      this.emit('stop', this);
    }
    if (this._websocket) {
      this._websocket.close(1000);
      this._websocket = null;
      this._reconnectAttempts = 0;
    }
  }

  _poll(interval = 0) {
    const [min, max, step] = this.pollingInterval;
    let nextInterval;

    this._poller = setTimeout(async () => {
      try {
        const { data } = await this.$rest.get(`/notification?since=${this.since.toISOString()}`);
        data.forEach(this._emitNotification.bind(this));
        if (data.length) { nextInterval = min; }
        else if (interval === 0) { nextInterval = max; }
        else { nextInterval = Math.min(interval + step, max); }
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
