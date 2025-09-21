import { ref, onMounted, onUnmounted } from 'vue'
import { useTeleprompterStore } from '@/stores/teleprompter'
import { useLogManager } from './useLogManager'

export interface BroadcastMessage {
  type: 'state_update' | 'button_click' | 'settings_change' | 'pip_toggle'
  source: 'main' | 'pip'
  data: any
  timestamp: number
}

export function useBroadcastSync() {
  const log = useLogManager()
  const store = useTeleprompterStore()

  const channel = ref<BroadcastChannel | null>(null)
  const isConnected = ref(false)
  const lastMessageTime = ref(0)

  // Prevent message loops - ignore messages from same source within 100ms
  const MESSAGE_DEBOUNCE_MS = 100

  const initializeChannel = (): void => {
    if (!window.BroadcastChannel) {
      log.error('BroadcastChannel not supported in this browser')
      return
    }

    try {
      channel.value = new BroadcastChannel('teleprompter-sync')
      isConnected.value = true

      channel.value.addEventListener('message', handleMessage)

      log.info('📡 BroadcastChannel initialized for teleprompter sync')
    } catch (error) {
      log.error(`Failed to initialize BroadcastChannel: ${error}`)
    }
  }

  const handleMessage = (event: MessageEvent<BroadcastMessage>): void => {
    const message = event.data

    // Prevent message loops
    const now = Date.now()
    if (now - lastMessageTime.value < MESSAGE_DEBOUNCE_MS) {
      return
    }
    lastMessageTime.value = now

    log.debug(`📡 Received broadcast: ${message.type} from ${message.source}`)

    switch (message.type) {
      case 'state_update':
        handleStateUpdate(message.data)
        break
      case 'button_click':
        handleButtonClick(message.data)
        break
      case 'settings_change':
        handleSettingsChange(message.data)
        break
      case 'pip_toggle':
        handlePiPToggle(message.data)
        break
    }
  }

  const handleStateUpdate = (data: any): void => {
    const { currentPosition, matchedWords, isListening, recognitionStatus } = data

    if (currentPosition !== undefined) {
      store.updatePosition(currentPosition)
    }

    if (matchedWords !== undefined) {
      store.updateMatchedWords(matchedWords)
    }

    if (isListening !== undefined || recognitionStatus !== undefined) {
      store.updateSpeechState(isListening, recognitionStatus)
    }

    log.debug('📡 State synchronized from broadcast')
  }

  const handleButtonClick = (data: any): void => {
    const { buttonId, action } = data

    log.debug(`📡 Button click synchronized: ${buttonId} - ${action}`)

    // Emit custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent('teleprompter-button-sync', {
        detail: { buttonId, action },
      }),
    )
  }

  const handleSettingsChange = (data: any): void => {
    store.updateSettings(data)
    log.debug('📡 Settings synchronized from broadcast')
  }

  const handlePiPToggle = (data: any): void => {
    const { isInPiP, hasWindow } = data
    store.updatePiPState(isInPiP, hasWindow ? window : null)
    log.debug(`📡 PiP state synchronized: ${isInPiP}`)
  }

  const broadcastMessage = (type: BroadcastMessage['type'], data: any): void => {
    if (!channel.value || !isConnected.value) {
      log.error('Cannot broadcast: channel not connected')
      return
    }

    const message: BroadcastMessage = {
      type,
      source: store.isInPiP ? 'pip' : 'main',
      data,
      timestamp: Date.now(),
    }

    try {
      channel.value.postMessage(message)
      log.debug(`📡 Broadcasted: ${type}`)
    } catch (error) {
      log.error(`Failed to broadcast message: ${error}`)
    }
  }

  // Public methods for components to use
  const syncState = (): void => {
    const stateData = {
      currentPosition: store.currentPosition,
      matchedWords: [...store.matchedWords], // Create a copy of the array
      isListening: store.isListening,
      recognitionStatus: store.recognitionStatus,
      scriptText: store.scriptText,
      progress: store.progress,
      scriptWords: [...store.scriptWords], // Create a copy of the array
      currentAttachment: store.currentAttachment
        ? {
            name: store.currentAttachment.name,
            content: store.currentAttachment.content,
            startWordIndex: store.currentAttachment.startWordIndex,
            endWordIndex: store.currentAttachment.endWordIndex,
          }
        : null,
    }

    broadcastMessage('state_update', stateData)
  }

  const syncButtonClick = (buttonId: string, action: string): void => {
    broadcastMessage('button_click', { buttonId, action })
  }

  const syncSettings = (settings: any): void => {
    broadcastMessage('settings_change', settings)
  }

  const syncPiPState = (isInPiP: boolean, pipWindow: Window | null = null): void => {
    broadcastMessage('pip_toggle', { isInPiP, hasWindow: !!pipWindow })
  }

  const closeChannel = (): void => {
    if (channel.value) {
      channel.value.removeEventListener('message', handleMessage)
      channel.value.close()
      channel.value = null
      isConnected.value = false
      log.info('📡 BroadcastChannel closed')
    }
  }

  // Lifecycle
  onMounted(() => {
    initializeChannel()
  })

  onUnmounted(() => {
    closeChannel()
  })

  return {
    isConnected,
    syncState,
    syncButtonClick,
    syncSettings,
    syncPiPState,
    broadcastMessage,
    closeChannel,
  }
}
