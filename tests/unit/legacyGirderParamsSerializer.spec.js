import legacyGirderParamsSerializer from '@/utils/legacyGirderParamsSerializer';

describe('legacyGirderParamsSerializer', () => {
  it('JSON-stringifies nested objects for Girder jsonParam endpoints', () => {
    const query = legacyGirderParamsSerializer({
      folderId: 'abc123',
      pipeline: {
        name: 'default fish',
        pipe: 'detector_default_fish.pipe',
        type: 'detector',
        folderId: null,
      },
    });

    expect(query).toContain('folderId=abc123');
    expect(query).toContain('pipeline=%7B');
    expect(query).not.toContain('pipeline%5Bname%5D');
    expect(decodeURIComponent(query.split('&')[1].split('=')[1]).replace(/\+/g, ' ')).toEqual(
      JSON.stringify({
        name: 'default fish',
        pipe: 'detector_default_fish.pipe',
        type: 'detector',
        folderId: null,
      }),
    );
  });

  it('serializes array params with bracket suffix', () => {
    const query = legacyGirderParamsSerializer({
      statuses: [1, 2, 3],
    });

    expect(query).toBe('statuses[]=1&statuses[]=2&statuses[]=3');
  });
});
