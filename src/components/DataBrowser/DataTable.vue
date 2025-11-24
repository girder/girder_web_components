<script>
  import { computed } from 'vue'
import { getLocationType, isRootLocation } from '@/utils';

export default {
  name: 'GirderDataTable',

  props: {
    rows: {type: Array, required: true},
    serverItemsLength: {type: Number, required: true},
    draggable: {type: Boolean, default: false},
    loading: {type: Boolean, default: false},
    options: {type: Object, default: () => ({
      itemsPerPage: 10,
        page: 1
      })
    },
    selectable: {type: Boolean, default: false},
    selected: {type: Array, default: () => []},
  },

  emits: [
    'drag',
    'dragEnd',
    'dragStart',
    'rowRightClick',
    'rowClick',
    'update:options',
    'update:selected',
  ],

  setup(props, ctx) {
    const selectedIds = computed(() => props.selected.map(item => item._id));
  
    // ---- Methods ----
    function toggleSelect(rowProps) {
      let internalSelected = props.selected;
      if (rowProps.isSelected(rowProps.internalItem)) {
        // remove item
        internalSelected = internalSelected.filter(i => i._id !== rowProps.item._id);
        rowProps.toggleSelect(rowProps.internalItem, rowProps.index, false);
      } else {
        // add item
        internalSelected.push(rowProps.item);
        rowProps.toggleSelect(rowProps.internalItem, rowProps.index, true);
      }
      ctx.emit('update:selected', internalSelected)
    }

    function toggleSelectAll(topProps) {
      ctx.emit('update:selected', topProps.allSelected ? [] : topProps.items);
    }
  
    function handleRowClick({ shiftKey }, rowProps) {
      if (props.selectable && shiftKey) {
        toggleSelect(rowProps);
      } else {
        ctx.emit('rowClick', rowProps.item);
      }
    }

    function getRowClass(item) {
      const rowSelectable =
        (!props.selectable && getLocationType(item) === 'folder') ||
        isRootLocation(item) ||
        getLocationType(item) === 'user';

      return {
        'select-cursor': rowSelectable,
        'not-public': item.notPublic,
      };
    }

    function getItemClass(item) {
      return {
        'select-cursor': getLocationType(item) !== 'item',
      };
    }

    function emitDrag(eventName, event, items) {
      const modelListString = JSON.stringify(
        items.map(({ item }) => ({
          _id: item._id,
          _modelType: item._modelType,
        })),
      );

      event.dataTransfer.setData(
        'application/x-girder-items',
        modelListString,
      );

      ctx.emit(eventName, { event, items });
    }

    return {
      getLocationType,
      isRootLocation,
      selectedIds,
      handleRowClick,
      toggleSelect,
      toggleSelectAll,
      getRowClass,
      getItemClass,
      emitDrag,
    };
  },
};
</script>

<template>
  <v-data-table-server
    :model-value="selectedIds"
    :items="rows"
    :items-length="serverItemsLength"
    :loading="loading"
    :items-per-page="options.itemsPerPage"
    :page="options.page"
    hover
    item-value="_id"
    show-select
    hide-default-header
    class="data-table-widget"
    @update:options="val => $emit('update:options', val)"
  >
    <template #top="topProps">
      <div class="data-table-header">
        <v-checkbox
          v-if="selectable"
          :model-value="topProps.allSelected"
          :indeterminate="topProps.someSelected && !topProps.allSelected"
          hide-details
          color="accent"
          @update:model-value="toggleSelectAll(topProps)"
        />
        <v-divider
          v-if="selectable"
          class="ma-3"
          vertical
        />
        <slot name="header" />
      </div>
    </template>

    <template #item="props">
      <tr
        :key="props.item._id"
        :draggable="draggable"
        :active="props.isSelected(props.internalItem)"
        :class="getRowClass(props.item)"
        @drag="emitDrag('drag', $event, [props])"
        @drags-tart="emitDrag('dragStart', $event, [props])"
        @drag-end="emitDrag('dragEnd', $event, [props])"
      >
        <td
          v-if="selectable"
          style="width: 65px"
        >
          <v-checkbox
            :model-value="props.isSelected(props.internalItem)"
            hide-details
            @update:model-value="toggleSelect(props)"
          />
        </td>

        <td
          @contextmenu="$emit('rowRightClick', { row: props.item, event: $event })"
          @click="handleRowClick($event, props)"
        >
          <span
            :class="getItemClass(props.item)"
          >
            <v-icon
              :color="props.isSelected(props.internalItem) ? 'accent' : undefined"
              class="pr-2"
              :icon="props.item.icon"
            />

            <slot
              name="row"
              v-bind="props"
            >
              {{ props.item.name }}
            </slot>
          </span>
        </td>

        <td class="text-right">
          {{ props.item.humanSize }}
        </td>
      </tr>
    </template>

    <template #no-data>
      <div class="text-center">
        No Data Available
      </div>
    </template>

    <template #no-results>
      <div class="text-center">
        No Data Available
      </div>
    </template>
  </v-data-table-server>
</template>

<style scoped lang="scss">
.data-table-widget {
  cursor: default;

  :deep(.v-data-table__progress .v-progress-linear) {
    position: absolute;
  }

  :deep(.data-table-header) {
    padding-left: 16px;
    padding-right: 16px;
    height: 56px;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: rgb(var(--v-theme-surface-light));
  }
}

</style>