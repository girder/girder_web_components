import MockAdapter from 'axios-mock-adapter';
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

class MockEventSource {
  close() {
    return this;
  }
}

describe('NotificationBus', () => {
  const rc = new RestClient();
  const mock = new MockAdapter(rc);

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
    rc.$emit('userLoggedIn', { _id: '123' });
    expect(bus.connected).toBe(true);
    expect(dumbBus.connected).toBe(false);
    rc.$emit('userLoggedOut');
    expect(bus.connected).toBe(false);
  });
});
