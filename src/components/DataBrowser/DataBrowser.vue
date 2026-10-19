<script>
import { ref, computed, watch } from 'vue';
import GirderDataTable from './DataTable.vue';
import useDataBrowser from '@/composables/dataBrowser';
import {
  createLocationValidator,
  getLocationType,
  isRootLocation,
} from '@/utils';

export default {
  name: "GirderDataBrowser",

  components: {
    GirderDataTable,
  },

  props: {
    draggable: { type: Boolean, default: false },
    location: {
      type: Object,
      required: true,
      validator: createLocationValidator(true),
    },
    selectable: { type: Boolean, default: false },
    rootLocationDisabled: { type: Boolean, default: false },
    selected: { type: Array, default: () => [] },
    options: {type: Object, default: () => ({
        itemsPerPage: 10,
        page: 1
      })
    },
    itemsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
    // Object with count() and list() methods, see createRestDataSource.
    // Read once when the component is created.
    dataSource: { type: Object, default: null },
  },

  emits: [
    'drag',
    'dragEnd',
    'dragStart',
    'drop',
    'rowRightClick',
    'rowClick',
    'update:location',
    'update:options',
    'update:selected',
  ],

  setup(props, ctx) {
    // ---- Validation ----
    if (!createLocationValidator(!props.rootLocationDisabled)(props.location)) {
      if (!props.rootLocationDisabled) {
        throw new Error(
          'Location is not valid: must not be empty and have an _id and cannot be root',
        );
      }
      throw new Error(
        'Location is not valid: must not be empty and have an _id',
      );
    }

    // ---- State ----
    const internalSelected = ref(props.selected);
    const internalOptions = ref(props.options);

    const {
      rows,
      loading: rowsLoading,
      counts,
      serverItemsLength,
      refresh: refreshRows,
    } = useDataBrowser({
      location: () => props.location,
      options: internalOptions,
      source: props.dataSource || undefined,
    });

    // ---- Computed ----
    const isSelectable = computed(
      () =>
        props.selectable &&
        props.location &&
        !isRootLocation(props.location),
    );

    // ---- Methods ----
    function rowClick(row) {
      ctx.emit('rowClick', row, props.location);
      if (getLocationType(row) !== 'item') {
        changeLocation(row);
      }
    }

    function changeLocation(newLocation) {
      const oldLocation = props.location;
      if (
        oldLocation._id !== newLocation._id ||
        getLocationType(oldLocation) !== getLocationType(newLocation)
      ) {
        ctx.emit('update:location', newLocation);
      }
    }

    function refresh() {
      internalSelected.value = [];
      refreshRows();
    }

    // ---- Watchers ----
    watch(
      () => props.location,
      (location) => {
        if (createLocationValidator(!props.rootLocationDisabled)(location)) {
          internalSelected.value = [];
        }
      },
    );

    watch(
      () => props.selected,
      (val) => {
        internalSelected.value = val;
      },
    );

    watch(
      () => props.options,
      (val) => {
        internalOptions.value = val;
      },
    );

    return {
      internalOptions,
      rows,
      rowsLoading,
      counts,
      serverItemsLength,
      isSelectable,
      internalSelected,
      changeLocation,
      rowClick,
      refresh,
    };
  },
};
</script>

<template>
  <girder-data-table
    v-model:selected="internalSelected"
    v-model:options="internalOptions"
    :draggable="draggable"
    :rows="rows"
    :server-items-length="serverItemsLength"
    :loading="rowsLoading"
    :selectable="isSelectable"
    :items-per-page-options="itemsPerPageOptions"
    class="data-browser"
    @row-click="rowClick"
    @row-right-click="$emit('rowRightClick', $event)"
    @drag="$emit('drag', $event)"
    @drag-start="$emit('dragStart', $event)"
    @drag-end="$emit('dragEnd', $event)"
    @drop="$emit('drop', $event)"
    @update:selected="$emit('update:selected', $event)"
    @update:options="$emit('update:options', $event)"
  >
    <template #header>
      <slot
        v-bind="{ location, changeLocation, rootLocationDisabled }"
        name="breadcrumb"
      />
      <v-spacer />
      <slot name="headerwidget" />
    </template>
    <template #row="props">
      <slot
        v-bind="props"
        name="row"
      />
    </template>
  </girder-data-table>
</template>
