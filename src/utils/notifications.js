import Vue from 'vue';

export default class NotificationBus extends Vue {
  /**
   * This class is a Vue instance that connects to the Girder server via WebSocket
   * for notification events and emits messages when they are received.
   * @param $rest {girder.rest.RestClient} An axios instance used for communicating with Girder.
   * @param opts {Object} options for this instance.
   * @param opts.WebSocket {Object} A window.WebSocket compliant interface. You should not
   *     override this in normal usage, it's mostly exposed for injection in testing.
   * @param opts.listenToRestClient {boolean} If true, binds to the login and logout events
   *     of the RestClient instance to automatically enable and disable the stream.
   * @param opts.reconnectInterval {Number} The interval in milliseconds to wait before
   *     attempting to reconnect after a connection error. Defaults to 5000ms.
   * @param opts.maxReconnectAttempts {Number} Maximum number of reconnection attempts before
   *     giving up. Defaults to Infinity (retry indefinitely).
   */
  constructor($rest, {
    WebSocket = window.WebSocket,
    listenToRestClient = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = Infinity,
  } = {}) {
    super();
    Object.assign(this, {
      $rest, WebSocket, reconnectInterval, maxReconnectAttempts,
    });
    this._reconnectAttempts = 0;
    this.since = new Date();

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

  _getWebSocketUrl() {
    const token = this.$rest.token;
    if (!token) {
      throw new Error('No authentication token available');
    }
    // Convert HTTP/HTTPS URL to WebSocket URL
    const apiRoot = this.$rest.apiRoot;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove /api/v1 if present, as the WebSocket endpoint is at /notification/me
    const wsPath = apiRoot.replace(/\/api\/v1$/, '') || '';
    console.log('Connecting using Token:', token);
    return `${wsProtocol}//${window.location.host}${wsPath}/notification/me?token=${token}`;
  }

  _onWebSocketMessage(event) {
    try {
      console.log('onWebSocketMessage', event);
      const notification = JSON.parse(event.data);
      this._emitNotification(notification);
      // Reset reconnect attempts on successful message
      this._reconnectAttempts = 0;
    } catch (e) {
      this.$emit('error', new Error(`Failed to parse notification: ${e.message}`), this);
    }
  }

  _onWebSocketError(e) {
    this.$emit('error', e, this);
  }

  _onWebSocketClose(event) {
    this._websocket = null;
    this.$emit('stop', this);
    
    // Attempt to reconnect if not a normal closure and we haven't exceeded max attempts
    if (event.code !== 1000 && this._reconnectAttempts < this.maxReconnectAttempts) {
      this._reconnectAttempts += 1;
      setTimeout(() => {
        if (this.$rest.token) {
          this.connect();
        }
      }, this.reconnectInterval);
    } else if (this._reconnectAttempts >= this.maxReconnectAttempts) {
      this.$emit('error', new Error('Maximum reconnection attempts reached'), this);
    }
  }

  get connected() {
    return !!(this._websocket && this._websocket.readyState === this.WebSocket.OPEN);
  }

  connect() {
    if (this.connected) {
      return;
    }

    if (!this.$rest.token) {
      this.$emit('error', new Error('Cannot connect: no authentication token'), this);
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
        this.$emit('start', this);
      };
    } catch (e) {
      console.error('connect error', e);
      this.$emit('error', e, this);
    }
  }

  disconnect() {
    if (this._websocket) {
      this._websocket.close(1000); // Normal closure
      this._websocket = null;
      this._reconnectAttempts = 0;
    }
  }
}
