export default function (allowRoot) {
  return (location) => {
    if (!location) {
      return false;
    }
    const { type, _modelType, _id } = location;
    if (['user', 'collection', 'folder'].indexOf(_modelType) !== -1 && _id) {
      return 'model';
    }
    if (allowRoot && ['collections', 'users', 'root'].indexOf(type) !== -1) {
      return 'root';
    }
    return false;
  };
}
