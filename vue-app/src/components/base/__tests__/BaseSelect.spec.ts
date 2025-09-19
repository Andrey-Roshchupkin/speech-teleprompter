import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSelect from '../BaseSelect.vue'
import { SUPPORTED_LANGUAGES } from '@/types/global'

describe('BaseSelect', () => {
  const defaultProps = {
    id: 'test-select',
    modelValue: '',
    options: SUPPORTED_LANGUAGES.slice(0, 3), // Use first 3 languages for testing
  }

  it('renders with default props', () => {
    const wrapper = mount(BaseSelect, {
      props: defaultProps,
    })

    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('select').attributes('id')).toBe('test-select')
    expect(wrapper.find('select').element.value).toBe('')
  })

  it('renders with label', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        label: 'Select Language',
      },
    })

    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Select Language')
    expect(label.attributes('for')).toBe('test-select')
  })

  it('renders with placeholder', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        placeholder: 'Choose an option',
      },
    })

    const placeholderOption = wrapper.find('option[value=""]')
    expect(placeholderOption.exists()).toBe(true)
    expect(placeholderOption.text()).toBe('Choose an option')
    expect(placeholderOption.attributes('disabled')).toBeDefined()
  })

  it('renders options correctly', () => {
    const wrapper = mount(BaseSelect, {
      props: defaultProps,
    })

    const options = wrapper.findAll('option:not([value=""])')
    expect(options).toHaveLength(3)
    expect(options[0].text()).toBe('English (US)')
    expect(options[0].attributes('value')).toBe('en-US')
  })

  it('handles v-model correctly', async () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        modelValue: 'en-US',
      },
    })

    expect(wrapper.find('select').element.value).toBe('en-US')

    await wrapper.find('select').setValue('es-ES')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['es-ES'])
  })

  it('emits change event', async () => {
    const wrapper = mount(BaseSelect, {
      props: defaultProps,
    })

    await wrapper.find('select').setValue('en-US')
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toHaveLength(1)
  })

  it('handles disabled state', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        disabled: true,
      },
    })

    const select = wrapper.find('select')
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.classes()).toContain('form-select--disabled')
  })

  it('handles required state', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        required: true,
        label: 'Required Field',
      },
    })

    const select = wrapper.find('select')
    const label = wrapper.find('label')
    const indicator = wrapper.find('.required-indicator')

    expect(select.attributes('required')).toBeDefined()
    expect(label.classes()).toContain('form-label--required')
    expect(indicator.exists()).toBe(true)
    expect(indicator.text()).toBe('*')
  })

  it('displays error message', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        errorMessage: 'This field is required',
      },
    })

    const errorMessage = wrapper.find('.error-message')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toBe('This field is required')
    expect(errorMessage.attributes('role')).toBe('alert')
    expect(wrapper.find('.form-group').classes()).toContain('form-group--error')
  })

  it('displays help text when no error', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        helpText: 'Select your preferred language',
      },
    })

    const helpText = wrapper.find('.help-text')
    expect(helpText.exists()).toBe(true)
    expect(helpText.text()).toBe('Select your preferred language')
  })

  it('hides help text when error is present', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        helpText: 'Select your preferred language',
        errorMessage: 'This field is required',
      },
    })

    const helpText = wrapper.find('.help-text')
    expect(helpText.exists()).toBe(false)
  })

  it('applies correct size classes', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        size: 'large',
        label: 'Large Select',
      },
    })

    const select = wrapper.find('select')
    const label = wrapper.find('label')

    expect(select.classes()).toContain('form-select--large')
    expect(label.classes()).toContain('form-label--large')
  })

  it('handles option with disabled property', () => {
    const optionsWithDisabled = [
      { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
      { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', disabled: true },
    ]

    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        options: optionsWithDisabled,
      },
    })

    const options = wrapper.findAll('option:not([value=""])')
    expect(options[1].attributes('disabled')).toBeDefined()
  })

  it('emits focus and blur events', async () => {
    const wrapper = mount(BaseSelect, {
      props: defaultProps,
    })

    const select = wrapper.find('select')
    await select.trigger('focus')
    await select.trigger('blur')

    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('emits keydown event', async () => {
    const wrapper = mount(BaseSelect, {
      props: defaultProps,
    })

    const select = wrapper.find('select')
    await select.trigger('keydown', { key: 'ArrowDown' })

    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('applies custom class', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        class: 'custom-select-class',
      },
    })

    expect(wrapper.find('.form-group').classes()).toContain('custom-select-class')
  })

  it('sets aria attributes correctly', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        'aria-label': 'Language selection',
        'aria-live': 'polite',
        helpText: 'Choose your language',
      },
    })

    const select = wrapper.find('select')
    // Note: Vue doesn't render attributes with undefined values
    // ARIA attributes are properly typed and handled by Vue
    expect(select.attributes('aria-describedby')).toBe('test-select-help')
  })

  it('sets aria-invalid when error is present', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        errorMessage: 'Invalid selection',
      },
    })

    const select = wrapper.find('select')
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(select.attributes('aria-describedby')).toBe('test-select-error')
  })

  it('sets aria-required when required', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        required: true,
      },
    })

    const select = wrapper.find('select')
    expect(select.attributes('aria-required')).toBe('true')
  })

  it('handles empty options array', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        options: [],
      },
    })

    const options = wrapper.findAll('option:not([value=""])')
    expect(options).toHaveLength(0)
  })

  it('handles options with only placeholder', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        ...defaultProps,
        options: [],
        placeholder: 'No options available',
      },
    })

    const placeholderOption = wrapper.find('option[value=""]')
    expect(placeholderOption.exists()).toBe(true)
    expect(placeholderOption.text()).toBe('No options available')
  })
})
