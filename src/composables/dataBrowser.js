import { computed, inject, isRef, ref, toRef, watch } from 'vue';
import createRestDataSource from '@/utils/restDataSource';

function emptyCounts() {
  return {
    nFolders: 0,
    nItems: 0,
    nUsers: 0,
    nCollections: 0,
  };
}

/**
 * Headless state and data fetching for browsing a Girder hierarchy.
 *
 * It holds no rendering logic: it exposes the rows of the current location,
 * the pagination state and the loading state, so that any UI can render them.
 *
 * @param {Object} params
 * @param {import('vue').MaybeRefOrGetter<Object>} params.location
 *   Current location: a folder, user or collection model, or a root location
 *   such as `{ type: 'root' }`, `{ type: 'collections' }` or `{ type: 'users' }`.
 * @param {import('vue').Ref<{ page: number, itemsPerPage: number }>} [params.options]
 *   Pagination options. `itemsPerPage: -1` means all rows. A ref is created when omitted.
 * @param {{ count: Function, list: Function }} [params.source]
 *   Where rows are read from. Defaults to the Girder REST API through `rest`
 *   (see `createRestDataSource`). A custom source can read them from another
 *   backend, for instance a server that queries Girder on behalf of the page.
 * @param {import('@/utils/restClient').default} [params.rest]
 *   Girder REST client used by the default source. Defaults to the client
 *   provided by the plugin.
 * @param {import('vue').Ref<Object|null>} [params.user]
 *   Current user. Defaults to the user provided by the plugin. Data is
 *   refetched when it changes.
 */
export default function useDataBrowser({
  location,
  options,
  source,
  rest,
  user,
} = {}) {
  const needsInjection = !user || (!source && !rest);
  const injected = needsInjection ? inject('girder', null) : null;
  const client = rest || injected?.rest;
  const dataSource = source || (client && createRestDataSource(client));
  if (!dataSource) {
    throw new Error(
      'useDataBrowser: no data source or Girder REST client was provided or injected',
    );
  }
  const currentUser = user || injected?.user || ref(null);

  const locationRef = toRef(location);
  const optionsRef = isRef(options)
    ? options
    : ref(options || { page: 1, itemsPerPage: 10 });

  // ---- State ----
  const refreshCounter = ref(0);
  const rows = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const counts = ref(emptyCounts());
  let lastRequest = 0;

  // ---- Computed ----
  const serverItemsLength = computed(() =>
    Object.values(counts.value).reduce((a, b) => a + b, 0),
  );

  // ---- Fetching ----
  async function fetchCounts() {
    try {
      counts.value = await dataSource.count(locationRef.value);
    } catch (_err) {
      counts.value = emptyCounts();
    }
  }

  async function updateRows() {
    // Responses of outdated requests are ignored, so that a slow response
    // for a previous location or page cannot overwrite the current rows.
    const request = ++lastRequest;
    loading.value = true;
    error.value = null;
    try {
      const { page, itemsPerPage } = optionsRef.value;
      const result = await dataSource.list(locationRef.value, {
        page,
        itemsPerPage,
        counts: counts.value,
      });
      if (request === lastRequest) {
        rows.value = result;
      }
    } catch (err) {
      if (request === lastRequest) {
        error.value = err;
      }
    } finally {
      if (request === lastRequest) {
        loading.value = false;
      }
    }
  }

  // ---- Methods ----
  function refresh() {
    refreshCounter.value++;
  }

  // ---- Watchers ----
  watch([refreshCounter, locationRef, currentUser], fetchCounts, { immediate: true });

  watch(locationRef, (newLocation) => {
    if (newLocation && optionsRef.value) {
      optionsRef.value.page = 1;
    }
  });

  watch([counts, optionsRef], updateRows);

  return {
    rows,
    loading,
    error,
    counts,
    serverItemsLength,
    options: optionsRef,
    refresh,
  };
}
