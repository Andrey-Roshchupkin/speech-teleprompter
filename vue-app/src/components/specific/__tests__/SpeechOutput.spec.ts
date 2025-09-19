import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpeechOutput from '../SpeechOutput.vue'

const defaultProps = {
  finalTranscript: '',
  interimTranscript: '',
  isListening: false,
}

describe('SpeechOutput', () => {
  it('renders with default props', () => {
    const wrapper = mount(SpeechOutput, {
      props: defaultProps,
    })

    expect(wrapper.find('.speech-output-container').exists()).toBe(true)
    expect(wrapper.find('.speech-output-header h3').text()).toBe('🎤 Speech Output')
    expect(wrapper.find('.speech-output-display').exists()).toBe(true)
  })

  it('displays placeholder when not listening and no output', () => {
    const wrapper = mount(SpeechOutput, {
      props: defaultProps,
    })

    const placeholder = wrapper.find('.speech-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('Click "Start" to begin speech recognition...')
  })

  it('displays final transcript when provided', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        finalTranscript: 'Hello world',
      },
    })

    const finalTranscript = wrapper.find('.final-transcript')
    expect(finalTranscript.exists()).toBe(true)
    expect(finalTranscript.text()).toContain('Final: Hello world')
  })

  it('displays interim transcript when provided', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        interimTranscript: 'Hello wo',
      },
    })

    const interimTranscript = wrapper.find('.interim-transcript')
    expect(interimTranscript.exists()).toBe(true)
    expect(interimTranscript.text()).toContain('Interim: Hello wo')
  })

  it('displays listening indicator when listening', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        isListening: true,
      },
    })

    const listeningIndicator = wrapper.find('.listening-indicator')
    expect(listeningIndicator.exists()).toBe(true)
    expect(listeningIndicator.text()).toContain('Listening...')

    const listeningDot = wrapper.find('.listening-dot')
    expect(listeningDot.exists()).toBe(true)
  })

  it('displays both final and interim transcripts', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        finalTranscript: 'Hello world',
        interimTranscript: 'Hello wo',
      },
    })

    const finalTranscript = wrapper.find('.final-transcript')
    const interimTranscript = wrapper.find('.interim-transcript')

    expect(finalTranscript.exists()).toBe(true)
    expect(interimTranscript.exists()).toBe(true)
    expect(finalTranscript.text()).toContain('Final: Hello world')
    expect(interimTranscript.text()).toContain('Interim: Hello wo')
  })

  it('shows speech content when has output', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        finalTranscript: 'Some text',
      },
    })

    expect(wrapper.find('.speech-placeholder').exists()).toBe(false)
    expect(wrapper.find('.speech-content').exists()).toBe(true)
  })

  it('shows speech content when listening', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        isListening: true,
      },
    })

    expect(wrapper.find('.speech-placeholder').exists()).toBe(false)
    expect(wrapper.find('.speech-content').exists()).toBe(true)
  })

  it('handles empty transcripts', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        finalTranscript: '',
        interimTranscript: '',
        isListening: false,
      },
    })

    expect(wrapper.find('.speech-placeholder').exists()).toBe(true)
    expect(wrapper.find('.final-transcript').exists()).toBe(false)
    expect(wrapper.find('.interim-transcript').exists()).toBe(false)
  })

  it('handles long transcripts', () => {
    const longText =
      'This is a very long transcript that should be displayed properly in the speech output component. '.repeat(
        5,
      )

    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        finalTranscript: longText,
      },
    })

    const finalTranscript = wrapper.find('.final-transcript')
    expect(finalTranscript.exists()).toBe(true)
    expect(finalTranscript.text()).toContain('Final:')
    expect(finalTranscript.text()).toContain('This is a very long transcript')
  })

  it('maintains component structure', () => {
    const wrapper = mount(SpeechOutput, {
      props: defaultProps,
    })

    // Check main structure
    expect(wrapper.find('.speech-output-container').exists()).toBe(true)
    expect(wrapper.find('.speech-output-header').exists()).toBe(true)
    expect(wrapper.find('.speech-output-content').exists()).toBe(true)
    expect(wrapper.find('.speech-output-display').exists()).toBe(true)
  })

  it('handles special characters in transcripts', () => {
    const specialText = 'Hello! How are you? I\'m fine, thanks. "Great!"'

    const wrapper = mount(SpeechOutput, {
      props: {
        ...defaultProps,
        finalTranscript: specialText,
      },
    })

    const finalTranscript = wrapper.find('.final-transcript')
    expect(finalTranscript.text()).toContain(specialText)
  })

  it('displays listening state with transcripts', () => {
    const wrapper = mount(SpeechOutput, {
      props: {
        finalTranscript: 'Hello world',
        interimTranscript: 'Hello wo',
        isListening: true,
      },
    })

    expect(wrapper.find('.final-transcript').exists()).toBe(true)
    expect(wrapper.find('.interim-transcript').exists()).toBe(true)
    expect(wrapper.find('.listening-indicator').exists()).toBe(true)
  })
})
