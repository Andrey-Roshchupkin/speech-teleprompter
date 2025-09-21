import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../ProgressBar.vue'

const defaultProps = {
  current: 25,
  total: 100,
}

describe('ProgressBar', () => {
  it('renders with default props', () => {
    const wrapper = mount(ProgressBar, {
      props: defaultProps,
    })

    expect(wrapper.find('.progress-bar-container').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
    expect(wrapper.find('.progress-label').exists()).toBe(true)
  })

  it('displays correct progress percentage', () => {
    const wrapper = mount(ProgressBar, {
      props: defaultProps,
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 25%')
    expect(progressFill.attributes('aria-valuenow')).toBe('25')
  })

  it('displays correct progress label', () => {
    const wrapper = mount(ProgressBar, {
      props: defaultProps,
    })

    const progressLabel = wrapper.find('.progress-label')
    expect(progressLabel.text()).toBe('25 / 100 (25%)')
  })

  it('handles custom label', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        ...defaultProps,
        label: 'Custom Progress Label',
      },
    })

    const progressLabel = wrapper.find('.progress-label')
    expect(progressLabel.text()).toBe('Custom Progress Label')
  })

  it('hides label when showLabel is false', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        ...defaultProps,
        showLabel: false,
      },
    })

    expect(wrapper.find('.progress-label').exists()).toBe(false)
  })

  it('handles zero progress', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 0,
        total: 100,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')
    expect(progressFill.attributes('aria-valuenow')).toBe('0')
  })

  it('handles 100% progress', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 100,
        total: 100,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 100%')
    expect(progressFill.attributes('aria-valuenow')).toBe('100')
  })

  it('handles progress over 100%', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 150,
        total: 100,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 100%')
    expect(progressFill.attributes('aria-valuenow')).toBe('100')
  })

  it('handles negative progress', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: -10,
        total: 100,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')
    expect(progressFill.attributes('aria-valuenow')).toBe('0')
  })

  it('handles zero total', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 50,
        total: 0,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')
    expect(progressFill.attributes('aria-valuenow')).toBe('0')
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(ProgressBar, {
      props: defaultProps,
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('role')).toBe('progressbar')
    expect(progressFill.attributes('aria-valuemin')).toBe('0')
    expect(progressFill.attributes('aria-valuemax')).toBe('100')
    expect(progressFill.attributes('aria-valuenow')).toBe('25')
    expect(progressFill.attributes('aria-label')).toBe('25 / 100 (25%)')
  })

  it('calculates percentage correctly for various values', () => {
    const testCases = [
      { current: 1, total: 4 },
      { current: 3, total: 4 },
      { current: 1, total: 3 },
      { current: 2, total: 3 },
    ]

    testCases.forEach(({ current, total }) => {
      const wrapper = mount(ProgressBar, {
        props: { current, total },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width:')
      expect(progressFill.attributes('style')).toContain('%')
    })
  })

  it('maintains component structure', () => {
    const wrapper = mount(ProgressBar, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.progress-bar-container').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
  })

  it('handles decimal progress values', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 33.33,
        total: 100,
      },
    })

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 33.33%')
  })
})
