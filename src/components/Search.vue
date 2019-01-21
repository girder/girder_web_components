
<script>
export default {
  props: {
    maxQuickResults: {
      type: Number,
      default: 6,
    },
    showMore: {
      type: Boolean,
      default: true,
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      errText: '',
      searchText: '',
      searchMode: 'prefix',
      searchTypes: ['user', 'folder', 'item'],
      /* options */
      searchOptionsMenu: false,
    };
  },
  computed: {
    quickResults() {
      return this.searchResults.slice(0, this.maxQuickResults);
    },
  },
  asyncComputed: {
    searchResults: {
      default: [],
      async get() {
        this.errText = '';
        try {
          if (this.searchText) {
            const { data } = await this.girderRest.get('resource/search', {
              params: {
                q: this.searchText,
                mode: this.searchMode,
                types: JSON.stringify(this.searchTypes),
                // add 1 to know if total possible results > maxQuickResults
                limit: this.maxQuickResults + 1,
              },
            });
            return [].concat(...this.searchTypes.map(t => data[t]));
          }
        } catch (err) {
          this.errText = err.message || 'Unknown error during search.';
        }
        return [];
      },
    },
  },
  methods: {
    formatUsername(user) {
      return `${user.firstName} ${user.lastName} (${user.login})`;
    },
  },
};
</script>

<template lang="pug">
v-layout.girder-searchbar(row, align-center)
  v-icon.mdi-24px(color="white") {{ $vuetify.icons.search }}
  v-menu.grow.mx-3(
      offset-y,
      content-class="girder-searchbar",
      :value="searchText",
      :nudge-bottom="6")
    v-text-field(
      slot="activator", v-model="searchText", light, solo, hide-details, clearable)
    v-list
      v-list-tile(v-for="r in quickResults", @click="$emit('select', r)", :key="r._id")
        v-list-tile-action
          v-icon {{ $vuetify.icons[r._modelType] }}
        v-list-tile-content
          v-list-tile-title {{ r.name || formatUsername(r) }}
      v-list-tile(v-if="quickResults.length === 0")
        v-list-tile-action
          v-icon {{ $vuetify.icons.alert }}
        v-list-tile-content
          v-list-tile-title No results found for query '{{ searchText }}'
          v-list-tile-sub-title Try an advanced search or refine your query.
      v-list-tile(v-else-if="showMore && searchResults.length > maxQuickResults",
          @click="$emit('more-results', searchText)")
        v-list-tile-action
          v-icon {{ $vuetify.icons.more }}
        v-list-tile-content
          v-list-tile-title more
  v-menu(
      offset-y,
      left,
      content-class="girder-search-arrow-menu",
      :close-on-content-click="false",
      v-model="searchOptionsMenu")
    v-btn(icon, slot="activator")
      v-icon.mdi-24px {{ $vuetify.icons.settings }}
    v-card
      v-card-actions
        v-layout(column)
          v-radio-group.my-2(hide-details, v-model="searchMode")
            v-radio.mb-1(key="text", label="Text Search", value="text")
            v-radio(key="prefix", label="Prefix Search", value="prefix")
          v-divider
          v-checkbox.mt-2(hide-details, v-model="searchTypes", label="User", value="user")
          v-checkbox.mt-1(hide-details, v-model="searchTypes", label="Folder", value="folder")
          v-checkbox.mt-1.mb-1(hide-details, v-model="searchTypes", label="Item", value="item")
</template>

<style lang="scss">
.girder-searchbar {
  .v-text-field.v-text-field--solo .v-input__control {
    min-height: 40px;
  }

  .v-list__tile {
    height: 40px;

    .v-list__tile__action {
      min-width: 40px;
    }
  }
}

.girder-search-arrow-menu {
  transform: translateY(10px);
  // Override to make the arrow visible
  overflow: visible;
  contain: inherit;

  // Remove any shadow that is made visible by above style
  :first-child {
    box-shadow: none;
  }

  &::before {
    content: " ";
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid white;
    right: 10px;
    top: -8px;
    position: absolute;
  }
}
</style>
