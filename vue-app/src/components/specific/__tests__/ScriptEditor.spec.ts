import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScriptEditor from '../ScriptEditor.vue'

const defaultProps = {
  scriptText: 'Welcome to our presentation. Today we will be discussing the future of technology.',
}

describe('ScriptEditor', () => {
  it('renders with default props', () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    expect(wrapper.find('.script-editor-container').exists()).toBe(true)
    expect(wrapper.find('.script-editor-header h3').text()).toBe('📝 Script Text')
    expect(wrapper.find('.script-editor-content').exists()).toBe(true)
  })

  it('displays script text in textarea', () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.exists()).toBe(true)
    expect(textarea.props('id')).toBe('script-text')
    expect(textarea.props('placeholder')).toBe('Enter your teleprompter script here...')
    expect(textarea.props('rows')).toBe(8)
  })

  it('emits update:scriptText when text changes', async () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    await textarea.vm.$emit('update:modelValue', 'New script content')

    expect(wrapper.emitted('update:scriptText')).toBeTruthy()
    expect(wrapper.emitted('update:scriptText')?.[0]?.[0]).toBe('New script content')
  })

  it('updates local state when props change', async () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    const newScriptText = 'Updated script content'
    await wrapper.setProps({ scriptText: newScriptText })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.props('modelValue')).toBe(newScriptText)
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.props('id')).toBe('script-text')
  })

  it('handles empty script text', () => {
    const wrapper = mount(ScriptEditor, {
      props: {
        scriptText: '',
      },
    })

    expect(wrapper.find('.script-editor-container').exists()).toBe(true)
    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.props('modelValue')).toBe('')
  })

  it('displays default script text when no prop provided', () => {
    const wrapper = mount(ScriptEditor, {
      props: {
        scriptText: '',
      },
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.exists()).toBe(true)
  })

  it('maintains component structure', () => {
    const wrapper = mount(ScriptEditor, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.script-editor-container').exists()).toBe(true)
    expect(wrapper.find('.script-editor-header').exists()).toBe(true)
    expect(wrapper.find('.script-editor-content').exists()).toBe(true)
  })

  it('handles long script text', () => {
    const longScript =
      'This is a very long script text that should be handled properly by the component. '.repeat(
        10,
      )

    const wrapper = mount(ScriptEditor, {
      props: {
        scriptText: longScript,
      },
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.props('modelValue')).toBe(longScript)
  })

  it('handles script text with special characters', () => {
    const specialScript = 'Script with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'

    const wrapper = mount(ScriptEditor, {
      props: {
        scriptText: specialScript,
      },
    })

    const textarea = wrapper.findComponent({ name: 'BaseTextarea' })
    expect(textarea.props('modelValue')).toBe(specialScript)
  })
})
