import { formatSize } from './formatHelpers';
import { getLocationType, getResourceIcon, getSingularLocationTypeName } from './girderHelpers';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDPOINT = 'item';

function emptyCounts() {
  return {
    nFolders: 0,
    nItems: 0,
    nUsers: 0,
    nCollections: 0,
  };
}

/**
 * Data source for useDataBrowser and GirderDataBrowser that reads the
 * hierarchy from the Girder REST API.
 *
 * A data source is an object with two methods:
 * - `count(location)` resolves to an object of counts for the location;
 *   the total number of rows is the sum of its values.
 * - `list(location, { page, itemsPerPage, counts })` resolves to the rows of
 *   the requested page. `counts` is the last result of `count()`.
 *
 * @param {import('./restClient').default} rest
 */
export default function createRestDataSource(rest) {
  async function listFolderRows(location, { page, itemsPerPage, counts }) {
    const { nFolders, nItems } = counts;

    let folderNotPublic = false;
    if (!location.created && location._modelType === 'folder') {
      folderNotPublic = !(await rest.get(`folder/${location._id}`)).data.public;
    }

    const promises = [];

    const folderOffset = itemsPerPage === -1 ? 0 : (page - 1) * itemsPerPage;

    const foldersLeft = Math.max(nFolders - folderOffset, 0);
    if (foldersLeft > 0) {
      promises.push(
        rest.get(GIRDER_FOLDER_ENDPOINT, {
          params: {
            parentType: location._modelType,
            parentId: location._id,
            limit: itemsPerPage === -1 ? 0 : itemsPerPage,
            offset: folderOffset,
          },
        }),
      );
    }

    const itemOffset = Math.max(folderOffset - nFolders, 0);
    const itemsLeft = Math.max(nItems - itemOffset, 0);

    if (itemsLeft > 0 && (itemsPerPage === -1 || itemsPerPage - foldersLeft > 0)) {
      promises.push(
        rest.get(GIRDER_ITEM_ENDPOINT, {
          params: {
            folderId: location._id,
            limit: itemsPerPage === -1 ? 0 : itemsPerPage - foldersLeft,
            offset: itemOffset,
          },
        }),
      );
    }

    return (await Promise.all(promises))
      .flatMap((r) => r.data)
      .map((item) => ({
        ...item,
        humanSize: item.size ? formatSize(item.size) : '',
        icon: getResourceIcon(item),
        notPublic: item._modelType === 'folder' ? !item.public : folderNotPublic,
      }));
  }

  async function listCollectionOrUserRows(type, { page, itemsPerPage }) {
    const { data } = await rest.get(type, {
      params: {
        limit: itemsPerPage >= 0 ? itemsPerPage : null,
        offset: (page - 1) * itemsPerPage,
      },
    });

    return data.map((item) => ({
      ...item,
      name:
        item._modelType === 'user'
          ? `${item.firstName} ${item.lastName}`
          : item.name,
      humanSize: item.size ? formatSize(item.size) : '',
      icon: getResourceIcon(item),
    }));
  }

  function rootRows() {
    const rows = [{ type: 'collections', name: 'Collections', icon: '$collection' }];
    if (rest.user) {
      rows.push({ type: 'users', name: 'Users', icon: '$user' });
    }
    return rows;
  }

  async function count(location) {
    const base = emptyCounts();
    const type = getLocationType(location);

    if (['folder', 'user', 'collection'].includes(type)) {
      const { data } = await rest.get(`${type}/${location._id}/details`);
      return {
        ...base,
        nFolders: data.nFolders || 0,
        nItems: data.nItems || 0,
      };
    }

    if (type === 'users' || type === 'collections') {
      const { data } = await rest.get(`${getSingularLocationTypeName(location)}/details`);
      const key = Object.keys(data)[0];
      return { ...base, [key]: Object.values(data)[0] };
    }

    if (type === 'root') {
      return { ...base, nUsers: 1, nCollections: 1 };
    }

    return base;
  }

  async function list(location, { page, itemsPerPage, counts }) {
    if (counts.nFolders || counts.nItems) {
      return listFolderRows(location, { page, itemsPerPage, counts });
    }

    const type = getLocationType(location);
    if (['users', 'collections'].includes(type)) {
      return listCollectionOrUserRows(getSingularLocationTypeName(location), {
        page,
        itemsPerPage,
      });
    }

    if (type === 'root') {
      return rootRows();
    }

    return [];
  }

  return { count, list };
}
