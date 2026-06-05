import MockAdapter from 'axios-mock-adapter';
import RestClient from '@/utils/restClient';
import NotificationBus from '@/utils/notificationBus';

function waitsFor(func, msg) {
  const start = new Date();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const response = func();
      if (response) {
        clearInterval(interval);
        resolve(response);
      } else if ((new Date() - start) > 500) {
        clearInterval(interval);
        reject(new Error(msg));
      }
    }, 0);
  });
}

class MockEventSource {
  close() {
    return this;
  }
}

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  _simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen();
    }
  }

  _simulateMessage(data) {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  _simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }

  _simulateClose(code = 1000) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code });
    }
  }

  close(code = 1000) {
    if (this.readyState === MockWebSocket.OPEN || this.readyState === MockWebSocket.CONNECTING) {
      this.readyState = MockWebSocket.CLOSING;
      setTimeout(() => {
        this._simulateClose(code);
      }, 0);
    }
  }
}

describe('NotificationBus', () => {
  let rc;
  let mock;

  beforeEach(() => {
    rc = new RestClient();
    mock = new MockAdapter(rc._axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it('events are emitted by type', async () => {
    const bus = new NotificationBus(rc);
    const message = jest.fn();
    const messageA = jest.fn();
    const messageAB = jest.fn();
    const notification = {
      updated: new Date(),
      type: 'A.B',
    };

    bus.on('message', message);
    bus.on('message:A', messageA);
    bus.on('message:A.B', messageAB);
    expect(bus.connected).toBe(false);

    mock.onGet(/notification/).reply(200, [notification]);

    bus.connect();
    expect(bus.connected).toBe(true);

    await waitsFor(
      () => message.mock.calls.length && messageA.mock.calls.length && messageAB.mock.calls.length,
      'Messages were not emitted',
    );
    expect(+bus.since).toBe(+notification.updated);
    bus.disconnect();
    expect(bus.connected).toBe(false);
  });

  it('event stream mode', () => {
    const message = jest.fn();
    const error = jest.fn();
    const bus = new NotificationBus(rc, {
      useEventSource: true,
      EventSource: MockEventSource,
    });
    const notification = {
      type: 'test',
      updated: new Date(),
    };
    bus.on('message', message);
    bus.on('error', error);

    expect(bus._eventSource).toBeUndefined();
    bus.connect();
    expect(bus._eventSource).not.toBeUndefined();

    bus._eventSource.onmessage({ data: JSON.stringify(notification) });
    expect(message).toHaveBeenCalledTimes(1);

    bus._eventSource.onerror();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('listens to RestClient login/logout', () => {
    const bus = new NotificationBus(rc);
    const dumbBus = new NotificationBus(rc, { listenToRestClient: false });
    mock.onGet(/notification/).reply(200, []);

    expect(bus.connected).toBe(false);
    expect(dumbBus.connected).toBe(false);
    rc.emit('userLoggedIn', { _id: '123' });
    expect(bus.connected).toBe(true);
    expect(dumbBus.connected).toBe(false);
    rc.emit('userLoggedOut');
    expect(bus.connected).toBe(false);
  });

  describe('WebSocket mode (Girder 5)', () => {
    let originalWebSocket;

    beforeEach(() => {
      rc.token = 'test-token-123';
      originalWebSocket = window.WebSocket;
    });

    afterEach(() => {
      if (originalWebSocket) {
        window.WebSocket = originalWebSocket;
      }
    });

    it('events are emitted by type', async () => {
      const mockWs = new MockWebSocket();
      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: jest.fn(() => mockWs),
      });
      const message = jest.fn();
      const messageA = jest.fn();
      const messageAB = jest.fn();
      const notification = {
        updated: new Date(),
        type: 'A.B',
      };

      bus.on('message', message);
      bus.on('message:A', messageA);
      bus.on('message:A.B', messageAB);
      expect(bus.connected).toBe(false);

      bus.connect();
      expect(bus._websocket).toBeDefined();
      mockWs._simulateOpen();
      expect(bus.connected).toBe(true);

      mockWs._simulateMessage(notification);
      await waitsFor(
        () => message.mock.calls.length && messageA.mock.calls.length && messageAB.mock.calls.length,
        'Messages were not emitted',
      );
      expect(+bus.since).toBe(+notification.updated);
      bus.disconnect();
      expect(bus.connected).toBe(false);
    });

    it('handles WebSocket messages and errors', () => {
      const mockWs = new MockWebSocket();
      const message = jest.fn();
      const error = jest.fn();
      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: jest.fn(() => mockWs),
      });
      const notification = {
        type: 'test',
        updated: new Date(),
      };
      bus.on('message', message);
      bus.on('error', error);

      expect(bus._websocket).toBeUndefined();
      bus.connect();
      expect(bus._websocket).toBeDefined();
      mockWs._simulateOpen();

      mockWs._simulateMessage(notification);
      expect(message).toHaveBeenCalledTimes(1);

      mockWs._simulateError(new Error('WebSocket error'));
      expect(error).toHaveBeenCalledTimes(1);
    });

    it('listens to RestClient login/logout', () => {
      const mockWs = new MockWebSocket();
      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: jest.fn(() => mockWs),
      });
      const dumbBus = new NotificationBus(rc, {
        useWebSocket: true,
        listenToRestClient: false,
        WebSocket: jest.fn(() => new MockWebSocket()),
      });

      expect(bus.connected).toBe(false);
      expect(dumbBus.connected).toBe(false);

      rc.token = 'test-token';
      rc.emit('userLoggedIn', { _id: '123' });
      expect(bus._websocket).toBeDefined();
      mockWs._simulateOpen();
      expect(bus.connected).toBe(true);
      expect(dumbBus.connected).toBe(false);

      rc.emit('userLoggedOut');
      expect(bus.connected).toBe(false);
    });

    it('does not connect without authentication token', () => {
      rc.token = null;
      const error = jest.fn();
      const bus = new NotificationBus(rc, { useWebSocket: true });
      bus.on('error', error);

      bus.connect();
      expect(bus._websocket).toBeUndefined();
      expect(error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cannot connect: no authentication token' }),
      );
    });

    it('constructs WebSocket URL correctly', () => {
      rc.token = 'my-auth-token';
      rc.apiRoot = '/api/v1';
      const mockWs = new MockWebSocket();
      const WebSocketMock = jest.fn(() => mockWs);
      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: WebSocketMock,
      });

      bus.connect();
      expect(WebSocketMock).toHaveBeenCalled();
      const url = WebSocketMock.mock.calls[0][0];
      expect(url).toContain('/notifications/me?token=');
      expect(url).toContain('my-auth-token');
    });

    it('constructs WebSocket URL from absolute apiRoot', () => {
      rc.token = 'my-auth-token';
      rc.apiRoot = 'https://data.kitware.com/api/v1';
      const mockWs = new MockWebSocket();
      const WebSocketMock = jest.fn(() => mockWs);
      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: WebSocketMock,
      });

      bus.connect();
      const url = WebSocketMock.mock.calls[0][0];
      expect(url).toBe('wss://data.kitware.com/notifications/me?token=my-auth-token');
    });

    it('handles reconnection on close', (done) => {
      const mockWs1 = new MockWebSocket();
      const mockWs2 = new MockWebSocket();
      let wsCallCount = 0;
      const WebSocketMock = jest.fn(() => {
        wsCallCount += 1;
        return wsCallCount === 1 ? mockWs1 : mockWs2;
      });

      const bus = new NotificationBus(rc, {
        useWebSocket: true,
        WebSocket: WebSocketMock,
        reconnectInterval: 10,
        maxReconnectAttempts: 1,
      });

      bus.connect();
      mockWs1._simulateOpen();
      expect(bus.connected).toBe(true);

      mockWs1._simulateClose(1006);

      setTimeout(() => {
        expect(WebSocketMock).toHaveBeenCalledTimes(2);
        expect(bus._websocket).toBeDefined();
        done();
      }, 50);
    });
  });
});
