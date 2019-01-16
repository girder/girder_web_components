<script>
export default {
  props: {
    rows: {
      type: Array,
      required: true,
    },
    pagination: {
      type: Object,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    value: {
      type: Array,
      default: () => [],
    },
    selectEnabled: {
      type: Boolean,
      required: true,
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
    :items="rows",,
    :total-items="totalItems",
    :loading="loading ? 'accent' : false",
    item-key="_id")

  template(slot="headers", slot-scope="props")
    slot(name="header", :props="props")

  template(slot="items", slot-scope="props")
    tr.itemRow(:active="props.selected",
        @click="if (selectEnabled) props.selected = !props.selected;",
        :key="props.index")
      td.pl-3.pr-0(v-if="selectEnabled")
        v-checkbox.secondary--text.text--darken-1.pr-2(
            :input-value="props.selected", accent, hide-details)
      td.pl-3(colspan="2")
        span.text-container.secondary--text.text--darken-3.nobreak(
            :class="{selectable: props.item._modelType !== 'item'}",
            @click.stop="$emit('rowclick', props.item)")
          v-icon.pr-2(:color="props.selected ? 'accent' : ''") {{ $vuetify.icons[props.item.icon] }}
          | {{ props.item.name }}
      td.text-xs-right.secondary--text.text--darken-3.nobreak {{ props.item.size }}

  template(slot="no-data")
    td(v-if="selectEnabled")
    td.text-xs-center No Data Available
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
  }

  .theme--light.v-icon {
    color: inherit;
  }

  .v-datatable__progress .v-progress-linear {
    position: absolute;
  }
}
</style>
