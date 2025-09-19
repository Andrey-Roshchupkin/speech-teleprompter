import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DebugLog from '../DebugLog.vue'

const defaultProps = {
  logLevel: 'info' as const,
}

describe('DebugLog', () => {
  it('renders with default props', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    expect(wrapper.find('.debug-log-container').exists()).toBe(true)
    expect(wrapper.find('.debug-log-header h3').text()).toBe('🐛 Debug Log')
    expect(wrapper.find('.log-level-controls').exists()).toBe(true)
    expect(wrapper.find('.debug-info').exists()).toBe(true)
  })

  it('displays all log level radio buttons', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const radioInputs = wrapper.findAll('input[type="radio"]')
    expect(radioInputs).toHaveLength(4)

    // Check values
    expect(radioInputs[0].attributes('value')).toBe('off')
    expect(radioInputs[1].attributes('value')).toBe('error')
    expect(radioInputs[2].attributes('value')).toBe('info')
    expect(radioInputs[3].attributes('value')).toBe('debug')
  })

  it('displays correct labels for log levels', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const labels = wrapper.findAll('.radio-option span')
    expect(labels).toHaveLength(4)
    expect(labels[0].text()).toBe('Off')
    expect(labels[1].text()).toBe('Error')
    expect(labels[2].text()).toBe('Info')
    expect(labels[3].text()).toBe('Debug')
  })

  it('selects correct log level by default', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const radioInputs = wrapper.findAll('input[type="radio"]')
    expect(radioInputs[2].attributes('checked')).toBeDefined() // info should be checked
  })

  it('emits update:logLevel when radio button changes', async () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const debugRadio = wrapper.find('input[value="debug"]')
    await debugRadio.trigger('change')

    expect(wrapper.emitted('update:logLevel')).toBeTruthy()
    expect(wrapper.emitted('update:logLevel')?.[0]?.[0]).toBe('debug')
  })

  it('updates local state when props change', async () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    await wrapper.setProps({ logLevel: 'error' })

    const errorRadio = wrapper.find('input[value="error"]')
    expect(errorRadio.attributes('checked')).toBeDefined()
  })

  it('displays debug info text', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const infoText = wrapper.find('.debug-info p')
    expect(infoText.exists()).toBe(true)
    expect(infoText.text()).toContain('Logs are displayed in the browser')
    expect(infoText.text()).toContain('Open DevTools and view logs')
  })

  it('handles all log levels correctly', async () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const logLevels = ['off', 'error', 'info', 'debug'] as const

    for (const level of logLevels) {
      const radio = wrapper.find(`input[value="${level}"]`)
      await radio.trigger('change')

      expect(wrapper.emitted('update:logLevel')).toBeTruthy()
      const lastEmit = wrapper.emitted('update:logLevel')?.slice(-1)?.[0]?.[0]
      expect(lastEmit).toBe(level)
    }
  })

  it('maintains component structure', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.debug-log-container').exists()).toBe(true)
    expect(wrapper.find('.debug-log-header').exists()).toBe(true)
    expect(wrapper.find('.debug-log-content').exists()).toBe(true)
    expect(wrapper.find('.log-level-controls').exists()).toBe(true)
    expect(wrapper.find('.setting-column').exists()).toBe(true)
    expect(wrapper.find('.radio-group').exists()).toBe(true)
    expect(wrapper.find('.debug-info').exists()).toBe(true)
  })

  it('handles empty log level', () => {
    const wrapper = mount(DebugLog, {
      props: {
        logLevel: 'off' as const,
      },
    })

    expect(wrapper.find('.debug-log-container').exists()).toBe(true)
    const offRadio = wrapper.find('input[value="off"]')
    expect(offRadio.attributes('checked')).toBeDefined()
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(DebugLog, {
      props: defaultProps,
    })

    const radioInputs = wrapper.findAll('input[type="radio"]')
    radioInputs.forEach((input) => {
      expect(input.attributes('name')).toBe('logLevel')
      expect(input.attributes('value')).toBeDefined()
    })
  })
})
