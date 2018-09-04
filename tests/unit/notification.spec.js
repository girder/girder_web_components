import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import sinon from 'sinon';
import RestClient from '@/rest';
import NotificationBus from '@/utils/notifications';

function waitsFor(func, msg) {
  const start = new Date();
  return new Promise((resolve, reject) => {
    const interval = window.setInterval(() => {
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

describe('NotificationBus', () => {
  const rc = new RestClient();
  const mock = new MockAdapter(rc);

  afterEach(() => {
    mock.reset();
  });

  it('events are emitted by type', async () => {
    const bus = new NotificationBus(rc);
    const message = sinon.stub();
    const messageA = sinon.stub();
    const messageAB = sinon.stub();
    const notification = {
      updated: new Date(),
      type: 'A.B',
    };

    bus.$on('message', message);
    bus.$on('message:A', messageA);
    bus.$on('message:A.B', messageAB);
    expect(bus.connected).to.equal(false);

    mock.onGet(/notification/).reply(200, [notification]);

    bus.connect();
    expect(bus.connected).to.equal(true);

    await waitsFor(
      () => message.calledOnce && messageA.calledOnce && messageAB.calledOnce,
      'Messages were not emitted',
    );
    expect(+bus.since).to.be.closeTo(+notification.updated, 10);
    bus.disconnect();
    expect(bus.connected).to.equal(false);
  });
});
