export function getLocationType(location) {
  return location._modelType || location.type;
}

export function isRootLocation(location) {
  const locationType = getLocationType(location);
  if (['collections', 'users', 'root'].indexOf(locationType) >= 0) {
    return true;
  }
  return false;
}
