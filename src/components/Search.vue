<script>
import { useDebounceCounter } from '@/composables';
import { formatUsername, getResourceIcon } from '@/utils';
import { useElementBounding } from '@vueuse/core'
import { computed, inject, ref, watch, useTemplateRef, reactive } from 'vue';

export const SearchModeOptions = ['prefix', 'text'];
const DefaultSearchModeOption = SearchModeOptions[0];

export const SearchTypeOptions = ['user', 'folder', 'item'];
const DefaultSearchTypes = SearchTypeOptions;

export default {
  name: 'GirderSearch',

  props: {
    hideSearchIcon: { type: Boolean, default: false },
    hideOptionsMenu: { type: Boolean, default: false },
    maxQuickResults: { type: Number, default: 6 },
    placeholder: { type: String, default: null },
    searchModeOptions: { type: Array, default: () => SearchModeOptions },
    searchMode: { type: String, default: null },
    searchTypeOptions: { type: Array, default: () => SearchTypeOptions },
    searchTypes: { validator: (val) => Array.isArray(val) || val === null, default: null },
    showMore: { type: Boolean, default: false },
  },

  emits: ['update:searchMode', 'update:searchTypes', 'select', 'error', 'moreResults'],

  setup(props, ctx) {
    // ---- Injected client ----
    const { rest } = inject('girder');
    
    // ---- State ----
    const searchField = reactive({
      name: `girder-search-${Math.random()}`,
      width: 0,
      bottom: 0,
      left: 0,
    });
    const bounding = useElementBounding(useTemplateRef(searchField.name));
  
    const searchText = ref(null);
    const internalSearchMode = ref(props.searchMode || DefaultSearchModeOption);
    const internalSearchTypes = ref(props.searchTypes || DefaultSearchTypes);
    const searchResults = ref([]);
    const openSearchResults = ref(false);

    // ---- Composables ----
    const { flag, inc, dec } = useDebounceCounter()

    // ---- Computed ----
    const loading = computed(() => flag.value);
    const quickResults = computed(() => searchResults.value.slice(0, props.maxQuickResults));
    const searchParams = computed(() => {
      return { q: searchText.value, mode: internalSearchMode.value, types: JSON.stringify(internalSearchTypes.value), limit: props.maxQuickResults + 1 };}
    );

    // ---- Methods ----
    async function computeSearchResults() {
      let results = [];
      inc();
      try {
        if (searchText.value) {
          openSearchResults.value = true;
          const { data } = await rest.get('resource/search', {
            params: searchParams.value,
          });
          results = [].concat(...internalSearchTypes.value.map((t) => data[t]));
        } else {
          openSearchResults.value = false;
        }
      } catch (err) {
        ctx.emit('error', err.message || 'Unknown error during search');
      }
      dec();
      searchResults.value = results;
    }

    function selectResult(result) {
      searchText.value = null;
      ctx.emit('select', result);
    }

    // ---- Watchers ----
    watch(
      () => props.searchMode,
      (val) => {
        internalSearchMode.value = val;
      },
    );
    watch(
      () => props.searchTypes,
      (val) => {
        internalSearchTypes.value = val;
      },
    );
    watch(
      () => [
        bounding.width.value,
        bounding.bottom.value,
        bounding.left.value
      ],
      ([width, bottom, left]) => {
        searchField.width = width;
        searchField.bottom = bottom;
        searchField.left = left;
      },
      { immediate: true }
    );

    return {
      internalSearchMode,
      internalSearchTypes,
      loading,
      openSearchResults,
      quickResults,
      searchField,
      searchParams,
      searchText,
      computeSearchResults,
      formatUsername,
      getResourceIcon,
      selectResult,
    };
  },
};
</script>

<template>
  <div class="data-search">
    <v-text-field
      :ref="searchField.name"
      v-model="searchText"
      :placeholder="placeholder"
      variant="solo-filled"
      flat
      hide-details
      clearable
      prepend-inner-icon="$search"
      :loading="loading"
      @update:model-value="computeSearchResults"
      @update:focused="val => {if (val && !!searchText) { openSearchResults=true }}"
    />
    <v-menu
      v-model="openSearchResults"
      :target="[searchField.left, searchField.bottom]"
      stick-to-target
      offset="12"
      location="bottom"
      :width="searchField.width"
    >
      <v-list>
        <v-list-item
          v-for="result in quickResults"
          :key="result._id"
          :title="result.name || formatUsername(result)"
          @click="selectResult(result)"
        >
          <template #prepend>
            <v-icon :icon="getResourceIcon(result)" />
          </template>
        </v-list-item>
        <v-list-item
          v-if="searchText && quickResults.length === 0"
          :title="`No results found for query '${searchText}'`"
          subtitle="Modify search parameters or refine your query"
        >
          <template #prepend>
            <v-icon icon="$alert" />
          </template>
        </v-list-item>
        <v-list-item
          v-if="showMore && searchResults.length > maxQuickResults"
          title="Show more results"
          @click="$emit('moreResults', searchParams)"
        >
          <template #prepend>
            <v-icon icon="$more" />
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
      icon
      variant="flat"
    >
      <v-icon icon="$settings" />
      <v-menu
        v-if="!hideOptionsMenu"
        activator="parent"
        :close-on-content-click="false"
        offset="12"
        stick-to-target
        @update:model-value="val => {if (!val) computeSearchResults()}"
      >
        <v-card>
          <div class="pa-3 d-flex flex-column align-center">
            <v-btn-toggle
              v-model="internalSearchMode"
              mandatory
              @update:model-value="$emit('update:searchMode', $event);"
            >
              <v-btn
                v-for="mode in searchModeOptions"
                :key="mode"
                :text="mode"
                :value="mode"
                size="small"
              />
            </v-btn-toggle>
            <v-divider class="my-3" />
            <v-btn-toggle
              v-model="internalSearchTypes"
              multiple
              @update:model-value="$emit('update:searchTypes', $event);"
            >
              <v-btn
                v-for="searchType in searchTypeOptions"
                :key="searchType"
                :text="searchType"
                :value="searchType"
                size="small"
              />
            </v-btn-toggle>
          </div>
        </v-card>
      </v-menu>
    </v-btn>
  </div>
</template>

<style lang="scss">
.data-search {
  display: flex;
  align-items: center;
}
</style>