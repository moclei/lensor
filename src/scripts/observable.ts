import React from 'react';

export function observeDOMChanges(
  handleDOMChange: (changeScore: number) => void,
  handleTrigger?: () => void
) {
  let changeScore = 0;
  const weightFactors = {
    addedNodes: 1,
    removedNodes: 1,
    attributeChanges: 0.5,
    visibilityChanges: 2,
    displayChanges: 2
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        changeScore += mutation.addedNodes.length * weightFactors.addedNodes;
        changeScore +=
          mutation.removedNodes.length * weightFactors.removedNodes;
      } else if (mutation.type === 'attributes') {
        changeScore += weightFactors.attributeChanges;

        if (mutation.attributeName === 'visibility') {
          changeScore += weightFactors.visibilityChanges;
        } else if (mutation.attributeName === 'display') {
          changeScore += weightFactors.displayChanges;
        }
      }
    });

    if (changeScore >= 5) {
      handleDOMChange(changeScore);
      changeScore = 0;
    }
    // If triggerRecaptureState is provided and changeScore is significant
    if (handleTrigger) {
      handleTrigger();
    }
  });

  const observerConfig = {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['visibility', 'display']
  };

  observer.observe(document.documentElement, observerConfig);
}

export function observeScrollChange(
  handleScroll: (scrollPosition: { x: number; y: number }) => void,
  handleTrigger?: () => void,
  debounceTime = 250 // milliseconds
) {
  let timeoutId: number | null = null;
  let lastScrollPosition = { x: window.scrollX, y: window.scrollY };

  const handleScrollEvent = () => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = window.setTimeout(() => {
      const currentScrollPosition = {
        x: window.scrollX,
        y: window.scrollY
      };

      // Calculate scroll delta
      const scrollDelta = Math.abs(
        currentScrollPosition.x -
          lastScrollPosition.x +
          currentScrollPosition.y -
          lastScrollPosition.y
      );

      // If scroll has changed significantly
      if (scrollDelta > 50) {
        // Adjust threshold as needed
        handleScroll(currentScrollPosition);

        if (handleTrigger) {
          handleTrigger();
        }

        lastScrollPosition = currentScrollPosition;
      }
    }, debounceTime);
  };

  window.addEventListener('scroll', handleScrollEvent);

  // Return a cleanup function
  return () => {
    window.removeEventListener('scroll', handleScrollEvent);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}
