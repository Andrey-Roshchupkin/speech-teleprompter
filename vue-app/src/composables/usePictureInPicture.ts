import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTeleprompterStore } from '@/stores/teleprompter'
import { useBroadcastSync } from './useBroadcastSync'
import { useLogManager } from './useLogManager'

export function usePictureInPicture() {
  const log = useLogManager()
  const store = useTeleprompterStore()
  const { syncPiPState, syncState, syncButtonClick } = useBroadcastSync()

  const pipWindow = ref<Window | null>(null)
  const isPiPSupported = ref(false)
  const isInPiP = computed(() => store.isInPiP)

  // Check PiP support
  const checkPiPSupport = (): void => {
    isPiPSupported.value = Boolean(
      window.documentPictureInPicture && window.documentPictureInPicture.requestWindow,
    )

    if (!isPiPSupported.value) {
      log.error('Document Picture-in-Picture not supported in this browser')
    } else {
      log.info('📺 Document Picture-in-Picture is supported')
    }
  }

  // Move existing teleprompter section to PiP
  const moveTeleprompterToPiP = (): HTMLElement => {
    // Find the entire teleprompter section
    const teleprompterSection = document.querySelector('.teleprompter-section') as HTMLElement

    if (!teleprompterSection) {
      throw new Error('Teleprompter section not found')
    }

    // Clone the entire section
    const teleprompterClone = teleprompterSection.cloneNode(true) as HTMLElement
    teleprompterClone.classList.add('pip-clone')

    // Remove the header with PiP button from the clone
    const headerElement = teleprompterClone.querySelector('.teleprompter-header')
    if (headerElement) {
      headerElement.remove()
    }

    return teleprompterClone
  }

  // Create minimal PiP window content
  const createPiPContent = (): string => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teleprompter PiP</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .pip-content {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .pip-content::-webkit-scrollbar {
            display: none;
          }
          
          /* Import styles from main document */
          .pip-clone {
            /* Inherit styles from main document */
          }
        </style>
      </head>
      <body>
        <div class="pip-content" id="pip-content">
          <!-- Cloned teleprompter section will be inserted here -->
        </div>
        
        <script>
          // PiP window script
          let broadcastChannel = null;
          
          // Initialize broadcast channel
          if (window.BroadcastChannel) {
            broadcastChannel = new BroadcastChannel('teleprompter-sync');
            
            broadcastChannel.addEventListener('message', (event) => {
              const message = event.data;
              
              switch (message.type) {
                case 'state_update':
                  updateDisplay(message.data);
                  break;
                case 'button_click':
                  handleButtonSync(message.data);
                  break;
                case 'pip_toggle':
                  updatePiPState(message.data);
                  break;
              }
            });
          }
          
          function updateDisplay(data) {
            // The cloned elements will be updated automatically through DOM synchronization
            // This function can be used for additional updates if needed
          }
          
          function handleButtonSync(data) {
            // Handle button synchronization if needed
          }
          
          function updatePiPState(data) {
            // Handle PiP state changes if needed
          }
          
          // Handle window close
          window.addEventListener('beforeunload', () => {
            if (broadcastChannel) {
              broadcastChannel.postMessage({
                type: 'pip_toggle',
                source: 'pip',
                data: { isInPiP: false, pipWindow: null },
                timestamp: Date.now()
              });
            }
          });
        </script>
      </body>
      </html>
    `
  }

  // Open PiP window
  const openPiP = async (): Promise<void> => {
    if (!isPiPSupported.value) {
      log.error('Document Picture-in-Picture not supported')
      return
    }

    try {
      log.info('📺 Opening Document Picture-in-Picture window...')

      // Clone the entire teleprompter section
      const teleprompterClone = moveTeleprompterToPiP()

      const pipContent = createPiPContent()
      const blob = new Blob([pipContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)

      pipWindow.value = await window.documentPictureInPicture.requestWindow({
        width: 400,
        height: 300,
      })

      // Set up the PiP window
      if (pipWindow.value) {
        pipWindow.value.document.write(pipContent)
        pipWindow.value.document.close()

        // Insert cloned teleprompter section into PiP window
        const pipContentContainer = pipWindow.value.document.getElementById('pip-content')
        if (pipContentContainer) {
          pipContentContainer.appendChild(teleprompterClone)
        }

        // Copy styles from main document
        const mainStyles = document.querySelectorAll('style, link[rel="stylesheet"]')
        mainStyles.forEach((style) => {
          if (style.tagName === 'STYLE') {
            const clonedStyle = style.cloneNode(true)
            pipWindow.value!.document.head.appendChild(clonedStyle)
          } else if (style.tagName === 'LINK') {
            const clonedLink = style.cloneNode(true)
            pipWindow.value!.document.head.appendChild(clonedLink)
          }
        })
      }

      // Clean up the blob URL
      URL.revokeObjectURL(url)

      // Update store and sync
      store.updatePiPState(true, pipWindow.value)
      syncPiPState(true, pipWindow.value)

      // Send initial state to PiP
      await nextTick()
      syncState()

      // Set up event listeners
      if (pipWindow.value) {
        pipWindow.value.addEventListener('pagehide', handlePiPClose)
      }

      log.info('📺 Document Picture-in-Picture window opened successfully')
    } catch (error) {
      log.error(`Failed to open PiP window: ${error}`)
      throw error
    }
  }

  // Close PiP window
  const closePiP = (): void => {
    if (pipWindow.value && !pipWindow.value.closed) {
      log.info('📺 Closing Document Picture-in-Picture window...')

      if (pipWindow.value) {
        pipWindow.value.removeEventListener('pagehide', handlePiPClose)
        pipWindow.value.close()
        pipWindow.value = null
      }

      // Update store and sync
      store.updatePiPState(false, null)
      syncPiPState(false, null)

      log.info('📺 Document Picture-in-Picture window closed')
    }
  }

  // Handle PiP window close
  const handlePiPClose = (): void => {
    log.info('📺 PiP window closed by user')
    closePiP()
  }

  // Toggle PiP mode
  const togglePiP = async (): Promise<void> => {
    if (isInPiP.value) {
      closePiP()
    } else {
      await openPiP()
    }
  }

  // Sync content between main window and PiP
  const syncPiPContent = (): void => {
    if (!pipWindow.value || pipWindow.value.closed) return

    try {
      // Find the main teleprompter section and its clone in PiP
      const mainSection = document.querySelector('.teleprompter-section') as HTMLElement
      const pipSection = pipWindow.value.document.querySelector(
        '.teleprompter-section.pip-clone',
      ) as HTMLElement

      if (mainSection && pipSection) {
        // Sync the entire section content
        pipSection.innerHTML = mainSection.innerHTML

        // Sync scroll position if teleprompter display exists
        const mainDisplay = mainSection.querySelector('.teleprompter-display') as HTMLElement
        const pipDisplay = pipSection.querySelector('.teleprompter-display') as HTMLElement

        if (mainDisplay && pipDisplay) {
          pipDisplay.scrollTop = mainDisplay.scrollTop
        }
      }

      log.debug('📺 PiP content synchronized')
    } catch (error) {
      log.error(`Failed to sync PiP content: ${error}`)
    }
  }

  // Sync button states
  const syncButtonStates = (): void => {
    if (isInPiP.value) {
      // Sync current button states to PiP
      const toggleAction = store.isListening ? 'stop' : 'start'
      syncButtonClick('toggleButton', toggleAction)
    }
  }

  // Lifecycle
  onMounted(() => {
    checkPiPSupport()

    // Listen for button sync events
    const handleButtonSync = (event: CustomEvent) => {
      const { buttonId, action } = event.detail

      if (buttonId === 'toggleButton' && action === 'toggle') {
        // Handle toggle button click from PiP
        log.info('📺 Toggle button clicked in PiP window')
        // This will be handled by the main component
        window.dispatchEvent(new CustomEvent('teleprompter-toggle-speech'))
      } else if (buttonId === 'resetButton' && action === 'reset') {
        // Handle reset button click from PiP
        log.info('📺 Reset button clicked in PiP window')
        window.dispatchEvent(new CustomEvent('teleprompter-reset'))
      }
    }

    window.addEventListener('teleprompter-button-sync', handleButtonSync as EventListener)

    return () => {
      window.removeEventListener('teleprompter-button-sync', handleButtonSync as EventListener)
    }
  })

  onUnmounted(() => {
    closePiP()
  })

  return {
    isPiPSupported,
    isInPiP,
    pipWindow,
    openPiP,
    closePiP,
    togglePiP,
    syncPiPContent,
    syncButtonStates,
    checkPiPSupport,
  }
}
