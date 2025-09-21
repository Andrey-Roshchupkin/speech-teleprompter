import { BaseManager } from './BaseManager.js';
import { stateManager } from './StateManager.js';

/**
 * Manages scrolling and viewport operations
 * Single Responsibility: Handle all scrolling-related functionality
 */
export class ScrollManager extends BaseManager {
  constructor(debugLogger) {
    super(debugLogger);
    this.teleprompterText = null;
    this.teleprompterDisplay = null;
    this.scrollTrigger = 3;
    this.scrollCount = 0;
    this.topLinePosition = 0;
    this.lastScrollPosition = 0;
    this.linesToShow = 5;
    this.textSize = 24;
    this.firstLineMiddleY = null; // Absolute Y coordinate of first line middle
    this.lineHeight = null; // Height of one line
  }

  /**
   * Initialize scroll manager
   */
  initialize(teleprompterText, teleprompterDisplay) {
    this.teleprompterText = teleprompterText;
    this.teleprompterDisplay = teleprompterDisplay;
    this.updateFirstLineCoordinates();
    this.log('📜 ScrollManager initialized');
  }

  /**
   * Update first line coordinates (call when text size changes)
   */
  updateFirstLineCoordinates() {
    if (!this.teleprompterText) return;

    // Get the first word element
    const firstWordElement = this.teleprompterText.querySelector('span');
    if (!firstWordElement) return;

    // Get absolute coordinates of first word
    const firstWordRect = firstWordElement.getBoundingClientRect();
    const containerRect = this.teleprompterText.getBoundingClientRect();

    // Calculate middle Y of first line (relative to container)
    this.firstLineMiddleY =
      firstWordRect.top - containerRect.top + firstWordRect.height / 2;

    // Calculate line height
    this.lineHeight = firstWordRect.height;

    this.log(
      `📏 First line coordinates updated: middleY=${this.firstLineMiddleY.toFixed(
        2
      )}, lineHeight=${this.lineHeight.toFixed(2)}`
    );
  }

  /**
   * Update scroll settings
   */
  updateSettings(scrollTrigger, linesToShow, textSize) {
    const textSizeChanged = this.textSize !== textSize;
    this.scrollTrigger = scrollTrigger;
    this.linesToShow = linesToShow;
    this.textSize = textSize;

    // Update coordinates if text size changed
    if (textSizeChanged) {
      this.updateFirstLineCoordinates();
    }

    this.log(
      `⚙️ Scroll settings updated: scroll after ${scrollTrigger} lines, ${linesToShow} lines to show, text size ${textSize}px`
    );
  }

  /**
   * Update height of the teleprompter display
   */
  updateHeight() {
    if (!this.teleprompterDisplay) {
      this.log('⚠️ Teleprompter display element not found');
      return;
    }

    // Ensure the element is properly attached to the DOM
    if (!this.teleprompterDisplay.parentNode) {
      this.log('⚠️ Teleprompter display not attached to DOM');
      return;
    }

    // Get the correct window context (main window or PiP window)
    const windowContext =
      this.teleprompterDisplay.ownerDocument.defaultView || window;
    const computedStyle = windowContext.getComputedStyle(
      this.teleprompterDisplay
    );
    const actualLineHeight = parseFloat(computedStyle.lineHeight);
    const lineHeight = actualLineHeight || this.textSize * 1.17; // fallback to calculated value
    const padding = 24; // 12px top + 12px bottom padding

    // Calculate exact height for the specified number of lines
    // Use a very precise calculation to show exactly the specified number of lines
    const contentHeight = this.linesToShow * lineHeight;
    // Use only the base padding, no extra visibility adjustment
    const calculatedHeight = contentHeight + padding;

    // Set the height with !important to override any CSS interference
    this.teleprompterDisplay.style.setProperty(
      'height',
      `${calculatedHeight}px`,
      'important'
    );

    // Debug: Check what height was actually applied
    const actualHeight = windowContext.getComputedStyle(
      this.teleprompterDisplay
    ).height;
    const inlineHeight = this.teleprompterDisplay.style.height;

    this.log(
      `📏 Teleprompter height: calculated=${calculatedHeight}px, applied=${inlineHeight}, computed=${actualHeight} (${
        this.linesToShow
      } lines × ${lineHeight}px actual line height + ${padding}px padding) [Context: ${
        this.isInPiP ? 'PiP' : 'Main'
      }]`
    );
  }

  /**
   * Scroll to current position
   */
  scrollToCurrentPosition(currentPosition = 0) {
    this.log(
      `📜 scrollToCurrentPosition called with currentPosition=${currentPosition}, topLinePosition=${this.topLinePosition}`
    );
    if (!this.teleprompterText) {
      this.log('📜 Scroll skipped: teleprompterText element not found');
      return;
    }

    // Verify the element has scroll properties
    if (typeof this.teleprompterText.scrollTo !== 'function') {
      this.log('📜 Scroll skipped: element does not support scrollTo method');
      return;
    }

    // Ensure the element is properly initialized after being moved between windows
    if (
      !this.teleprompterText.scrollHeight ||
      this.teleprompterText.scrollHeight <= 0
    ) {
      this.log('📜 Element not ready for scrolling, forcing height update');
      this.updateHeight();
      // Give it a moment to update, then try again
      setTimeout(() => this.scrollToCurrentPosition(currentPosition), 50);
      return;
    }

    // Check CSS properties that might affect scrolling
    // Get the correct window context (main window or PiP window)
    const windowContext =
      this.teleprompterText.ownerDocument.defaultView || window;
    const computedStyle = windowContext.getComputedStyle(this.teleprompterText);
    const overflowY = computedStyle.overflowY;
    const overflowX = computedStyle.overflowX;
    const height = computedStyle.height;
    const maxHeight = computedStyle.maxHeight;

    this.log(
      `📜 Element CSS: overflowY=${overflowY}, overflowX=${overflowX}, height=${height}, maxHeight=${maxHeight} [Context: ${
        this.isInPiP ? 'PiP' : 'Main'
      }]`
    );

    // Calculate scroll position based on topLinePosition
    // Get the actual computed line height from the element (same as updateHeight)
    const actualLineHeight = parseFloat(computedStyle.lineHeight);
    const lineHeight = actualLineHeight || this.textSize * 1.17; // fallback to calculated value
    const targetScrollTop = this.topLinePosition * lineHeight;

    // Only scroll if the change is significant to avoid jitter
    const scrollDifference = Math.abs(
      targetScrollTop - this.lastScrollPosition
    );

    this.log(
      `📜 Scroll check: targetScrollTop=${targetScrollTop}px, lastScrollPosition=${this.lastScrollPosition}px, difference=${scrollDifference}px`
    );

    if (scrollDifference > 10) {
      this.lastScrollPosition = targetScrollTop;

      // Ensure we're scrolling the specific teleprompter display element
      const scrollTarget = Math.max(0, targetScrollTop);

      this.log(
        `📜 About to scroll element: ${
          this.teleprompterText.id || 'teleprompterText'
        } to position: ${scrollTarget}px`
      );

      // Use smooth scroll animation
      this.smoothScrollTo(scrollTarget);

      // Check viewport visibility after scrolling
      setTimeout(() => {
        this.checkViewportVisibility(currentPosition);
      }, 100); // Small delay to allow scroll to complete

      this.log(
        `📜 Scrolled to position: ${scrollTarget}px (topLinePosition: ${this.topLinePosition}, lineHeight: ${lineHeight}px)`
      );
    } else {
      this.log(
        `📜 Scroll skipped: difference ${scrollDifference}px is too small (threshold: 10px)`
      );
    }
  }

  /**
   * Check viewport visibility of scrolled content
   */
  checkViewportVisibility(currentPosition = 0) {
    if (!this.teleprompterText) {
      return;
    }

    // Get container dimensions and scroll position
    const containerRect = this.teleprompterText.getBoundingClientRect();
    const containerHeight = this.teleprompterText.clientHeight;
    const scrollTop = this.teleprompterText.scrollTop;
    const scrollHeight = this.teleprompterText.scrollHeight;

    // Get the window object that owns this element's document (handles PiP window case)
    const windowContext =
      this.teleprompterText.ownerDocument.defaultView || window;
    const lineHeight =
      parseFloat(
        windowContext.getComputedStyle(this.teleprompterText).lineHeight
      ) || this.textSize * 1.17;

    // Calculate visible line range based on actual scroll position
    const visibleTopLine = Math.floor(scrollTop / lineHeight);
    const visibleBottomLine = Math.floor(
      (scrollTop + containerHeight) / lineHeight
    );

    // Calculate expected visible line range based on topLinePosition
    const expectedTopLine = this.topLinePosition;
    const expectedBottomLine = this.topLinePosition + this.linesToShow - 1;

    // Check if current position is visible by finding the actual word element
    let isCurrentLineVisible = false;
    if (currentPosition >= 0) {
      // Find the word element at current position
      const wordElements = this.teleprompterDisplay.querySelectorAll('.word');
      if (wordElements[currentPosition]) {
        const wordElement = wordElements[currentPosition];
        const wordRect = wordElement.getBoundingClientRect();
        const containerRect = this.teleprompterDisplay.getBoundingClientRect();

        // Check if word is within visible area
        isCurrentLineVisible =
          wordRect.top >= containerRect.top &&
          wordRect.bottom <= containerRect.bottom;
      }
    }

    this.log(
      `👁️ Viewport check: containerHeight=${containerHeight}px, scrollTop=${scrollTop}px, scrollHeight=${scrollHeight}px`
    );

    this.log(
      `👁️ Line visibility: visible lines ${visibleTopLine}-${visibleBottomLine}, expected ${expectedTopLine}-${expectedBottomLine}, current line ${currentLine}`
    );

    this.log(
      `👁️ Current line visibility: line ${currentLine} (${currentLineTop}-${currentLineBottom}px) ${
        isCurrentLineVisible ? 'VISIBLE' : 'NOT VISIBLE'
      } in viewport (${scrollTop}-${scrollTop + containerHeight}px)`
    );

    // Check if we can scroll more
    const canScrollDown = scrollTop < scrollHeight - containerHeight;
    const canScrollUp = scrollTop > 0;

    this.log(
      `👁️ Scroll capability: can scroll down=${canScrollDown}, can scroll up=${canScrollUp}, max scroll=${
        scrollHeight - containerHeight
      }px`
    );
  }

  /**
   * Auto-scroll when reaching trigger point
   */
  autoScroll() {
    this.log(`🔄 Auto-scroll called - using absolute coordinates approach`);

    // Check if we have first line coordinates
    if (this.firstLineMiddleY === null || this.lineHeight === null) {
      this.log(
        `🔄 Auto-scroll: First line coordinates not available, updating...`
      );
      this.updateFirstLineCoordinates();
      if (this.firstLineMiddleY === null || this.lineHeight === null) {
        this.log(`🔄 Auto-scroll: Failed to get first line coordinates`);
        return;
      }
    }

    // Find the currently highlighted word element
    const currentWordElement = this.teleprompterText.querySelector(
      '.teleprompter-highlight'
    );
    if (!currentWordElement) {
      this.log(`🔄 Auto-scroll: No highlighted word element found`);
      return;
    }

    this.log(
      `🔄 Auto-scroll: Found highlighted element: "${currentWordElement.textContent}"`
    );

    // Get absolute coordinates of current word
    const wordRect = currentWordElement.getBoundingClientRect();
    const containerRect = this.teleprompterText.getBoundingClientRect();

    // Calculate middle Y of current word (relative to container)
    const currentWordMiddleY =
      wordRect.top - containerRect.top + wordRect.height / 2;

    // Calculate line number: difference in Y coordinates divided by line height + 1
    const lineDifference = currentWordMiddleY - this.firstLineMiddleY;
    const correction = 1;
    const currentLine =
      Math.floor(lineDifference / (this.lineHeight - correction)) + 1;

    this.log(
      `🔄 Auto-scroll: Coordinates - firstLineMiddleY=${this.firstLineMiddleY.toFixed(
        2
      )}, currentWordMiddleY=${currentWordMiddleY.toFixed(
        2
      )}, lineDifference=${lineDifference.toFixed(
        2
      )}, lineHeight=${this.lineHeight.toFixed(2)}, currentLine=${currentLine}`
    );

    // Check if we need to scroll
    // If current line is greater than scrollTrigger, we need to scroll
    if (currentLine > this.scrollTrigger) {
      // Calculate scroll distance: difference between first line and current cursor position
      const scrollDistance = currentWordMiddleY - this.firstLineMiddleY;

      this.log(
        `📜 Auto-scroll triggered! currentLine=${currentLine}, scrollTrigger=${
          this.scrollTrigger
        }, scrollDistance=${scrollDistance.toFixed(2)}`
      );

      // Update state in StateManager
      stateManager.updateState(
        {
          topLinePosition: this.topLinePosition + 1,
        },
        'ScrollManager'
      );

      // Update local state
      this.topLinePosition += 1;

      // Perform smooth scroll animation
      this.smoothScrollTo(this.teleprompterText.scrollTop + scrollDistance);

      this.log(`📜 Smooth scrolling by ${scrollDistance.toFixed(2)}px`);
    } else {
      this.log(
        `🔄 Auto-scroll: No scroll needed (currentLine=${currentLine} <= scrollTrigger=${this.scrollTrigger})`
      );
    }
  }

  /**
   * Smooth scroll to target position
   */
  smoothScrollTo(targetScrollTop) {
    if (!this.teleprompterText) {
      this.log('⚠️ Cannot smooth scroll: teleprompterText element not found');
      return;
    }

    const startScrollTop = this.teleprompterText.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const duration = 300; // Animation duration in milliseconds
    const startTime = performance.now();

    this.log(
      `🎬 Starting smooth scroll: ${startScrollTop.toFixed(
        2
      )} → ${targetScrollTop.toFixed(2)} (distance: ${distance.toFixed(2)}px)`
    );

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentScrollTop = startScrollTop + distance * easeOut;
      this.teleprompterText.scrollTop = currentScrollTop;
      this.lastScrollPosition = currentScrollTop;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        this.log(
          `🎬 Smooth scroll completed: final scrollTop=${this.teleprompterText.scrollTop.toFixed(
            2
          )}`
        );
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Reset scroll state
   */
  reset() {
    this.log('🔄 Starting scroll reset...');
    this.scrollCount = 0;
    this.topLinePosition = 0;
    this.lastScrollPosition = 0;

    // Reset first line coordinates
    this.firstLineMiddleY = null;
    this.lineHeight = null;

    // Force scroll to beginning
    if (this.teleprompterText) {
      this.log(
        `📜 Setting scrollTop to 0 on element: ${
          this.teleprompterText.id || 'teleprompterText'
        }`
      );
      // Use smooth scroll to top
      this.smoothScrollTo(0);

      // Also update the state in StateManager
      stateManager.updateState(
        {
          topLinePosition: 0,
          lastScrollPosition: 0,
          scrollCount: 0,
        },
        'ScrollManager'
      );

      this.log(
        `📜 After reset: scrollTop=${this.teleprompterText.scrollTop}, topLinePosition=${this.topLinePosition}`
      );
    } else {
      this.log('⚠️ teleprompterText element not found during reset');
    }

    this.log('🔄 Scroll state reset - scrolled to top');
  }

  /**
   * Get scroll trigger
   */
  getScrollTrigger() {
    return this.scrollTrigger;
  }

  /**
   * Get scroll count
   */
  getScrollCount() {
    return this.scrollCount;
  }

  /**
   * Get top line position
   */
  getTopLinePosition() {
    return this.topLinePosition;
  }

  /**
   * Sync scroll position from context (for PiP synchronization)
   */
  syncScrollPosition(newTopLinePosition) {
    if (this.topLinePosition !== newTopLinePosition) {
      this.log(
        `📜 Syncing scroll position: ${this.topLinePosition} → ${newTopLinePosition}`
      );
      this.topLinePosition = newTopLinePosition;
      this.scrollToCurrentPosition();
    }
  }
}
