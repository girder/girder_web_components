import { computed, isRef, ref, unref } from 'vue';
import { getLocationType } from '@/utils';

/**
 * Headless selection of Girder models.
 *
 * The selection is stored in `selected`, which is never mutated in place:
 * every change assigns a new array. Passing a writable computed therefore
 * allows a component to emit `update:selected` instead of keeping its own state.
 *
 * @param {import('vue').Ref<Object[]>|Object[]} [selected] - Initial selection or a ref holding it.
 * @param {Object} [params]
 * @param {import('vue').MaybeRef<boolean>} [params.multiple=true] - Allow more than one selected model.
 * @param {import('vue').MaybeRef<string[]|null>} [params.selectableTypes=null]
 *   Restrict selection to these model types (for instance `['item']`). All types when null.
 */
export default function useSelection(selected = [], {
  multiple = true,
  selectableTypes = null,
} = {}) {
  const model = isRef(selected) ? selected : ref(selected);

  const selectedIds = computed(() => model.value.map((item) => item._id));

  function canSelect(item) {
    const types = unref(selectableTypes);
    return !types || types.includes(getLocationType(item));
  }

  function isSelected(item) {
    return selectedIds.value.includes(item._id);
  }

  function select(item) {
    if (!canSelect(item) || isSelected(item)) {
      return;
    }
    model.value = unref(multiple) ? [...model.value, item] : [item];
  }

  function deselect(item) {
    model.value = model.value.filter((i) => i._id !== item._id);
  }

  function toggle(item) {
    if (isSelected(item)) {
      deselect(item);
    } else {
      select(item);
    }
  }

  function allSelected(items) {
    const selectable = items.filter(canSelect);
    return selectable.length > 0 && selectable.every(isSelected);
  }

  function toggleAll(items) {
    if (!unref(multiple)) {
      return;
    }
    model.value = allSelected(items) ? [] : items.filter(canSelect);
  }

  function clear() {
    model.value = [];
  }

  return {
    selected: model,
    selectedIds,
    canSelect,
    isSelected,
    select,
    deselect,
    toggle,
    allSelected,
    toggleAll,
    clear,
  };
}
