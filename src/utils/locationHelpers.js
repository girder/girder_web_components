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

export function getSingularLocationTypeName(location) {
  const locationType = getLocationType(location);
  switch (locationType) {
    case 'collections':
      return 'collection';
    case 'users':
      return 'user';
    default:
      return '';
  }
}

export function createLocationValidator(allowRoot) {
  return (location) => {
    if (!location) {
      return false;
    }
    if (isRootLocation(location)) {
      return allowRoot;
    // eslint-disable-next-line no-else-return
    } else {
      return !!location._id;
    }
  };
}
