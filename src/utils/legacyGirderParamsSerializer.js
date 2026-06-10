/**
 * Serialize query params the way axios 0.x did before the 1.x migration.
 *
 * Axios 1.x encodes nested objects with bracket notation (e.g. pipeline[name]=foo).
 * Girder's jsonParam() decorators expect a single query key whose value is a JSON
 * string (e.g. pipeline={"name":"foo"}), matching axios 0.x behavior and the
 * girder_client integration tests. Without this serializer, endpoints such as
 * dive_rpc/pipeline return HTTP 400 after upgrading to axios 1.x.
 *
 * @see https://github.com/axios/axios/blob/v1.x/MIGRATION_GUIDE.md
 */

function encodeParamValue(val) {
  return encodeURIComponent(val)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']');
}

export default function legacyGirderParamsSerializer(params) {
  const parts = [];

  Object.entries(params).forEach(([key, val]) => {
    if (val === null || val === undefined) {
      return;
    }

    const values = Array.isArray(val) ? val : [val];
    const paramKey = Array.isArray(val) ? `${key}[]` : key;

    values.forEach((value) => {
      let serialized;
      if (value instanceof Date) {
        serialized = value.toISOString();
      } else if (typeof value === 'object') {
        serialized = JSON.stringify(value);
      } else {
        serialized = String(value);
      }
      parts.push(`${encodeParamValue(paramKey)}=${encodeParamValue(serialized)}`);
    });
  });

  return parts.join('&');
}
