import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'
import BaseLink from '@/components/base/BaseLink.vue'

describe('AppFooter', () => {
  it('renders footer content correctly', () => {
    const wrapper = mount(AppFooter)

    expect(wrapper.find('.app-footer').exists()).toBe(true)
    expect(wrapper.find('.footer-content').exists()).toBe(true)
    expect(wrapper.find('.footer-bottom').exists()).toBe(true)
  })

  it('displays the correct title and description', () => {
    const wrapper = mount(AppFooter)

    expect(wrapper.text()).toContain('Speech Teleprompter')
    expect(wrapper.text()).toContain('Free real-time speech recognition teleprompter')
    expect(wrapper.text()).toContain('Web Speech API')
  })

  it('contains all required author links', () => {
    const wrapper = mount(AppFooter)

    const baseLinks = wrapper.findAllComponents(BaseLink)
    const hrefs = baseLinks.map((link) => link.props('href'))

    expect(hrefs).toContain('https://www.linkedin.com/in/andrey-roshchupkin')
    expect(hrefs).toContain('https://sdet-andrew.hashnode.dev')
    expect(hrefs).toContain('https://github.com/Andrey-Roshchupkin/speech-teleprompter')
  })

  it('has correct link attributes for external links', () => {
    const wrapper = mount(AppFooter)

    const baseLinks = wrapper.findAllComponents(BaseLink)
    baseLinks.forEach((link) => {
      expect(link.props('target')).toBe('_blank')
      expect(link.props('rel')).toBe('noopener noreferrer')
    })
  })

  it('displays copyright information', () => {
    const wrapper = mount(AppFooter)

    expect(wrapper.text()).toContain('© 2025 Andrey Roshchupkin')
    expect(wrapper.text()).toContain('Free Speech Teleprompter with real-time speech recognition')
  })

  it('has proper link icons', () => {
    const wrapper = mount(AppFooter)

    const baseLinks = wrapper.findAllComponents(BaseLink)
    const icons = baseLinks.map((link) => link.props('icon'))

    expect(icons).toContain('💼') // LinkedIn icon
    expect(icons).toContain('📝') // Blog icon
    expect(icons).toContain('🔗') // GitHub icon
  })

  it('renders footer sections correctly', () => {
    const wrapper = mount(AppFooter)

    const sections = wrapper.findAll('section')
    expect(sections).toHaveLength(3)

    expect(wrapper.text()).toContain('Author')
    expect(wrapper.text()).toContain('Source Code')
  })

  it('has proper semantic structure and ARIA attributes', () => {
    const wrapper = mount(AppFooter)

    const footer = wrapper.find('footer')
    expect(footer.attributes('role')).toBe('contentinfo')
    expect(footer.attributes('aria-label')).toBe('Site footer with author information and links')

    const sections = wrapper.findAll('section')
    expect(sections[0].attributes('aria-labelledby')).toBe('app-description')
    expect(sections[1].attributes('aria-labelledby')).toBe('author-links')
    expect(sections[2].attributes('aria-labelledby')).toBe('source-code')

    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Author social media and blog links')
  })

  it('has proper heading structure', () => {
    const wrapper = mount(AppFooter)

    const headings = wrapper.findAll('h4')
    expect(headings).toHaveLength(3)
    expect(headings[0].attributes('id')).toBe('app-description')
    expect(headings[1].attributes('id')).toBe('author-links')
    expect(headings[2].attributes('id')).toBe('source-code')
  })
})
