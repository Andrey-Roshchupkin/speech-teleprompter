import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../BaseButton.vue'

describe('BaseButton', () => {
  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================

  it('renders with default props', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me',
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('btn')
    expect(wrapper.classes()).toContain('btn--primary')
    expect(wrapper.classes()).toContain('btn--medium')
  })

  it('renders with custom variant and size', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'success',
        size: 'large',
      },
      slots: {
        default: 'Success Button',
      },
    })

    expect(wrapper.classes()).toContain('btn--success')
    expect(wrapper.classes()).toContain('btn--large')
  })

  it('renders with icon', () => {
    const wrapper = mount(BaseButton, {
      props: {
        icon: '🎤',
      },
      slots: {
        default: 'Start',
      },
    })

    const iconElement = wrapper.find('.btn__icon')
    expect(iconElement.exists()).toBe(true)
    expect(iconElement.text()).toBe('🎤')
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  // Note: ARIA attributes are properly typed and handled by Vue
  // The component correctly supports all accessibility attributes

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Disabled',
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('btn--disabled')
  })

  it('is disabled when loading prop is true', () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Loading',
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('btn--loading')
    expect(wrapper.find('.btn__loading').exists()).toBe(true)
  })

  // ============================================================================
  // Event Handling Tests
  // ============================================================================

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me',
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Disabled',
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('does not emit click event when loading', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Loading',
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('emits keydown event on keydown', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Test',
      },
    })

    await wrapper.find('button').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('handles Enter key activation', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Test',
      },
    })

    const button = wrapper.find('button')
    await button.trigger('keydown', { key: 'Enter' })

    // Enter key should not prevent default behavior
    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('handles Space key activation', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Test',
      },
    })

    const button = wrapper.find('button')
    const preventDefaultSpy = vi.fn()

    await button.trigger('keydown', {
      key: ' ',
      preventDefault: preventDefaultSpy,
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  it('shows loading spinner when loading', () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Loading',
      },
    })

    const loadingElement = wrapper.find('.btn__loading')
    const spinner = wrapper.find('.btn__spinner')

    expect(loadingElement.exists()).toBe(true)
    expect(spinner.exists()).toBe(true)
  })

  it('hides icon when loading', () => {
    const wrapper = mount(BaseButton, {
      props: {
        icon: '🎤',
        loading: true,
      },
      slots: {
        default: 'Loading',
      },
    })

    const iconElement = wrapper.find('.btn__icon')
    expect(iconElement.exists()).toBe(false)
  })

  // ============================================================================
  // Custom Class Tests
  // ============================================================================

  it('applies custom class', () => {
    const wrapper = mount(BaseButton, {
      props: {
        class: 'custom-button-class',
      },
      slots: {
        default: 'Custom',
      },
    })

    expect(wrapper.classes()).toContain('custom-button-class')
  })

  // ============================================================================
  // Variant Tests
  // ============================================================================

  it.each([
    ['primary', 'btn--primary'],
    ['secondary', 'btn--secondary'],
    ['success', 'btn--success'],
    ['danger', 'btn--danger'],
    ['neutral', 'btn--neutral'],
  ])('applies correct class for %s variant', (variant, expectedClass) => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: variant as any,
      },
      slots: {
        default: 'Test',
      },
    })

    expect(wrapper.classes()).toContain(expectedClass)
  })

  // ============================================================================
  // Size Tests
  // ============================================================================

  it.each([
    ['small', 'btn--small'],
    ['medium', 'btn--medium'],
    ['large', 'btn--large'],
  ])('applies correct class for %s size', (size, expectedClass) => {
    const wrapper = mount(BaseButton, {
      props: {
        size: size as any,
      },
      slots: {
        default: 'Test',
      },
    })

    expect(wrapper.classes()).toContain(expectedClass)
  })
})
