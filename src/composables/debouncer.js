import { ref, onBeforeUnmount } from 'vue';
import { DebounceCounter } from '@/utils';

export default function useDebounceCounter(delay = 200) {
  const count = ref(0);
  const flag = ref(false);

  const counter = new DebounceCounter(delay, (val) => {
    flag.value = val;
  });

  const inc = () => {
    counter.inc();
    count.value = counter.count;
  };

  const dec = () => {
    counter.dec();
    count.value = counter.count;
  };

  onBeforeUnmount(() => {
    // safety cleanup
    if (counter.timeout) {
      clearTimeout(counter.timeout);
    }
  });

  return {
    count,
    flag,
    inc,
    dec,
  };
}