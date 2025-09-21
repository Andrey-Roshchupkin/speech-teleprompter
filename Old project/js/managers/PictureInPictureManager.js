import { BaseManager } from './BaseManager.js';
import { stateManager } from './StateManager.js';

/**
 * Manages Picture-in-Picture functionality
 * Single Responsibility: Handle all PiP-related operations
 */
export class PictureInPictureManager extends BaseManager {
  constructor(debugLogger) {
    super(debugLogger);
    this.isInPiP = false;
    this.pipWindow = null;
    this.pipButton = null;
    this.teleprompterControls = null;
    this.teleprompterDisplay = null;
    this.teleprompterAttachment = null;
    this.savedDimensions = null; // Store element dimensions
  }

  /**
   * Initialize PiP manager
   */
  initialize(pipButton, teleprompterControls, teleprompterDisplay, teleprompterAttachment) {
    this.pipButton = pipButton;
    this.teleprompterControls = teleprompterControls;
    this.teleprompterDisplay = teleprompterDisplay;
    this.teleprompterAttachment = teleprompterAttachment;

    this.initializePiP();
    this.log('📺 PictureInPictureManager initialized');
  }

  /**
   * Initialize Document Picture-in-Picture functionality
   */
  initializePiP() {
    this.log('📺 Initializing Document PiP functionality...');
    this.log(`📺 PiP button element: ${this.pipButton}`);

    if (!this.pipButton) {
      this.log('📺 PiP button not found - checking DOM...');
      // Try to find the button again
      this.pipButton = document.getElementById('pipButton');
      this.log(`📺 Retry - PiP button element: ${this.pipButton}`);

      if (!this.pipButton) {
        this.log('📺 PiP button still not found - element may not exist in DOM');
        return;
      }
    }

    this.log(`📺 PiP button found: ${this.pipButton.id}`);
    this.log(`📺 Document Picture-in-Picture supported: ${!!window.documentPictureInPicture}`);

    // Check if Document Picture-in-Picture is supported
    if (!window.documentPictureInPicture) {
      this.pipButton.disabled = true;
      this.pipButton.title = 'Document Picture-in-Picture not supported in this browser';
      this.log('📺 Document Picture-in-Picture not supported');
      return;
    }

    // Add click event listener
    this.pipButton.addEventListener('click', (event) => {
      this.log('📺 PiP button clicked!');
      this.log(`📺 Click event: ${event.type}`);
      this.log(`📺 Event target: ${event.target}`);
      this.log(`📺 Current PiP state before toggle: ${this.isInPiP}`);
      this.toggleDocumentPiP();
    });

    // Test if button is clickable
    this.log(`📺 Button disabled state: ${this.pipButton.disabled}`);
    this.log(`📺 Button style display: ${window.getComputedStyle(this.pipButton).display}`);

    // Listen for Document PiP events (MDN approach)
    window.documentPictureInPicture.addEventListener('enter', (event) => {
      this.isInPiP = true;
      this.pipWindow = event.window;

      // Update StateManager
      stateManager.updateState(
        {
          isInPiP: true,
          pipWindow: this.pipWindow,
        },
        'PictureInPictureManager'
      );

      this.setupPiPWindow();
      this.updatePiPButton();
      this.log('📺 Entered Document Picture-in-Picture mode');
    });

    window.documentPictureInPicture.addEventListener('leave', (event) => {
      this.log('📺 Left Document Picture-in-Picture mode');
      this.log('📺 Leave event details:', event);

      // Move elements back BEFORE clearing pipWindow reference
      this.moveElementsBackToMainWindow();

      // Update state
      this.isInPiP = false;
      this.savedDimensions = null; // Clear saved dimensions
      this.updatePiPButton();

      // Update state in StateManager
      stateManager.updateState(
        {
          isInPiP: false,
          pipWindow: null,
        },
        'PictureInPictureManager'
      );

      // Clear PiP elements from StateManager
      stateManager.clearPiPElements();

      // Clear pipWindow reference last
      this.pipWindow = null;
    });

    // Add backup event listener for window close (in case 'leave' event doesn't fire)
    window.addEventListener('beforeunload', () => {
      if (this.isInPiP && this.pipWindow && !this.pipWindow.closed) {
        this.log('📺 Window closing - moving elements back as backup');
        this.moveElementsBackToMainWindow();
      }
    });

    this.updatePiPButton();
    this.log('📺 Document Picture-in-Picture initialized');

    // Add a fallback method to manually initialize if needed
    window.manualPiPInit = () => {
      this.log('📺 Manual PiP initialization triggered');
      this.initializePiP();
    };

    // Add a manual method to force move elements back (for debugging)
    window.forceMoveElementsBack = () => {
      this.log('📺 Force moving elements back triggered');
      this.moveElementsBackToMainWindow();
    };

    // Add periodic check for PiP window state (fallback)
    this.pipCheckInterval = setInterval(() => {
      if (this.isInPiP && this.pipWindow && this.pipWindow.closed) {
        this.log('📺 PiP window closed detected by periodic check');
        this.handlePiPClose();
      }
    }, 1000);
  }

  /**
   * Handle PiP window close (centralized cleanup)
   */
  handlePiPClose() {
    this.log('📺 Handling PiP close...');

    // Move elements back
    this.moveElementsBackToMainWindow();

    // Update state
    this.isInPiP = false;
    this.updatePiPButton();

    // Update StateManager
    stateManager.updateState(
      {
        isInPiP: false,
        pipWindow: null,
      },
      'PictureInPictureManager'
    );

    // Clear PiP elements from StateManager
    stateManager.clearPiPElements();

    // Clear references
    this.pipWindow = null;
    this.savedDimensions = null;

    this.log('📺 PiP close handled successfully');
  }

  /**
   * Toggle Document Picture-in-Picture mode
   */
  async toggleDocumentPiP() {
    this.log('📺 toggleDocumentPiP called!');
    this.log(`📺 Current PiP state: ${this.isInPiP}`);

    try {
      // Check if we're currently in PiP mode
      if (this.isInPiP && this.pipWindow && !this.pipWindow.closed) {
        this.log('📺 Closing existing PiP window...');
        this.log('📺 pipWindow exists:', !!this.pipWindow);
        this.log('📺 pipWindow closed:', this.pipWindow.closed);
        this.log(
          '📺 documentPictureInPicture.window exists:',
          !!window.documentPictureInPicture.window
        );

        // Use centralized close handler
        this.handlePiPClose();

        // Close the PiP window
        if (window.documentPictureInPicture.window) {
          window.documentPictureInPicture.window.close();
        }
        return;
      }

      this.log('📺 Opening new PiP window...');
      await this.openDocumentPiP();

      // Update state in StateManager
      stateManager.updateState(
        {
          isInPiP: this.isInPiP,
          pipWindow: this.pipWindow,
        },
        'PictureInPictureManager'
      );
    } catch (error) {
      this.log(`📺 Document PiP error: ${error.message}`);
      console.error('Document Picture-in-Picture error:', error);
    }
  }

  /**
   * Open Document Picture-in-Picture window
   */
  async openDocumentPiP() {
    this.log('📺 Opening Document PiP window...');

    try {
      // Save dimensions before moving elements (they might be 0 if already moved)
      if (!this.savedDimensions) {
        this.savedDimensions = {
          controlsHeight: this.teleprompterControls.clientHeight,
          displayHeight: this.teleprompterDisplay.clientHeight,
          displayWidth: this.teleprompterDisplay.clientWidth,
          attachmentHeight: this.teleprompterAttachment.clientHeight,
        };
        this.log(
          `📺 Saved dimensions: width=${this.savedDimensions.displayWidth}, heights=${this.savedDimensions.controlsHeight}+${this.savedDimensions.displayHeight}+${this.savedDimensions.attachmentHeight}`
        );
      }

      const totalHeight =
        this.savedDimensions.controlsHeight +
        this.savedDimensions.displayHeight +
        this.savedDimensions.attachmentHeight +
        50; // Extra padding

      // Ensure minimum dimensions to avoid API errors
      const minWidth = 300;
      const minHeight = 200;
      const finalWidth = Math.max(this.savedDimensions.displayWidth, minWidth);
      const finalHeight = Math.max(totalHeight, minHeight);

      this.log(`📺 Requesting PiP window: width=${finalWidth}, height=${finalHeight}`);

      // Request Document PiP window with saved dimensions
      this.pipWindow = await window.documentPictureInPicture.requestWindow({
        width: finalWidth,
        height: finalHeight,
      });

      this.log('📺 Document PiP window opened successfully');
    } catch (error) {
      this.log(`📺 Failed to open Document PiP window: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set up the Document PiP window content
   */
  setupPiPWindow() {
    if (!this.pipWindow) {
      this.log('📺 No PiP window to set up');
      return;
    }

    this.log('📺 Setting up PiP window content...');

    const pipDoc = this.pipWindow.document;

    // Copy style sheets over from the initial document so that the teleprompter looks the same
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        pipDoc.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipDoc.head.appendChild(link);
      }
    });

    // Move elements to PiP window (MDN approach)
    // This ensures perfect synchronization since elements are the same
    this.log(
      `📺 Moving elements to PiP: controls=${!!this.teleprompterControls}, display=${!!this
        .teleprompterDisplay}, attachment=${!!this.teleprompterAttachment}`
    );

    pipDoc.body.append(this.teleprompterControls);
    pipDoc.body.append(this.teleprompterDisplay);
    pipDoc.body.append(this.teleprompterAttachment);

    // Store references to moved elements
    this.pipMovedControls = this.teleprompterControls;
    this.pipMovedDisplay = this.teleprompterDisplay;
    this.pipMovedAttachment = this.teleprompterAttachment;

    this.log(`📺 Elements moved to PiP successfully. References stored.`);

    // Register moved elements with StateManager for synchronization
    stateManager.setPiPElements(
      this.teleprompterControls,
      this.teleprompterDisplay,
      this.teleprompterAttachment
    );

    // Force height recalculation and scroll position after moving to PiP window
    setTimeout(() => {
      this.log('📺 PiP window elements initialized with proper height and scroll position');
    }, 50);

    // No need to set up event listeners since we moved the original elements
    // All event listeners remain attached to the moved elements

    // Note: PiP windows cannot be programmatically resized due to browser security restrictions

    // Add beforeunload listener to PiP window to handle close button
    this.pipWindow.addEventListener('beforeunload', () => {
      this.log('📺 PiP window beforeunload event - moving elements back');
      this.handlePiPClose();
    });

    this.log('📺 PiP window setup complete');
  }

  /**
   * Set up controls in the PiP window
   */
  setupPiPControls() {
    // No need to set up controls since we're using the actual controls component
    // The event listeners are already attached to the moved elements
    this.log('📺 PiP controls setup complete - using moved component');
  }

  /**
   * Reattach event listeners for PiP window
   */
  reattachPiPEventListeners() {
    if (!this.pipWindow || this.pipWindow.closed) return;

    const pipDoc = this.pipWindow.document;

    // Get the settings inputs from the moved controls component
    const linesToShow = pipDoc.getElementById('linesToShow');
    const scrollTrigger = pipDoc.getElementById('scrollTrigger');
    const textSize = pipDoc.getElementById('textSize');
    const fuzzyPrecision = pipDoc.getElementById('fuzzyPrecision');

    this.log(
      `📺 Reattaching PiP event listeners: linesToShow=${!!linesToShow}, scrollTrigger=${!!scrollTrigger}, textSize=${!!textSize}, fuzzyPrecision=${!!fuzzyPrecision}`
    );

    // Reattach change event listeners
    if (linesToShow) {
      linesToShow.addEventListener('change', () => {
        this.log('📏 PiP Lines to show changed');
        // Read the actual values from the input elements
        const newLinesToShow = parseInt(linesToShow.value) || 5;
        const newScrollTrigger = parseInt(scrollTrigger?.value) || 3;
        const newTextSize = parseInt(textSize?.value) || 20;
        const newFuzzyPrecision = parseInt(fuzzyPrecision?.value) || 65;
        if (window.app && window.app.teleprompterDisplay) {
          window.app.teleprompterDisplay.updateSettings(
            newLinesToShow,
            newScrollTrigger,
            newTextSize
          );
        }
        // Update fuzzy matcher precision
        if (window.app && window.app.fuzzyMatcher) {
          window.app.fuzzyMatcher.setPrecision(newFuzzyPrecision);
        }
      });
    }

    if (scrollTrigger) {
      scrollTrigger.addEventListener('change', () => {
        this.log('📏 PiP Scroll trigger changed');
        // Read the actual values from the input elements
        const newLinesToShow = parseInt(linesToShow?.value) || 5;
        const newScrollTrigger = parseInt(scrollTrigger.value) || 3;
        const newTextSize = parseInt(textSize?.value) || 20;
        const newFuzzyPrecision = parseInt(fuzzyPrecision?.value) || 65;
        if (window.app && window.app.teleprompterDisplay) {
          window.app.teleprompterDisplay.updateSettings(
            newLinesToShow,
            newScrollTrigger,
            newTextSize
          );
        }
        // Update fuzzy matcher precision
        if (window.app && window.app.fuzzyMatcher) {
          window.app.fuzzyMatcher.setPrecision(newFuzzyPrecision);
        }
      });
    }

    if (textSize) {
      textSize.addEventListener('change', () => {
        this.log('📏 PiP Text size changed');
        // Read the actual values from the input elements
        const newLinesToShow = parseInt(linesToShow?.value) || 5;
        const newScrollTrigger = parseInt(scrollTrigger?.value) || 3;
        const newTextSize = parseInt(textSize.value) || 20;
        const newFuzzyPrecision = parseInt(fuzzyPrecision?.value) || 65;
        if (window.app && window.app.teleprompterDisplay) {
          window.app.teleprompterDisplay.updateSettings(
            newLinesToShow,
            newScrollTrigger,
            newTextSize
          );
        }
        // Update fuzzy matcher precision
        if (window.app && window.app.fuzzyMatcher) {
          window.app.fuzzyMatcher.setPrecision(newFuzzyPrecision);
        }
      });
    }

    if (fuzzyPrecision) {
      fuzzyPrecision.addEventListener('change', () => {
        this.log('🎯 PiP Fuzzy precision changed');
        // Read the actual values from the input elements
        const newLinesToShow = parseInt(linesToShow?.value) || 5;
        const newScrollTrigger = parseInt(scrollTrigger?.value) || 3;
        const newTextSize = parseInt(textSize?.value) || 20;
        const newFuzzyPrecision = parseInt(fuzzyPrecision.value) || 65;
        if (window.app && window.app.teleprompterDisplay) {
          window.app.teleprompterDisplay.updateSettings(
            newLinesToShow,
            newScrollTrigger,
            newTextSize
          );
        }
        // Update fuzzy matcher precision
        if (window.app && window.app.fuzzyMatcher) {
          window.app.fuzzyMatcher.setPrecision(newFuzzyPrecision);
        }
      });
    }

    this.log('📺 PiP event listeners reattached');
  }

  /**
   * Update PiP button state and appearance
   */
  updatePiPButton() {
    if (!this.pipButton) return;

    this.log(`📺 Updating PiP button: isInPiP=${this.isInPiP}`);

    if (this.isInPiP) {
      this.pipButton.textContent = '📺 Exit PiP';
      this.pipButton.title = 'Exit Picture-in-Picture';
      this.log('📺 PiP button set to: Exit PiP');
    } else {
      this.pipButton.textContent = '📺 PiP';
      this.pipButton.title = 'Open in Picture-in-Picture';
      this.log('📺 PiP button set to: PiP');
    }
  }

  /**
   * Move elements back to main window when PiP closes
   */
  moveElementsBackToMainWindow() {
    this.log('📺 Moving elements back to main window...');
    this.log('📺 Current pipWindow state:', this.pipWindow);
    this.log('📺 pipWindow closed?', this.pipWindow ? this.pipWindow.closed : 'no pipWindow');

    // Check if elements exist and are in PiP window
    if (!this.teleprompterControls || !this.teleprompterDisplay || !this.teleprompterAttachment) {
      this.log('⚠️ Elements not found, cannot move back');
      this.log('📺 Controls:', !!this.teleprompterControls);
      this.log('📺 Display:', !!this.teleprompterDisplay);
      this.log('📺 Attachment:', !!this.teleprompterAttachment);
      return;
    }

    // Check if elements are actually in PiP window
    const controlsInPiP =
      this.pipWindow && this.pipWindow.document.body.contains(this.teleprompterControls);
    const displayInPiP =
      this.pipWindow && this.pipWindow.document.body.contains(this.teleprompterDisplay);
    const attachmentInPiP =
      this.pipWindow && this.pipWindow.document.body.contains(this.teleprompterAttachment);

    // Check if elements are already in main window
    const controlsInMain = document.body.contains(this.teleprompterControls);
    const displayInMain = document.body.contains(this.teleprompterDisplay);
    const attachmentInMain = document.body.contains(this.teleprompterAttachment);

    this.log(
      `📺 Elements in PiP: controls=${controlsInPiP}, display=${displayInPiP}, attachment=${attachmentInPiP}`
    );
    this.log(
      `📺 Elements in Main: controls=${controlsInMain}, display=${displayInMain}, attachment=${attachmentInMain}`
    );

    // If elements are already in main window, nothing to do
    if (controlsInMain && displayInMain && attachmentInMain) {
      this.log('📺 All elements already in main window, nothing to move');
      return;
    }

    // Find the original container in main window
    const mainContainer = document.querySelector('.teleprompter-right-panel');
    if (!mainContainer) {
      this.log('⚠️ Main container not found, appending to body');
      if (controlsInPiP) {
        document.body.append(this.teleprompterControls);
        this.log('📺 Controls appended to body');
      }
      if (displayInPiP) {
        document.body.append(this.teleprompterDisplay);
        this.log('📺 Display appended to body');
      }
      if (attachmentInPiP) {
        document.body.append(this.teleprompterAttachment);
        this.log('📺 Attachment appended to body');
      }
    } else {
      this.log(`📺 Found right panel container: ${mainContainer.className}`);

      // Find the header element to insert after
      const header = mainContainer.querySelector('.teleprompter-header');
      if (header) {
        this.log('📺 Found header element, inserting elements after it');

        // Insert elements in correct order after header
        if (controlsInPiP) {
          header.insertAdjacentElement('afterend', this.teleprompterControls);
          this.log('📺 Controls inserted after header');
        }
        if (displayInPiP) {
          // Insert display after controls
          const controlsElement = mainContainer.querySelector('#teleprompterControls');
          if (controlsElement) {
            controlsElement.insertAdjacentElement('afterend', this.teleprompterDisplay);
            this.log('📺 Display inserted after controls');
          } else {
            mainContainer.append(this.teleprompterDisplay);
            this.log('📺 Display appended to main container (controls not found)');
          }
        }
        if (attachmentInPiP) {
          // Insert attachment after display
          const displayElement = mainContainer.querySelector('#teleprompterDisplay');
          if (displayElement) {
            displayElement.insertAdjacentElement('afterend', this.teleprompterAttachment);
            this.log('📺 Attachment inserted after display');
          } else {
            mainContainer.append(this.teleprompterAttachment);
            this.log('📺 Attachment appended to main container (display not found)');
          }
        }
      } else {
        this.log('⚠️ Header not found, appending to main container');
        // Fallback: append to main container
        if (controlsInPiP) {
          mainContainer.append(this.teleprompterControls);
          this.log('📺 Controls appended to main container');
        }
        if (displayInPiP) {
          mainContainer.append(this.teleprompterDisplay);
          this.log('📺 Display appended to main container');
        }
        if (attachmentInPiP) {
          mainContainer.append(this.teleprompterAttachment);
          this.log('📺 Attachment appended to main container');
        }
      }
    }

    // Clear references
    this.pipMovedControls = null;
    this.pipMovedDisplay = null;
    this.pipMovedAttachment = null;

    // Verify elements are in main window DOM
    const controlsInMainAfter = document.body.contains(this.teleprompterControls);
    const displayInMainAfter = document.body.contains(this.teleprompterDisplay);
    const attachmentInMainAfter = document.body.contains(this.teleprompterAttachment);

    this.log(
      `📺 Elements in main window after move: controls=${controlsInMainAfter}, display=${displayInMainAfter}, attachment=${attachmentInMainAfter}`
    );
    this.log('📺 Elements moved back to main window successfully');
  }

  /**
   * Set up event listeners for PiP window buttons (DEPRECATED - not needed with MDN approach)
   */
  setupPiPEventListeners() {
    if (!this.pipClonedControls) {
      this.log('📺 No PiP controls to set up event listeners');
      return;
    }

    this.log('📺 Setting up PiP event listeners...');

    // Toggle button
    const toggleButton = this.pipClonedControls.querySelector('#toggleButton');
    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        this.log('📺 PiP Toggle button clicked');
        // Trigger the same action in main window
        const mainToggleButton = this.teleprompterControls.querySelector('#toggleButton');
        if (mainToggleButton) {
          mainToggleButton.click();
        }
      });
    }

    // Reset button
    const resetButton = this.pipClonedControls.querySelector('#resetButton');
    if (resetButton) {
      resetButton.addEventListener('click', (event) => {
        this.log('📺 PiP Reset button clicked');
        // Trigger the same action in main window
        const mainResetButton = this.teleprompterControls.querySelector('#resetButton');
        if (mainResetButton) {
          mainResetButton.click();
        }
      });
    }

    // Settings inputs
    const inputs = this.pipClonedControls.querySelectorAll('input, select');
    inputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        this.log(`📺 PiP Input changed: ${input.id || input.name} = ${input.value}`);
        // Find corresponding input in main window and sync
        const mainInput = this.teleprompterControls.querySelector(`#${input.id}`);
        if (mainInput) {
          mainInput.value = input.value;
          // Trigger change event on main input
          mainInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    this.log('📺 PiP event listeners set up successfully');
  }

  /**
   * Update content in the PiP window
   */
  updatePiPContent() {
    if (!this.pipWindow || this.pipWindow.closed || !this.pipMovedDisplay) return;

    // No need to sync content since elements are the same
    // Content updates automatically since we're using the original elements
    this.log('📺 PiP content updated - using original elements (no sync needed)');
  }

  /**
   * Synchronize content between main window and PiP window
   */
  syncPiPContent() {
    if (!this.pipClonedDisplay || !this.pipClonedControls || !this.pipClonedAttachment) return;

    // Sync teleprompter display content
    this.pipClonedDisplay.innerHTML = this.teleprompterDisplay.innerHTML;
    this.pipClonedDisplay.scrollTop = this.teleprompterDisplay.scrollTop;

    // Sync controls state (buttons, inputs)
    this.syncPiPControls();

    // Sync attachment content
    this.pipClonedAttachment.innerHTML = this.teleprompterAttachment.innerHTML;
    this.pipClonedAttachment.style.display = this.teleprompterAttachment.style.display;
  }

  /**
   * Synchronize controls state between main and PiP windows
   */
  syncPiPControls() {
    if (!this.pipClonedControls) return;

    // Sync button states
    const mainStartBtn = this.teleprompterControls.querySelector('#startButton');
    const mainStopBtn = this.teleprompterControls.querySelector('#stopButton');
    const pipStartBtn = this.pipClonedControls.querySelector('#startButton');
    const pipStopBtn = this.pipClonedControls.querySelector('#stopButton');

    if (mainStartBtn && pipStartBtn) {
      pipStartBtn.disabled = mainStartBtn.disabled;
    }
    if (mainStopBtn && pipStopBtn) {
      pipStopBtn.disabled = mainStopBtn.disabled;
    }

    // Sync input values
    const mainInputs = this.teleprompterControls.querySelectorAll('input, select');
    const pipInputs = this.pipClonedControls.querySelectorAll('input, select');

    mainInputs.forEach((mainInput, index) => {
      if (pipInputs[index]) {
        pipInputs[index].value = mainInput.value;
        pipInputs[index].disabled = mainInput.disabled;
      }
    });
  }

  /**
   * Update attachment display in PiP window
   */
  updatePiPAttachmentDisplay(currentPosition, scriptWords, textSize) {
    if (!this.pipWindow || this.pipWindow.closed) return;

    this.log(`📺 Updating attachment display in PiP - position: ${currentPosition}`);

    // Sync attachment content from main window to PiP window
    this.syncPiPContent();
  }

  /**
   * Update button states in PiP window
   */
  updatePiPButtonStates() {
    // Sync button states from main window to PiP window
    this.syncPiPControls();
    this.log('📺 PiP button states synchronized with main window');
  }

  /**
   * Update PiP language settings state
   */
  updatePiPLanguageSettingsState(isListening) {
    if (!this.pipWindow || this.pipWindow.closed || !this.pipClonedControls) return;

    const primaryLanguage = this.pipClonedControls.querySelector('#primaryLanguage');

    if (primaryLanguage) {
      primaryLanguage.disabled = isListening;
      if (isListening) {
        primaryLanguage.title = 'Language settings disabled while listening';
      } else {
        primaryLanguage.title = 'Select primary language for speech recognition';
      }
    }

    this.log(`🌍 PiP Language settings ${isListening ? 'disabled' : 'enabled'}`);
  }

  /**
   * Check if currently in PiP mode
   */
  isInPictureInPicture() {
    return this.isInPiP;
  }

  /**
   * Get PiP window reference
   */
  getPiPWindow() {
    return this.pipWindow;
  }

  /**
   * Cleanup PiP resources
   */
  cleanup() {
    // Clear the periodic check interval
    if (this.pipCheckInterval) {
      clearInterval(this.pipCheckInterval);
      this.pipCheckInterval = null;
    }

    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
    }
    this.isInPiP = false;
    this.pipWindow = null;
  }
}
