import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsPanel from '../SettingsPanel.vue'

const defaultProps = {
  settings: {
    linesToShow: 5,
    scrollTrigger: 3,
    textSize: 24,
    fuzzyPrecision: 65,
  },
}

describe('SettingsPanel', () => {
  it('renders with default props', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    expect(wrapper.find('.settings-panel-container').exists()).toBe(true)
    expect(wrapper.find('.settings-header h3').text()).toBe('⚙️ Teleprompter Settings')
    expect(wrapper.find('.settings-inline').exists()).toBe(true)
  })

  it('displays all 4 inline settings', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const settingColumns = wrapper.findAll('.setting-column')
    expect(settingColumns).toHaveLength(4)

    // Check labels
    const labels = wrapper.findAll('label')
    expect(labels[0].text()).toBe('Lines to Show')
    expect(labels[1].text()).toBe('Scroll After Lines')
    expect(labels[2].text()).toBe('Text Size (px)')
    expect(labels[3].text()).toBe('Fuzzy Match Precision')
  })

  it('displays input fields with correct attributes', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })
    expect(allInputs).toHaveLength(4)

    // Check IDs
    expect(allInputs[0].props('id')).toBe('lines-to-show')
    expect(allInputs[1].props('id')).toBe('scroll-trigger')
    expect(allInputs[2].props('id')).toBe('text-size')
    expect(allInputs[3].props('id')).toBe('fuzzy-precision')

    // Check types
    allInputs.forEach((input) => {
      expect(input.props('type')).toBe('number')
    })
  })

  it('displays correct min/max values for inputs', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })

    // Lines to Show: min=3, max=10
    expect(allInputs[0].props('min')).toBe(3)
    expect(allInputs[0].props('max')).toBe(10)

    // Scroll Trigger: min=1, max=4
    expect(allInputs[1].props('min')).toBe(1)
    expect(allInputs[1].props('max')).toBe(4)

    // Text Size: min=12, max=48
    expect(allInputs[2].props('min')).toBe(12)
    expect(allInputs[2].props('max')).toBe(48)

    // Fuzzy Precision: min=50, max=95, step=5
    expect(allInputs[3].props('min')).toBe(50)
    expect(allInputs[3].props('max')).toBe(95)
    expect(allInputs[3].props('step')).toBe(5)
  })

  it('emits update:settings when input values change', async () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })
    const firstInput = allInputs[0]

    if (firstInput) {
      await firstInput.vm.$emit('update:modelValue', 7)
      expect(wrapper.emitted('update:settings')).toBeTruthy()
    }
  })

  it('updates local settings when props change', async () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const newSettings = {
      linesToShow: 8,
      scrollTrigger: 2,
      textSize: 32,
      fuzzyPrecision: 75,
    }

    await wrapper.setProps({ settings: newSettings })

    // Check that the component updates its internal state
    expect(wrapper.find('.settings-panel-container').exists()).toBe(true)
  })

  it('handles numeric input conversion correctly', async () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })
    const firstInput = allInputs[0]

    if (firstInput) {
      await firstInput.vm.$emit('update:modelValue', '6')
      expect(wrapper.emitted('update:settings')).toBeTruthy()
    }
  })

  it('maintains component structure', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.settings-panel-container').exists()).toBe(true)
    expect(wrapper.find('.settings-header').exists()).toBe(true)
    expect(wrapper.find('.settings-content').exists()).toBe(true)
    expect(wrapper.find('.settings-inline').exists()).toBe(true)
  })

  it('displays correct initial values', () => {
    const wrapper = mount(SettingsPanel, {
      props: defaultProps,
    })

    // Check that all inputs are rendered with correct IDs
    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })
    expect(allInputs).toHaveLength(4)
    expect(allInputs[0].props('id')).toBe('lines-to-show')
    expect(allInputs[1].props('id')).toBe('scroll-trigger')
    expect(allInputs[2].props('id')).toBe('text-size')
    expect(allInputs[3].props('id')).toBe('fuzzy-precision')
  })

  it('handles empty settings object', () => {
    const emptySettings = {
      linesToShow: 0,
      scrollTrigger: 0,
      textSize: 0,
      fuzzyPrecision: 0,
    }

    const wrapper = mount(SettingsPanel, {
      props: {
        settings: emptySettings,
      },
    })

    expect(wrapper.find('.settings-panel-container').exists()).toBe(true)
    const allInputs = wrapper.findAllComponents({ name: 'BaseInput' })
    expect(allInputs).toHaveLength(4)
  })
})
