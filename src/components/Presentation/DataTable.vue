<script>
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
    pagination: {
      type: Object,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    selectEnabled: {
      type: Boolean,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return { lastCheckBoxIdx: null };
  },
  methods: {
    handleRowSelect({ shiftKey }, props) {
      if (this.selectEnabled) {
        props.selected = !props.selected;
        if (shiftKey && this.lastCheckBoxIdx !== null) {
          const [start, end] = [this.lastCheckBoxIdx, props.index + 1].sort();
          const newlySelectedRows = this.rows
            .slice(start, end)
            .filter(row => this.value.find(el => el._id === row._id) === undefined);
          this.$emit('input', newlySelectedRows.concat(this.value));
        }
        this.lastCheckBoxIdx = props.index;
      } else {
        this.$emit('rowclick', props.item);
      }
    },
  },
};
</script>

<template lang="pug">
v-data-table.girder-data-table(
    select-all,
    :headers-length="4",
    :value="value",
    @input="$emit('input', $event)",
    :pagination="pagination",
    @update:pagination="$emit('update:pagination', $event)",
    :items="rows",
    :total-items="totalItems",
    :loading="loading ? 'accent' : false",
    item-key="_id")

  template(slot="headers", slot-scope="props")
    slot(name="header",
        :all="props.all",
        :indeterminate="props.indeterminate",
        :headers="props.headers")

  template(slot="items", slot-scope="props")
    tr.itemRow(:draggable="draggable", :active="props.selected",
        :class="{ selectable: !selectEnabled }",
        @click="handleRowSelect($event, props)",
        @drag="$emit('drag', { items: [props], event: $event })",
        @dragstart="$emit('dragstart', { items: [props], event: $event })",
        @dragend="$emit('dragend', { items: [props], event: $event })",
        @drop="$emit('drop', { items: [props], event: $event })",
        :key="props.index")
      td.pl-3.pr-0(v-if="selectEnabled")
        v-checkbox.secondary--text.text--darken-1.pr-2(
            :input-value="props.selected", accent, hide-details)
      td.pl-3(colspan="2")
        span.text-container.secondary--text.text--darken-3.nobreak(
            :class="{ selectable: selectEnabled && props.item._modelType !== 'item' }",
            @click.stop="$emit('rowclick', props.item)")
          v-icon.pr-2(:color="props.selected ? 'accent' : ''") {{ $vuetify.icons[props.item.icon] }}
          | {{ props.item.name }}
      td.text-xs-right.secondary--text.text--darken-3.nobreak {{ props.item.size }}

  template(slot="no-data")
    td.text-xs-center(colspan="2", width="100%") No Data Available

  template(slot="no-results")
    td.text-xs-center(colspan="2", width="100%") No Data Available
</template>


<style lang="scss">
.girder-data-table {
  .selectable {
    opacity: 0.8;

    &:hover {
      opacity: 1;
      cursor: pointer;
    }
  }

  .v-table {
    tr {
      &.itemRow[active],
      &.itemRow:hover {
        // $light-blue.lighten-5
        background: #e1f5fe !important;
      }

      &.secondary {
        border-color: inherit !important;
      }

      .v-input--checkbox {
        border-right: 1.5px solid;
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
  }

  .theme--light.v-icon {
    color: inherit;
  }

  .v-datatable__progress .v-progress-linear {
    position: absolute;
  }
}
</style>
