<script>
import { getLocationType, isRootLocation } from '../../utils/locationHelpers';

export default {
  props: {
    draggable: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    selectable: {
      type: Boolean,
      required: true,
    },
    serverItemsLength: {
      type: Number,
      required: true,
    },
    value: {
      type: Array,
      default: () => [],
    },
    itemsPerPageOptions: {
      type: Array,
      default: () => ([10, 25, 50]),
    },
  },
  data() {
    return { lastCheckBoxIdx: null };
  },
  methods: {
    getLocationType,
    isRootLocation,
    handleRowSelect({ shiftKey }, props) {
      if (this.selectable) {
        props.isSelected = !props.isSelected;
        if (shiftKey && this.lastCheckBoxIdx !== null) {
          const [start, end] = [this.lastCheckBoxIdx, props.index + 1].sort();
          const newlySelectedRows = this.rows
            .slice(start, end)
            .filter((row) => this.value.find((el) => el._id === row._id) === undefined);
          this.$emit('input', newlySelectedRows.concat(this.value));
        }
        this.lastCheckBoxIdx = props.index;
      } else {
        this.$emit('rowclick', props.item);
      }
    },
    getRowClass(item) {
      const rowSelectable = (!this.selectable && getLocationType(item) === 'folder')
        || isRootLocation(item)
        || getLocationType(item) === 'user';
      return { 'select-cursor': rowSelectable, 'not-public': item.notPublic };
    },
    getItemClass(item) {
      const itemSelectable = getLocationType(item) !== 'item';
      return { 'select-cursor': itemSelectable };
    },
  },
};
</script>

<template>
  <v-data-table
    :headers-length="4"
    :value="value"
    :options="options"
    :footer-props="{'items-per-page-options': itemsPerPageOptions}"
    :items="rows"
    :server-items-length="serverItemsLength"
    :loading="loading ? 'accent' : false"
    class="girder-data-table"
    show-select="show-select"
    hide-default-header="hide-default-header"
    item-key="_id"
    @input="$emit('input', $event)"
    @update:options="$emit('update:options', $event)"
  >
    <template #header="vDataTableHeaderProps">
      <slot
        v-bind="vDataTableHeaderProps"
        name="header"
      />
    </template>
    <template #item="props">
      <tr
        :key="props.item._id"
        :draggable="draggable"
        :active="props.isSelected"
        :class="getRowClass(props.item)"
        class="itemRow"
        @click="handleRowSelect($event, props)"
        @drag="$emit('drag', { items: [props], event: $event })"
        @dragstart="$emit('dragstart', { items: [props], event: $event })"
        @dragend="$emit('dragend', { items: [props], event: $event })"
        @drop="$emit('drop', { items: [props], event: $event })"
      >
        <td
          v-if="selectable"
          class="pl-3 pr-0"
        >
          <v-checkbox
            :input-value="props.isSelected"
            accent="accent"
            hide-details="hide-details"
            @change="props.select"
          />
        </td>
        <td
          class="pl-3"
          colspan="2"
          @contextmenu="$emit('row-right-click', props.item, $event)"
        >
          <span
            :class="getItemClass(props.item)"
            class="text-container nobreak"
            @click.stop="$emit('rowclick', props.item)"
          >
            <v-icon
              :color="props.isSelected ? 'accent' : ''"
              class="pr-2"
            >{{ $vuetify.icons.values[props.item.icon] }}</v-icon>
            {{ props.item.name }}
            <slot
              v-bind="props"
              name="row-widget"
            />
          </span>
        </td>
        <td class="text-right nobreak">
          {{ props.item.humanSize }}
        </td>
      </tr>
    </template>
    <template #no-data="">
      <div
        class="text-center"
        width="100%"
      >
        No Data Available
      </div>
    </template>
    <template #no-results="">
      <div
        class="text-center"
        width="100%"
      >
        No Data Available
      </div>
    </template>
  </v-data-table>
</template>


<style lang="scss">
.girder-data-table {
  cursor: default;
  overflow: hidden; // for top round corners

  .select-cursor {
    opacity: 0.8;

    &:hover {
      opacity: 1;
      cursor: pointer;
    }
  }

  &.v-data-table {
    tr {
      .v-input--selection-controls.v-input--checkbox {
        margin: 0 10px;
        border-right: 1.5px solid gray;
      }

      .text-container i {
        vertical-align: bottom;
      }

      .nobreak {
        white-space: nowrap;
      }
    }

    td:first-child {
      padding: 0;
    }

    &.theme--light {
      tr {
        &.itemRow[active],
        &.itemRow:hover {
          // $light-blue.lighten-5
          background: #e1f5fe !important;
        }
      }
    }
  }

  .v-data-table__progress .v-progress-linear {
    position: absolute;
  }
}
</style>
