<script>
import Vue from 'vue';
import { DebounceCounter } from '../utils';
import { usernameFormatter } from '../utils/mixins';

export const SearchModeOptions = [
  {
    name: 'Prefix Search',
    value: 'prefix',
  },
  {
    name: 'Text Search',
    value: 'text',
  },
];
const DefaultSearchModeOption = SearchModeOptions[0].value;

export const SearchTypeOptions = [
  {
    name: 'User',
    value: 'user',
  },
  {
    name: 'Folder',
    value: 'folder',
  },
  {
    name: 'Item',
    value: 'item',
  },
];
const DefaultSearchTypes = SearchTypeOptions.map((t) => t.value);

export default Vue.extend({
  mixins: [usernameFormatter],
  props: {
    hideSearchIcon: {
      type: Boolean,
      default: false,
    },
    hideOptionsMenu: {
      type: Boolean,
      default: false,
    },
    maxQuickResults: {
      type: Number,
      default: 6,
    },
    placeholder: {
      type: String,
      default: null,
    },
    searchModeOptions: {
      type: Array,
      default: () => SearchModeOptions,
    },
    searchMode: {
      type: String,
      default: null,
    },
    searchTypeOptions: {
      type: Array,
      default: () => SearchTypeOptions,
    },
    searchTypes: {
      validator: (val) => Array.isArray(val) || val === null,
      default: null,
    },
    showMore: {
      type: Boolean,
      default: false,
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      searchText: '',
      lazySearchMode: this.searchMode || DefaultSearchModeOption,
      lazySearchTypes: this.searchTypes || DefaultSearchTypes,
      searchOptionsMenu: false,
    };
  },
  computed: {
    loading() {
      return this.counter.flag;
    },
    quickResults() {
      return this.searchResults.slice(0, this.maxQuickResults);
    },
    searchParams() {
      return {
        q: this.searchText,
        mode: this.internalSearchMode,
        types: JSON.stringify(this.internalSearchTypes),
        // + 1 to determine if total results > maxQuickResults
        limit: this.maxQuickResults + 1,
      };
    },
    internalSearchMode: {
      get() {
        return this.lazySearchMode;
      },
      set(val) {
        this.lazySearchMode = val;
        this.$emit('update:searchMode', val);
      },
    },
    internalSearchTypes: {
      get() {
        return this.lazySearchTypes;
      },
      set(val) {
        this.lazySearchTypes = val;
        this.$emit('update:searchTypes', val);
      },
    },
  },
  watch: {
    searchMode(val) {
      this.lazySearchMode = val || DefaultSearchModeOption;
    },
    searchTypes(val) {
      this.lazySearchTypes = val || DefaultSearchTypes;
    },
  },
  asyncComputed: {
    searchResults: {
      default: [],
      async get() {
        let results = [];
        this.counter.inc();
        try {
          if (this.searchText) {
            const { data } = await this.girderRest.get('resource/search', {
              params: this.searchParams,
            });
            results = [].concat(...this.internalSearchTypes.map((t) => data[t]));
          }
        } catch (err) {
          this.$emit('error', err.message || 'Unknown error during search');
        }
        this.counter.dec();
        return results;
      },
    },
  },
  beforeCreate() {
    this.counter = new DebounceCounter();
  },
  methods: {
    selectResult(result) {
      this.searchText = '';
      this.$emit('select', result);
    },
  },
});
</script>

<template>
  <v-row
    class="align-center girder-searchbar"
    no-gutters
  >
    <v-icon
      v-if="!hideSearchIcon"
      class="mr-3 mdi-24px"
      color="white"
    >
      $vuetify.icons.search
    </v-icon>
    <v-menu
      :open-on-click="false"
      :value="searchText"
      :nudge-bottom="6"
      offset-y
      content-class="girder-searchbar-menu"
      transition="slide-y-transition"
    >
      <template #activator="{ on }">
        <v-text-field
          v-model="searchText"
          :placeholder="placeholder"
          :name="`girder-search-${Math.random()}`"
          solo
          hide-details
          clearable
          auto
          v-on="on"
        />
      </template>
      <v-list dense="dense">
        <v-list-item
          v-for="result in quickResults"
          v-show="!loading"
          :key="result._id"
          @click="selectResult(result)"
        >
          <slot
            v-bind="result"
            name="searchresult"
          >
            <v-list-item-action class="mr-2">
              <v-icon>{{ $vuetify.icons.values[result._modelType] }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ result.name || formatUsername(result) }}</v-list-item-title>
            </v-list-item-content>
          </slot>
        </v-list-item>
        <v-list-item v-show="searchText && quickResults.length === 0 && !loading">
          <slot
            v-bind="{ searchText }"
            name="noresult"
          >
            <v-list-item-action>
              <v-icon>$vuetify.icons.alert</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>No results found for query '{{ searchText }}'</v-list-item-title>
              <v-list-item-subtitle>
                Modify search parameters or refine your query.
              </v-list-item-subtitle>
            </v-list-item-content>
          </slot>
        </v-list-item>
        <v-list-item
          v-show="!loading && showMore && searchResults.length > maxQuickResults"
          @click="$emit('moreresults', searchParams)"
        >
          <v-list-item-action>
            <v-icon>$vuetify.icons.more</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>More</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          v-for="i in Math.round(maxQuickResults / 2)"
          v-show="loading"
          :key="`skeleton-${i}`"
        >
          <v-list-item-action>
            <v-icon class="grey--text text--lighten-1">
              $vuetify.icons.circle
            </v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title
              :style="{ maxWidth: (70 + (4 * (i % 3))) + '%', height: '12px' }"
              class="skeleton skeleton--text mb-2"
            />
            <v-list-item-subtitle
              :style="{ maxWidth: (50 - (4 * (i % 2))) + '%', height: '6px' }"
              class="skeleton skeleton--text"
            />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-menu
      v-if="!hideOptionsMenu"
      v-model="searchOptionsMenu"
      :close-on-content-click="false"
      offset-y
      left
      content-class="girder-search-arrow-menu"
    >
      <template #activator="{ on }">
        <v-btn
          icon="icon"
          v-on="on"
        >
          <v-icon class="mdi-24px">
            $vuetify.icons.settings
          </v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-actions>
          <v-col
            class="pa-0 flex-column"
            no-gutters="no-gutters"
          >
            <v-radio-group
              v-model="internalSearchMode"
              class="my-2"
              hide-details="hide-details"
            >
              <v-radio
                v-for="mode in searchModeOptions"
                :key="mode.value"
                :label="mode.name"
                :value="mode.value"
                class="mb-1"
              />
            </v-radio-group>
            <v-divider />
            <v-checkbox
              v-for="searchType in searchTypeOptions"
              :key="searchType.value"
              v-model="internalSearchTypes"
              :label="searchType.name"
              :value="searchType.value"
              class="mt-1"
              hide-details
            />
          </v-col>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-row>
</template>

<style lang="scss">
.girder-searchbar {
  .v-text-field .v-input__control {
    min-height: 40px;
  }

  .v-menu__activator * {
    cursor: text !important;
  }
}
</style>

<style lang="scss" scoped>
.girder-searchbar-menu {
  .skeleton.skeleton--text {
    background: linear-gradient(270deg, #e0e0e0, #c7c7c7, #e0e0e0);
    background-size: 600% 600%;
    animation: SkeletonShimmer 2s ease infinite;

    @keyframes SkeletonShimmer {
      0% {
        background-position: 0% 51%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 51%;
      }
    }
  }
}

// Consider factor out into common stylesheet if we are to use this elsewhere.
.girder-search-arrow-menu {
  transform: translateY(10px);
  // Override to make the arrow visible
  overflow: visible;
  contain: inherit;

  // Remove any shadow that is made visible by above two style overrides
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
    right: 16px;
    top: -8px;
    position: absolute;
  }

  &.theme--light {
    &::before {
      border-bottom-color: white;
    }
  }

  &.theme--dark {
    &::before {
      border-bottom-color: #424242;
    }
  }
}
</style>
