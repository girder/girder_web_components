export function getLocationType(location) {
  return location._modelType || location.type;
}

export function isRootLocation(location) {
  const locationType = getLocationType(location);
  if (['collections', 'users', 'root'].indexOf(locationType) >= 0) {
    return true;
  } else if (['user', 'collection', 'folder'].indexOf(locationType) >= 0) {
    return false;
  }
  throw new Error(`Unrecognized location: ${locationType}`);
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

export function createLocationValidator(allowRooot) {
  return (location) => {
    if (!location) {
      return false;
    }
    try {
      if (isRootLocation(location)) {
        return allowRooot;
      // eslint-disable-next-line no-else-return
      } else {
        return !!location._id;
      }
    } catch (err) {
      return false;
    }
  };
}
