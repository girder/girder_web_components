import { createLocationValidator, isRootLocation } from '@/utils';

describe('createLocationValidator', () => {
  it('validates when root allowed', () => {
    const validator = createLocationValidator(true);
    expect(validator({ _modelType: 'folder', _id: 'fake_folder_id' })).toBe(true);
    expect(validator({ _modelType: 'user', _id: 'fake_user_id' })).toBe(true);
    // These fail because they require _id
    expect(validator({ _modelType: 'item' })).toBe(false);
    expect(validator({ _modelType: 'folder' })).toBe(false);
    expect(validator({ _modelType: 'user' })).toBe(false);
    expect(validator({ _modelType: 'collection' })).toBe(false);
    // Allow all root-type locations
    expect(validator({ type: 'root' })).toBe(true);
    expect(validator({ _modelType: 'root' })).toBe(true);
    expect(validator({ type: 'users' })).toBe(true);
    expect(validator({ _modelType: 'users' })).toBe(true);
    expect(validator({ type: 'collections' })).toBe(true);
    expect(validator({ _modelType: 'collections' })).toBe(true);
  });

  it('validates when root not allowed', () => {
    const validator = createLocationValidator(false);
    expect(validator({ _modelType: 'folder', _id: 'fake_folder_id' })).toBe(true);
    expect(validator({ _modelType: 'user', _id: 'fake_user_id' })).toBe(true);
    // These fail because they require _id
    expect(validator({ _modelType: 'item' })).toBe(false);
    expect(validator({ _modelType: 'folder' })).toBe(false);
    expect(validator({ _modelType: 'user' })).toBe(false);
    expect(validator({ _modelType: 'collection' })).toBe(false);
    // Reject all root-type locations
    expect(validator({ type: 'root' })).toBe(false);
    expect(validator({ _modelType: 'root' })).toBe(false);
    expect(validator({ type: 'users' })).toBe(false);
    expect(validator({ _modelType: 'users' })).toBe(false);
    expect(validator({ type: 'collections' })).toBe(false);
    expect(validator({ _modelType: 'collections' })).toBe(false);
  });
});

describe('isRootLocation', () => {
  expect(isRootLocation({ type: 'root' })).toBe(true);
  expect(isRootLocation({ _modelType: 'root' })).toBe(true);
  expect(isRootLocation({ type: 'collections' })).toBe(true);
  expect(isRootLocation({ _modelType: 'collections' })).toBe(true);
  expect(isRootLocation({ type: 'users' })).toBe(true);
  expect(isRootLocation({ _modelType: 'users' })).toBe(true);

  expect(isRootLocation({ type: 'user' })).toBe(false);
  expect(isRootLocation({ type: 'folder' })).toBe(false);
  expect(isRootLocation({ type: 'collection' })).toBe(false);

  expect(() => {
    isRootLocation({ type: 'item' });
  }).toThrow();
  expect(() => {
    isRootLocation({ _modelType: 'foo' });
  }).toThrow();
});
