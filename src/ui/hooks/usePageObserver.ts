import { useEffect, useCallback, useRef, useState } from 'react';

interface UsePageObserversOptions {
  debounceTime?: number;
  threshold?: number;
}

interface UsePageObserversResult {
  lastChangeTimestamp: number | null;
  lastScrollPosition: { x: number; y: number } | null;
}

export function usePageObservers(
  onSignificantChange: () => void,
  options: UsePageObserversOptions = {}
): UsePageObserversResult {
  const { debounceTime = 300, threshold = 10 } = options;

  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<number | null>(
    null
  );
  const [lastScrollPosition, setLastScrollPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const debounceTimerRef = useRef<number | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Track DOM change score
  const changeScoreRef = useRef(0);

  // Debounced handler
  const debouncedHandler = useCallback(() => {
    if (changeScoreRef.current > threshold) {
      console.log(
        'usePageObservers, debouncedHandler, changeScoreRef.current: ',
        changeScoreRef.current
      );
      setLastChangeTimestamp(Date.now());
      onSignificantChange();
    }
    changeScoreRef.current = 0;
  }, [onSignificantChange, threshold]);

  // DOM change observer
  useEffect(() => {
    // Mutation observer callback
    const handleDOMMutation = (mutations: MutationRecord[]) => {
      // Weight different types of mutations
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          changeScoreRef.current += mutation.addedNodes.length * 2;
          changeScoreRef.current += mutation.removedNodes.length;
        } else if (mutation.type === 'attributes') {
          changeScoreRef.current += 0.5;
        }
      });

      // Clear any existing timer
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      console.log(
        'usePageObservers, handleDOMMutation, changeScoreRef.current: ',
        changeScoreRef.current
      );
      // Set new timer
      debounceTimerRef.current = window.setTimeout(
        debouncedHandler,
        debounceTime
      );
    };

    // Create and attach mutation observer
    mutationObserverRef.current = new MutationObserver(handleDOMMutation);
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedHandler, debounceTime]);

  // Scroll observer
  useEffect(() => {
    // Scroll handler
    const handleScroll = () => {
      const scrollPosition = {
        x: window.scrollX,
        y: window.scrollY
      };

      setLastScrollPosition(scrollPosition);

      // Clear any existing timer
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      // Add to change score
      changeScoreRef.current += 5;

      console.log(
        'usePageObservers, handleScroll, changeScoreRef.current: ',
        changeScoreRef.current
      );

      // Set new timer
      debounceTimerRef.current = window.setTimeout(
        debouncedHandler,
        debounceTime
      );
    };

    // Attach scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedHandler, debounceTime]);

  return {
    lastChangeTimestamp,
    lastScrollPosition
  };
}
