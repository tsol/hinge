import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TestBtn from '../src/components/TestBtn.vue'

describe('TestBtn', () => {
  it('renders an anchor with data-test attribute', () => {
    const wrapper = mount(TestBtn, {
      props: { dataTest: 'my-btn' },
      slots: { default: 'Go' },
    })
    const a = wrapper.find('a[data-test="my-btn"]')
    expect(a.exists()).toBe(true)
    expect(a.text()).toBe('Go')
  })

  it('emits click event on anchor click', async () => {
    const wrapper = mount(TestBtn, {
      props: { dataTest: 'click-test' },
      slots: { default: 'Click' },
    })
    const a = wrapper.find('a[data-test="click-test"]')
    await a.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
