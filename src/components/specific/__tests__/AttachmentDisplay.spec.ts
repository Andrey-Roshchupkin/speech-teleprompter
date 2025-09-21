import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AttachmentDisplay from '../AttachmentDisplay.vue'
import type { Attachment } from '@/types/global'

describe('AttachmentDisplay', () => {
  const mockAttachment: Attachment = {
    name: 'SLIDE_1',
    content: 'This is the content of slide 1',
    startWordIndex: 10,
    endWordIndex: 15,
  }

  it('renders with default props', () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: null,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment').exists()).toBe(false)
  })

  it('renders attachment when currentAttachment is provided', () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: mockAttachment,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment').exists()).toBe(true)
    expect(wrapper.find('.teleprompter-attachment-title').text()).toBe('SLIDE_1')
    expect(wrapper.find('.teleprompter-attachment-content').text()).toBe(
      'This is the content of slide 1',
    )
  })

  it('applies correct font size styles', () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: mockAttachment,
        textSize: 30,
      },
    })

    const attachmentElement = wrapper.find('.teleprompter-attachment')
    const titleElement = wrapper.find('.teleprompter-attachment-title')

    expect(attachmentElement.attributes('style')).toContain('font-size: 30px')
    expect(titleElement.attributes('style')).toContain('font-size: 28px')
  })

  it('applies minimum font size for title', () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: mockAttachment,
        textSize: 10, // Very small size
      },
    })

    const titleElement = wrapper.find('.teleprompter-attachment-title')
    expect(titleElement.attributes('style')).toContain('font-size: 12px') // Minimum size
  })

  it('handles empty attachment content', () => {
    const emptyAttachment: Attachment = {
      name: 'EMPTY_SLIDE',
      content: '',
      startWordIndex: 5,
      endWordIndex: 8,
    }

    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: emptyAttachment,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment-title').text()).toBe('EMPTY_SLIDE')
    expect(wrapper.find('.teleprompter-attachment-content').text()).toBe('')
  })

  it('handles long attachment content', () => {
    const longContent =
      'This is a very long content that should be displayed properly in the attachment display component. It contains multiple sentences and should wrap correctly.'
    const longAttachment: Attachment = {
      name: 'LONG_SLIDE',
      content: longContent,
      startWordIndex: 20,
      endWordIndex: 25,
    }

    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: longAttachment,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment-title').text()).toBe('LONG_SLIDE')
    expect(wrapper.find('.teleprompter-attachment-content').text()).toBe(longContent)
  })

  it('updates when currentAttachment changes', async () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: null,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment').exists()).toBe(false)

    await wrapper.setProps({
      currentAttachment: mockAttachment,
    })

    expect(wrapper.find('.teleprompter-attachment').exists()).toBe(true)
    expect(wrapper.find('.teleprompter-attachment-title').text()).toBe('SLIDE_1')
  })

  it('updates when textSize changes', async () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: mockAttachment,
        textSize: 20,
      },
    })

    let attachmentElement = wrapper.find('.teleprompter-attachment')
    let titleElement = wrapper.find('.teleprompter-attachment-title')

    expect(attachmentElement.attributes('style')).toContain('font-size: 20px')
    expect(titleElement.attributes('style')).toContain('font-size: 18px')

    await wrapper.setProps({
      textSize: 32,
    })

    attachmentElement = wrapper.find('.teleprompter-attachment')
    titleElement = wrapper.find('.teleprompter-attachment-title')

    expect(attachmentElement.attributes('style')).toContain('font-size: 32px')
    expect(titleElement.attributes('style')).toContain('font-size: 30px')
  })

  it('has correct CSS classes', () => {
    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: mockAttachment,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment').exists()).toBe(true)
    expect(wrapper.find('.teleprompter-attachment-title').exists()).toBe(true)
    expect(wrapper.find('.teleprompter-attachment-content').exists()).toBe(true)
  })

  it('handles special characters in attachment name and content', () => {
    const specialAttachment: Attachment = {
      name: 'SLIDE_1_SPECIAL_!@#$%',
      content: 'Content with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      startWordIndex: 0,
      endWordIndex: 5,
    }

    const wrapper = mount(AttachmentDisplay, {
      props: {
        currentAttachment: specialAttachment,
        textSize: 24,
      },
    })

    expect(wrapper.find('.teleprompter-attachment-title').text()).toBe('SLIDE_1_SPECIAL_!@#$%')
    expect(wrapper.find('.teleprompter-attachment-content').text()).toBe(
      'Content with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
    )
  })
})
