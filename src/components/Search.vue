<template lang="pug">
v-layout.searchbar(row, justify-center, align-center)
  v-icon.mdi-24px.mx-2(color="white") {{ $vuetify.icons.search }}
  v-text-field.searchtext.mx-4(
      light,
      solo,
      hide-details,
      clearable,
      v-model="searchtext")
  v-menu.searchbar(
      bottom,
      offset-y,
      :activator="'.searchtext'",
      :value="searchtext",
      max-width,
      :nudge-bottom="6")
    v-list
      v-list-tile(v-for="r in quickresults", @click="$emit('select', r)", :key="r._id")
        v-list-tile-action
          v-icon {{ $vuetify.icons[r._modelType] }}
        v-list-tile-content
          v-list-tile-title {{ r.name || formatUsername(r) }}
      v-list-tile(v-if="quickresults.length === 0")
        v-list-tile-action
          v-icon {{ $vuetify.icons.alert }}
        v-list-tile-content
          v-list-tile-title No results found for query '{{ searchtext }}'
          v-list-tile-sub-title Try an advanced search or refine your query.
      v-list-tile(
          v-else-if="showMore && searchresults.length > maxQuickResults",
          @click="$emit('more-results', searchtext)")
        v-list-tile-action
          v-icon {{ $vuetify.icons.more }}
        v-list-tile-content
          v-list-tile-title more
  v-menu.searchbar(
      bottom,
      offset-y,
      :close-on-content-click="false",
      :nudge-width="150",
      :nudge-bottom="10",
      :nudge-left="150",
      v-model="searchOptionsMenu")
    v-btn.mx-2(icon, slot="activator")
      v-icon.mdi-24px(color="white") {{ $vuetify.icons.settings}}
    v-card.search-options
      v-card-actions
        v-layout(column)
          v-radio-group.my-2(hide-details, v-model="searchmode")
            v-radio.mb-1(key="text", label="Text Search", value="text")
            v-radio(key="prefix", label="Prefix Search", value="prefix")
          v-divider
          v-checkbox.mt-2(hide-details, v-model="searchtypes", label="User", value="user")
          v-checkbox.mt-1(hide-details, v-model="searchtypes", label="Folder", value="folder")
          v-checkbox.mt-1.mb-1(hide-details, v-model="searchtypes", label="Item", value="item")
</template>

<script>
const endpoint = 'resource/search';

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
      errtext: '',
      searchtext: '',
      searchmodel: null,
      isLoading: false,
      searchresults: null,
      searchmode: 'prefix',
      searchtypes: ['user', 'folder', 'item'],
      /* options */
      searchOptionsMenu: false,
    };
  },
  computed: {
    quickresults() {
      if (this.searchresults) {
        return this.searchresults.slice(0, this.maxQuickResults);
      }
      return [];
    },
  },
  watch: {
    async searchtext(val) {
      this.errtext = '';
      try {
        if (val) {
          const { data } = await this.girderRest.get(endpoint, {
            params: {
              q: val,
              mode: this.searchmode,
              types: JSON.stringify(this.searchtypes),
              limit: this.maxQuickResults + 1,
            },
          });
          this.searchresults = [].concat(...this.searchtypes.map(t => data[t]));
        }
      } catch (err) {
        this.errtext = err.message;
      }
    },
  },
  methods: {
    formatUsername(user) {
      return `${user.firstName} ${user.lastName} (${user.login})`;
    },
  },
};
</script>

<style lang="scss">
.searchbar {
  .v-text-field.v-text-field--solo .v-input__control {
    min-height: 40px;
  }

  .v-list__tile {
    height: 40px;

    .v-list__tile__action,
    .v-list__tile__avatar {
      min-width: 40px;
    }
  }
}
</style>
