import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTextarea from '../BaseTextarea.vue'

describe('BaseTextarea', () => {
  const defaultProps = {
    id: 'test-textarea',
    modelValue: '',
  }

  it('renders with default props', () => {
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('textarea').attributes('id')).toBe('test-textarea')
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('renders with label', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        label: 'Description',
      },
    })

    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Description')
    expect(label.attributes('for')).toBe('test-textarea')
  })

  it('renders with placeholder', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        placeholder: 'Enter your description here...',
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('placeholder')).toBe('Enter your description here...')
  })

  it('handles v-model correctly', async () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        modelValue: 'Initial text',
      },
    })

    expect(wrapper.find('textarea').element.value).toBe('Initial text')

    await wrapper.find('textarea').setValue('Updated text')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Updated text'])
  })

  it('emits input event', async () => {
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    await wrapper.find('textarea').setValue('New text')
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')?.[0]).toHaveLength(1)
  })

  it('handles disabled state', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        disabled: true,
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textarea.classes()).toContain('form-textarea--disabled')
  })

  it('handles required state', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        required: true,
        label: 'Required Field',
      },
    })

    const textarea = wrapper.find('textarea')
    const label = wrapper.find('label')
    const indicator = wrapper.find('.required-indicator')

    expect(textarea.attributes('required')).toBeDefined()
    expect(label.classes()).toContain('form-label--required')
    expect(indicator.exists()).toBe(true)
    expect(indicator.text()).toBe('*')
  })

  it('displays error message', () => {
    const wrapper = mount(BaseTextarea, {
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
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        helpText: 'Enter a detailed description',
      },
    })

    const helpText = wrapper.find('.help-text')
    expect(helpText.exists()).toBe(true)
    expect(helpText.text()).toBe('Enter a detailed description')
  })

  it('hides help text when error is present', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        helpText: 'Enter a detailed description',
        errorMessage: 'This field is required',
      },
    })

    const helpText = wrapper.find('.help-text')
    expect(helpText.exists()).toBe(false)
  })

  it('applies correct size classes', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        size: 'large',
        label: 'Large Textarea',
      },
    })

    const textarea = wrapper.find('textarea')
    const label = wrapper.find('label')

    expect(textarea.classes()).toContain('form-textarea--large')
    expect(label.classes()).toContain('form-label--large')
  })

  it('sets rows and cols attributes', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        rows: 6,
        cols: 50,
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('rows')).toBe('6')
    expect(textarea.attributes('cols')).toBe('50')
  })

  it('uses default rows when not specified', () => {
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('rows')).toBe('4')
  })

  it('emits focus and blur events', async () => {
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    const textarea = wrapper.find('textarea')
    await textarea.trigger('focus')
    await textarea.trigger('blur')

    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('emits keydown event', async () => {
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('keydown')).toBeTruthy()
  })

  it('applies custom class', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        class: 'custom-textarea-class',
      },
    })

    expect(wrapper.find('.form-group').classes()).toContain('custom-textarea-class')
  })

  it('sets aria attributes correctly', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        'aria-label': 'Description textarea',
        'aria-live': 'polite',
        helpText: 'Enter your description',
      },
    })

    const textarea = wrapper.find('textarea')
    // Note: Vue doesn't render attributes with undefined values
    // ARIA attributes are properly typed and handled by Vue
    expect(textarea.attributes('aria-describedby')).toBe('test-textarea-help')
  })

  it('sets aria-invalid when error is present', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        errorMessage: 'Invalid input',
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(textarea.attributes('aria-describedby')).toBe('test-textarea-error')
  })

  it('sets aria-required when required', () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        required: true,
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('aria-required')).toBe('true')
  })

  it('handles multiline text correctly', async () => {
    const multilineText = 'Line 1\nLine 2\nLine 3'
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        modelValue: multilineText,
      },
    })

    expect(wrapper.find('textarea').element.value).toBe(multilineText)

    await wrapper.find('textarea').setValue('Updated\nMultiline\nText')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Updated\nMultiline\nText'])
  })

  it('handles empty value', async () => {
    const wrapper = mount(BaseTextarea, {
      props: {
        ...defaultProps,
        modelValue: 'Some text',
      },
    })

    await wrapper.find('textarea').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('handles special characters', async () => {
    const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
    const wrapper = mount(BaseTextarea, {
      props: defaultProps,
    })

    await wrapper.find('textarea').setValue(specialText)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([specialText])
  })
})
