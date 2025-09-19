import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSelector from '../LanguageSelector.vue'
import { SUPPORTED_LANGUAGES } from '@/types/global'

const defaultProps = {
  primaryLanguage: 'en-US',
}

describe('LanguageSelector', () => {
  it('renders with default props', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    expect(wrapper.find('.language-selector-container').exists()).toBe(true)
    expect(wrapper.find('.language-selector-header h3').text()).toBe('🌍 Language Settings')
    expect(wrapper.find('.setting-group').exists()).toBe(true)
    expect(wrapper.find('.language-info').exists()).toBe(true)
  })

  it('displays primary language select', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'BaseSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('id')).toBe('primary-language')
    expect(select.props('options')).toEqual(SUPPORTED_LANGUAGES)
  })

  it('displays language info text', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    const infoText = wrapper.find('.language-info p')
    expect(infoText.exists()).toBe(true)
    expect(infoText.text()).toContain('Language Selection')
    expect(infoText.text()).toContain('Choose your primary language')
  })

  it('emits update:primaryLanguage when language changes', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'BaseSelect' })
    await select.vm.$emit('update:modelValue', 'es-ES')

    expect(wrapper.emitted('update:primaryLanguage')).toBeTruthy()
    expect(wrapper.emitted('update:primaryLanguage')?.[0]?.[0]).toBe('es-ES')
  })

  it('updates local state when props change', async () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    await wrapper.setProps({ primaryLanguage: 'fr-FR' })

    const select = wrapper.findComponent({ name: 'BaseSelect' })
    expect(select.props('modelValue')).toBe('fr-FR')
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'BaseSelect' })
    expect(select.props('id')).toBe('primary-language')
  })

  it('displays supported languages in select', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'BaseSelect' })
    const options = select.props('options')

    expect(options).toHaveLength(SUPPORTED_LANGUAGES.length)
    expect(options[0]).toHaveProperty('code')
    expect(options[0]).toHaveProperty('name')
  })

  it('handles empty primary language', () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        primaryLanguage: '',
      },
    })

    expect(wrapper.find('.language-selector-container').exists()).toBe(true)
    const select = wrapper.findComponent({ name: 'BaseSelect' })
    expect(select.props('modelValue')).toBe('')
  })

  it('maintains component structure', () => {
    const wrapper = mount(LanguageSelector, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.language-selector-container').exists()).toBe(true)
    expect(wrapper.find('.language-selector-header').exists()).toBe(true)
    expect(wrapper.find('.language-selector-content').exists()).toBe(true)
    expect(wrapper.find('.language-section').exists()).toBe(true)
    expect(wrapper.find('.setting-group').exists()).toBe(true)
    expect(wrapper.find('.language-info').exists()).toBe(true)
  })
})
