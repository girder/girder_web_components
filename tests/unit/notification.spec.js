import RestClient from '@/rest';
import NotificationBus from '@/utils/notifications';

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

  // Helper method to simulate connection opening
  _simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen();
    }
  }

  // Helper method to simulate receiving a message
  _simulateMessage(data) {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  // Helper method to simulate an error
  _simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }

  // Helper method to simulate connection closing
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
  let originalWebSocket;

  beforeEach(() => {
    rc = new RestClient();
    rc.token = 'test-token-123';
    // Store original WebSocket if it exists
    originalWebSocket = window.WebSocket;
  });

  afterEach(() => {
    // Restore original WebSocket
    if (originalWebSocket) {
      window.WebSocket = originalWebSocket;
    }
  });

  it('events are emitted by type', async () => {
    const mockWs = new MockWebSocket();
    const bus = new NotificationBus(rc, {
      WebSocket: jest.fn(() => mockWs),
    });
    const message = jest.fn();
    const messageA = jest.fn();
    const messageAB = jest.fn();
    const notification = {
      updated: new Date(),
      type: 'A.B',
    };

    bus.$on('message', message);
    bus.$on('message:A', messageA);
    bus.$on('message:A.B', messageAB);
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
      WebSocket: jest.fn(() => mockWs),
    });
    const notification = {
      type: 'test',
      updated: new Date(),
    };
    bus.$on('message', message);
    bus.$on('error', error);

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
      WebSocket: jest.fn(() => mockWs),
    });
    const dumbBus = new NotificationBus(rc, {
      listenToRestClient: false,
      WebSocket: jest.fn(() => new MockWebSocket()),
    });

    expect(bus.connected).toBe(false);
    expect(dumbBus.connected).toBe(false);
    
    rc.token = 'test-token';
    rc.$emit('login', { _id: '123' });
    expect(bus._websocket).toBeDefined();
    mockWs._simulateOpen();
    expect(bus.connected).toBe(true);
    expect(dumbBus.connected).toBe(false);
    
    rc.$emit('logout');
    expect(bus.connected).toBe(false);
  });

  it('does not connect without authentication token', () => {
    rc.token = null;
    const error = jest.fn();
    const bus = new NotificationBus(rc);
    bus.$on('error', error);

    bus.connect();
    expect(bus._websocket).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot connect: no authentication token' }),
      bus,
    );
  });

  it('constructs WebSocket URL correctly', () => {
    rc.token = 'my-auth-token';
    rc.apiRoot = '/api/v1';
    const mockWs = new MockWebSocket();
    const WebSocketMock = jest.fn(() => mockWs);
    const bus = new NotificationBus(rc, { WebSocket: WebSocketMock });

    bus.connect();
    expect(WebSocketMock).toHaveBeenCalled();
    const url = WebSocketMock.mock.calls[0][0];
    expect(url).toContain('/notification/me?');
    expect(url).toContain('my-auth-token');
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
      WebSocket: WebSocketMock,
      reconnectInterval: 10,
      maxReconnectAttempts: 1,
    });

    bus.connect();
    mockWs1._simulateOpen();
    expect(bus.connected).toBe(true);

    // Simulate unexpected close
    mockWs1._simulateClose(1006); // Abnormal closure

    setTimeout(() => {
      expect(WebSocketMock).toHaveBeenCalledTimes(2);
      expect(bus._websocket).toBeDefined();
      done();
    }, 50);
  });
});
