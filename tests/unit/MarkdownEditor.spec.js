import { shallowMount } from '@vue/test-utils';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import Markdown from '@/components/Markdown.vue';
import { flushPromises, girderVue, vuetify } from './utils';

const localVue = girderVue();

describe('Markdown Editor', () => {
  it('can emit back props changes', async () => {
    const wrapper = shallowMount(MarkdownEditor, {
      localVue,
      vuetify,
      propsData: {
        placeholder: '',
        text: '',
        label: '',
      },
    });
    const newText = 'a string';
    await flushPromises();
    expect(wrapper.contains(Markdown)).toBe(true);
    wrapper.setProps({ text: newText });
    await flushPromises();
    expect(wrapper.emitted().changed.length).toBe(1);
    expect(wrapper.vm.text_).toBe(newText);
  });
});
