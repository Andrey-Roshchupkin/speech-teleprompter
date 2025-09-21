import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useTeleprompterStore } from '@/stores/teleprompter';
import { useBroadcastSync } from './useBroadcastSync';
import { useLogManager } from './useLogManager';

export const usePictureInPicture = () => {
  const log = useLogManager();
  const store = useTeleprompterStore();
  const { syncPiPState, syncState, syncButtonClick } = useBroadcastSync();

  const pipWindow = ref<Window | null>(null);
  const isPiPSupported = ref(false);
  const isInPiP = computed(() => store.isInPiP);

  // Check PiP support
  const checkPiPSupport = (): void => {
    isPiPSupported.value = Boolean(
      window.documentPictureInPicture?.requestWindow
    );

    if (!isPiPSupported.value) {
      log.error('Document Picture-in-Picture not supported in this browser');
    } else {
      log.info('📺 Document Picture-in-Picture is supported');
    }
  };

  // Move existing teleprompter section to PiP (actual move, not clone)
  const moveTeleprompterToPiP = (): HTMLElement => {
    // Find the wrapper container (it should already exist in the DOM)
    const wrapper = document.querySelector(
      '.teleprompter-pip-wrapper'
    ) as HTMLElement;

    if (!wrapper) {
      throw new Error('Teleprompter wrapper not found');
    }

    // Find the teleprompter section inside the wrapper
    const teleprompterSection = wrapper.querySelector(
      '.teleprompter-section'
    ) as HTMLElement;

    if (!teleprompterSection) {
      throw new Error('Teleprompter section not found');
    }

    // Store reference to wrapper for restoration
    wrapper.setAttribute('data-original-wrapper', 'true');

    // Remove PiP button and header from the section before moving
    const pipButton = teleprompterSection.querySelector('#pip-button');
    if (pipButton) {
      pipButton.remove();
    }

    // Remove the entire header section
    const headerElement = teleprompterSection.querySelector(
      '.teleprompter-header'
    );
    if (headerElement) {
      headerElement.remove();
    }

    return teleprompterSection;
  };

  // Restore teleprompter section to main window
  const restoreTeleprompterToMain = (): void => {
    if (!pipWindow.value || pipWindow.value.closed) return;

    const pipContent = pipWindow.value.document.querySelector(
      '.teleprompter-section'
    );
    if (!pipContent) return;

    // Find the wrapper container in main window
    const wrapper = document.querySelector('[data-original-wrapper="true"]');
    if (!wrapper) return;

    // Move the section back to wrapper
    wrapper.appendChild(pipContent);

    // Restore header and PiP button
    const header = document.createElement('div');
    header.className = 'teleprompter-header';

    const title = document.createElement('h3');
    title.textContent = '📺 Teleprompter Display';
    header.appendChild(title);

    const pipButton = document.createElement('button');
    pipButton.id = 'pip-button';
    pipButton.className = 'pip-button';
    pipButton.innerHTML = '📺 PiP';
    pipButton.setAttribute('aria-label', 'Toggle Picture-in-Picture mode');
    pipButton.addEventListener('click', () => togglePiP());
    header.appendChild(pipButton);

    // Insert header at the beginning of the section
    pipContent.insertBefore(header, pipContent.firstChild);

    // Clean up markers
    wrapper.removeAttribute('data-original-wrapper');
  };

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
            padding: 15;
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
            padding: 15;
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
    `;
  };

  // Open PiP window
  const openPiP = async (): Promise<void> => {
    if (!isPiPSupported.value) {
      log.error('Document Picture-in-Picture not supported');
      return;
    }

    try {
      log.info('📺 Opening Document Picture-in-Picture window...');

      // Move the actual teleprompter section to PiP
      const teleprompterSection = moveTeleprompterToPiP();

      const pipContent = createPiPContent();
      const blob = new Blob([pipContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      pipWindow.value = await window.documentPictureInPicture.requestWindow({
        width: 400,
        height: 300,
      });

      // Set up the PiP window
      if (pipWindow.value) {
        pipWindow.value.document.write(pipContent);
        pipWindow.value.document.close();

        // Insert the actual teleprompter section into PiP window
        const pipContentContainer =
          pipWindow.value.document.getElementById('pip-content');
        if (pipContentContainer) {
          pipContentContainer.appendChild(teleprompterSection);
        }

        // Copy styles from main document
        const mainStyles = document.querySelectorAll(
          'style, link[rel="stylesheet"]'
        );
        mainStyles.forEach((style) => {
          if (style.tagName === 'STYLE') {
            const clonedStyle = style.cloneNode(true);
            pipWindow.value!.document.head.appendChild(clonedStyle);
          } else if (style.tagName === 'LINK') {
            const clonedLink = style.cloneNode(true);
            pipWindow.value!.document.head.appendChild(clonedLink);
          }
        });

        // No need to add close button - system provides one
      }

      // Clean up the blob URL
      URL.revokeObjectURL(url);

      // Update store and sync
      store.updatePiPState(true, pipWindow.value);
      syncPiPState(true, pipWindow.value);

      // Send initial state to PiP
      await nextTick();
      syncState();

      // Sync scroll position from main window to PiP
      syncScrollPosition();

      // Set up event listeners
      if (pipWindow.value) {
        pipWindow.value.addEventListener('pagehide', handlePiPClose);

        // Listen for window resize to recalculate scroll position
        pipWindow.value.addEventListener('resize', () => {
          // Debounce resize events
          setTimeout(() => {
            syncScrollPosition();
          }, 100);
        });
      }

      log.info('📺 Document Picture-in-Picture window opened successfully');
    } catch (error) {
      log.error(`Failed to open PiP window: ${error}`);
      throw error;
    }
  };

  // Close PiP window
  const closePiP = (): void => {
    if (pipWindow.value && !pipWindow.value.closed) {
      log.info('📺 Closing Document Picture-in-Picture window...');

      // Restore teleprompter display to main window before closing
      restoreTeleprompterToMain();

      if (pipWindow.value) {
        pipWindow.value.removeEventListener('pagehide', handlePiPClose);
        pipWindow.value.close();
        pipWindow.value = null;
      }

      // Update store and sync
      store.updatePiPState(false, null);
      syncPiPState(false, null);

      log.info('📺 Document Picture-in-Picture window closed');
    }
  };

  // Handle PiP window close
  const handlePiPClose = (): void => {
    log.info('📺 PiP window closed by user');
    // Restore teleprompter display to main window
    restoreTeleprompterToMain();
    // Update store and sync
    store.updatePiPState(false, null);
    syncPiPState(false, null);
    pipWindow.value = null;
  };

  // Toggle PiP mode
  const togglePiP = async (): Promise<void> => {
    if (isInPiP.value) {
      closePiP();
    } else {
      await openPiP();
    }
  };

  // Sync scroll position between main window and PiP
  const syncScrollPosition = (): void => {
    if (!pipWindow.value || pipWindow.value.closed) return;

    try {
      // Get the teleprompter text element in PiP window
      const pipTextElement = pipWindow.value.document.querySelector(
        '.teleprompter-text'
      ) as HTMLElement;
      if (!pipTextElement) return;

      // Calculate scroll position based on current word position using store
      const scrollPosition = store.calculatePiPScrollPosition(pipTextElement);

      // Apply the calculated position
      store.applyPiPScrollPosition(pipWindow.value);

      log.debug(
        `📺 PiP scroll position synchronized: ${scrollPosition.toFixed(2)}px`
      );
    } catch (error) {
      log.error(`Failed to sync scroll position: ${error}`);
    }
  };

  // Sync content between main window and PiP
  const syncPiPContent = (): void => {
    if (!pipWindow.value || pipWindow.value.closed) return;

    try {
      // Since we're moving the actual element, no need to sync content
      // The element maintains its state automatically
      log.debug('📺 PiP content synchronized (element moved, no sync needed)');
    } catch (error) {
      log.error(`Failed to sync PiP content: ${error}`);
    }
  };

  // Sync button states
  const syncButtonStates = (): void => {
    if (isInPiP.value) {
      // Sync current button states to PiP
      const toggleAction = store.isListening ? 'stop' : 'start';
      syncButtonClick('toggleButton', toggleAction);
    }
  };

  // Lifecycle
  onMounted(() => {
    checkPiPSupport();

    // Listen for button sync events
    const handleButtonSync = (event: CustomEvent) => {
      const { buttonId, action } = event.detail;

      if (buttonId === 'toggleButton' && action === 'toggle') {
        // Handle toggle button click from PiP
        log.info('📺 Toggle button clicked in PiP window');
        // This will be handled by the main component
        window.dispatchEvent(new CustomEvent('teleprompter-toggle-speech'));
      } else if (buttonId === 'resetButton' && action === 'reset') {
        // Handle reset button click from PiP
        log.info('📺 Reset button clicked in PiP window');
        window.dispatchEvent(new CustomEvent('teleprompter-reset'));
      }
    };

    window.addEventListener(
      'teleprompter-button-sync',
      handleButtonSync as EventListener
    );

    return () => {
      window.removeEventListener(
        'teleprompter-button-sync',
        handleButtonSync as EventListener
      );
    };
  });

  onUnmounted(() => {
    closePiP();
  });

  return {
    isPiPSupported,
    isInPiP,
    pipWindow,
    openPiP,
    closePiP,
    togglePiP,
    syncPiPContent,
    syncScrollPosition,
    syncButtonStates,
    checkPiPSupport,
    restoreTeleprompterToMain,
  };
};
