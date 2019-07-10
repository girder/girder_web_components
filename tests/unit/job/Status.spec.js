import * as status from '@/components/job/status';

describe('job/status', () => {
  it('get a built in status by key', () => {
    expect(status.get('SUCCESS').value).toBe(3);
  });

  it('get a built in status by value', () => {
    expect(status.getByValue(3).text).toBe('Success');
  });

  it('get unknown status by key', () => {
    expect(status.get('not registered')).toBe(undefined);
  });

  it('get unknown status by value', () => {
    expect(status.getByValue(-999)).toBe(undefined);
  });

  it('get all statuses', () => {
    expect(status.all()).not.toEqual({});
  });

  it('register a custom status', () => {
    status.register({
      CUSTOM_STATUS: {
        value: 9999,
        text: 'custom',
      },
    });
    expect(status.get('CUSTOM_STATUS')).toEqual({ value: 9999, text: 'custom' });
  });

  it('register no-op', () => {
    const all = status.all();
    status.register();
    expect(status.all()).toEqual(all);
  });
});
