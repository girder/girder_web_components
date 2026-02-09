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
     
    } else {
      return !!location._id;
    }
  };
}

export function getResourceIcon(resource) {
  const icons = {
    collection: '$collection',
    user: '$user',
    item: '$file',
    group: '$userGroup',
  };

  if (resource._modelType === 'folder') {
    return resource.public ? '$folder' : '$folderNonPublic';
  }

  return icons[resource._modelType];
}
