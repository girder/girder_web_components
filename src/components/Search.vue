
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
  },
  inject: ['girderRest'],
  data() {
    return {
      searchText: '',
      searchMode: 'prefix',
      searchTypes: ['user', 'folder', 'item'],
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
        types: JSON.stringify(this.searchTypes),
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
            results = [].concat(...this.searchTypes.map(t => data[t]));
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
  v-icon.mdi-24px(color="white") {{ $vuetify.icons.values.search }}
  v-menu.mx-3(
      offset-y,
      content-class="girder-searchbar-menu",
      transition="slide-y-transition"
      :open-on-click="false",
      :value="searchText",
      :nudge-bottom="6")
    template(#activator="{ on }")
      v-text-field(v-on="on", v-model="searchText", light, solo, hide-details, clearable)
    v-list(dense)
      v-list-item(
          v-show="!loading",
          v-for="r in quickResults",
          @click="$emit('select', r)",
          :key="r._id")
        v-list-item-action
          v-icon {{ $vuetify.icons.values[r._modelType] }}
        v-list-item-content
          v-list-item-title {{ r.name || formatUsername(r) }}
      v-list-item(v-show="searchText && quickResults.length === 0 && !loading")
        v-list-item-action
          v-icon {{ $vuetify.icons.values.alert }}
        v-list-item-content
          v-list-item-title No results found for query '{{ searchText }}'
          v-list-item-subtitle Modify search parameters or refine your query.
      v-list-item(v-show="!loading && showMore && searchResults.length > maxQuickResults",
          @click="$emit('moreresults', searchParams)")
        v-list-item-action
          v-icon {{ $vuetify.icons.values.more }}
        v-list-item-content
          v-list-item-title More
      //- Skeleton search results shown as "loading" animation
      v-list-item(
          v-show="loading",
          v-for="i in (maxQuickResults + (showMore ? 1 : 0))",
          :key="`skeleton-${i}`")
        v-list-item-action
          v-icon.grey--text.text--lighten-1 {{ $vuetify.icons.values.circle }}
        v-list-item-content
          v-list-item-title.skeleton.skeleton--text.mb-2(
              :style="{ width: (60 + (4 * (i % 3))) + '%', height: '10px' }")
          v-list-item-subtitle.skeleton.skeleton--text(
              :style="{ width: (45 - (4 * (i % 2))) + '%', height: '6px' }")
  v-menu(
      v-model="searchOptionsMenu",
      offset-y,
      left,
      content-class="girder-search-arrow-menu",
      :close-on-content-click="false")
    template(#activator="{ on }")
      v-btn(icon, v-on="on")
        v-icon.mdi-24px {{ $vuetify.icons.values.settings }}
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
