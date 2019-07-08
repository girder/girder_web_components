
<script>
import { DebounceCounter } from '../utils';

export default {
  props: {
    maxQuickResults: {
      type: Number,
      default: 6,
    },
    showMore: {
      type: Boolean,
      default: false,
    },
    noSearchIcon: {
      type: Boolean,
      default: false,
    },
    searchTypes: {
      type: Array,
      default: () => ['user', 'folder', 'item'],
      validator(types) {
        return !types.find(type => ['user', 'folder', 'item', 'group'].indexOf(type) === -1);
      },
    },
    textFieldProps: {
      type: Object,
      default: () => ({
        light: true,
        solo: true,
      }),
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      searchText: '',
      searchMode: 'prefix',
      searchTypes_: this.searchTypes,
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
        mode: this.searchMode,
        types: JSON.stringify(this.searchTypes_),
        // + 1 to determine if total results > maxQuickResults
        limit: this.maxQuickResults + 1,
      };
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
            results = [].concat(...this.searchTypes_.map(t => data[t]));
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
    formatUsername(user) {
      return `${user.firstName} ${user.lastName} (${user.login})`;
    },
  },
};
</script>

<template lang="pug">
v-layout.girder-searchbar(row, align-center)
  v-icon.mdi-24px.mr-3(v-if="!noSearchIcon", color="white") {{ $vuetify.icons.search }}
  v-menu.grow.mr-3(
      offset-y, content-class="girder-searchbar-menu", :open-on-click="false",
      :value="searchText", :nudge-bottom="6", transition="slide-y-transition")
    v-text-field(
        slot="activator", v-model="searchText", clearable, hide-details, v-bind="textFieldProps")
    v-list
      v-list-tile(
          v-show="!loading",
          v-for="r in quickResults",
          @click="searchText=''; $emit('select', r);",
          :key="r._id")
        v-list-tile-action
          v-icon {{ $vuetify.icons[r._modelType] }}
        v-list-tile-content
          v-list-tile-title {{ r.name || formatUsername(r) }}
      v-list-tile(v-show="searchText && quickResults.length === 0 && !loading")
        v-list-tile-action
          v-icon {{ $vuetify.icons.alert }}
        v-list-tile-content
          v-list-tile-title No results found for query '{{ searchText }}'
          v-list-tile-sub-title Modify search parameters or refine your query.
      v-list-tile(v-show="!loading && showMore && searchResults.length > maxQuickResults",
          @click="$emit('moreresults', searchParams)")
        v-list-tile-action
          v-icon {{ $vuetify.icons.more }}
        v-list-tile-content
          v-list-tile-title More
      //- Skeleton search results shown as "loading" animation
      v-list-tile(
          v-show="loading",
          v-for="i in [0,1]",
          :key="`skeleton-${i}`")
        v-list-tile-action
          v-icon.grey--text.text--lighten-1 {{ $vuetify.icons.circle }}
        v-list-tile-content
          v-list-tile-title.skeleton.skeleton--text.mb-2(
              :style="{ width: (60 + (4 * (i % 3))) + '%', height: '10px' }")
          v-list-tile-sub-title.skeleton.skeleton--text(
              :style="{ width: (45 - (4 * (i % 2))) + '%', height: '6px' }")
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
          v-checkbox.mt-2(v-for="type of searchTypes",
              :key="type",
              hide-details,
              v-model="searchTypes_",
              :label="type.charAt(0).toUpperCase() + type.slice(1)", :value="type")
</template>

<style lang="scss">
.girder-searchbar {
  .v-text-field .v-input__control {
    min-height: 40px;
  }

  .v-menu__activator .v-text-field__slot input {
    cursor: text !important;
  }
}

.girder-searchbar-menu {
  .v-list__tile {
    height: 40px;

    .v-list__tile__action {
      min-width: 40px;
    }
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
      0% { background-position: 0% 51%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 51%; }
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
    right: 10px;
    top: -8px;
    position: absolute;
  }
}
</style>
