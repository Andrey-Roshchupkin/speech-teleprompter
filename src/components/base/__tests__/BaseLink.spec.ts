import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseLink from '../BaseLink.vue'

describe('BaseLink', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
      },
      slots: {
        default: 'Test Link',
      },
    })

    expect(wrapper.find('a').exists()).toBe(true)
    expect(wrapper.find('a').attributes('href')).toBe('https://example.com')
    expect(wrapper.find('a').attributes('target')).toBe('_self')
    expect(wrapper.text()).toBe('Test Link')
  })

  it('renders with external link attributes', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      slots: {
        default: 'External Link',
      },
    })

    expect(wrapper.find('a').attributes('target')).toBe('_blank')
    expect(wrapper.find('a').attributes('rel')).toBe('noopener noreferrer')
  })

  it('renders with icon', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        icon: '🔗',
      },
      slots: {
        default: 'Link with Icon',
      },
    })

    expect(wrapper.find('.link-icon').exists()).toBe(true)
    expect(wrapper.find('.link-icon').text()).toBe('🔗')
    expect(wrapper.find('.link-icon').attributes('aria-hidden')).toBe('true')
  })

  it('applies correct CSS classes for variants', () => {
    const footerWrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        variant: 'footer',
      },
    })

    const buttonWrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        variant: 'button',
      },
    })

    expect(footerWrapper.find('a').classes()).toContain('base-link--footer')
    expect(buttonWrapper.find('a').classes()).toContain('base-link--button')
  })

  it('applies correct CSS classes for sizes', () => {
    const smWrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        size: 'sm',
      },
    })

    const lgWrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        size: 'lg',
      },
    })

    expect(smWrapper.find('a').classes()).toContain('base-link--sm')
    expect(lgWrapper.find('a').classes()).toContain('base-link--lg')
  })

  it('emits click event', async () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
      },
    })

    // Prevent default navigation behavior in test
    const link = wrapper.find('a')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() })

    await link.element.dispatchEvent(clickEvent)
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toHaveLength(1)
  })

  it('renders with aria-label', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        ariaLabel: 'Visit example website',
      },
    })

    expect(wrapper.find('a').attributes('aria-label')).toBe('Visit example website')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(BaseLink, {
      props: {
        href: 'https://example.com',
        target: '_blank',
        rel: 'noopener noreferrer',
        ariaLabel: 'External link to example',
      },
    })

    const link = wrapper.find('a')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('aria-label')).toBe('External link to example')
  })
})
