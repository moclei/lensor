import { useEffect, useState, useRef, useCallback } from 'react';
import { debug } from '../../lib/debug';

const log = debug.observer;

// Simple debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Only debounce if the value actually changed
    if (value !== previousValueRef.current) {
      const handler = setTimeout(function () {
        setDebouncedValue(value);
      }, delay);

      previousValueRef.current = value;
      return () => {
        clearTimeout(handler);
      };
    }
    // Update ref for next comparison
    previousValueRef.current = value;
  }, [value, delay]);

  return debouncedValue;
}

interface ScrollOptions {
  debounceTime?: number;
  threshold?: number;
}

interface MutationOptions {
  debounceTime?: number;
  threshold?: number;
}

interface ResizeOptions {
  debounceTime?: number;
  threshold?: number;
}

interface UsePageObserversOptions {
  scrollOptions?: ScrollOptions;
  mutationOptions?: MutationOptions;
  resizeOptions?: ResizeOptions;
  // Keeping these for backward compatibility
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
  const defaultDebounceTime = 300;
  const defaultThreshold = 10;

  const {
    scrollOptions = {},
    mutationOptions = {},
    resizeOptions = {},
    debounceTime: globalDebounceTime = defaultDebounceTime,
    threshold: globalThreshold = defaultThreshold
  } = options;

  // Set options with fallbacks
  const scrollDebounceTime = scrollOptions.debounceTime ?? globalDebounceTime;
  const scrollThreshold = scrollOptions.threshold ?? globalThreshold;
  const mutationDebounceTime =
    mutationOptions.debounceTime ?? globalDebounceTime;
  const mutationThreshold = mutationOptions.threshold ?? globalThreshold;
  const resizeDebounceTime = resizeOptions.debounceTime ?? globalDebounceTime;
  const resizeThreshold = resizeOptions.threshold ?? globalThreshold;

  // State for tracking changes
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<number | null>(
    null
  );
  const [lastScrollPosition, setLastScrollPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track scores in state instead of refs - this allows the debounce to react to changes
  const [scrollChangeScore, setScrollChangeScore] = useState(0);
  const [mutationChangeScore, setMutationChangeScore] = useState(0);
  const [resizeChangeScore, setResizeChangeScore] = useState(0);

  // Use refs to track if we're currently processing a threshold event to prevent multiple calls
  const isProcessingScrollRef = useRef(false);
  const isProcessingMutationRef = useRef(false);
  const isProcessingResizeRef = useRef(false);

  // Previous scroll position for tracking changes
  const prevScrollPosRef = useRef({ x: 0, y: 0 });

  // Viewport size tracking
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Debounced scores
  const debouncedScrollScore = useDebounce(
    scrollChangeScore,
    scrollDebounceTime
  );
  const debouncedMutationScore = useDebounce(
    mutationChangeScore,
    mutationDebounceTime
  );
  const debouncedResizeScore = useDebounce(
    resizeChangeScore,
    resizeDebounceTime
  );

  // MutationObserver ref
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Handle scroll changes
  const handleScroll = useCallback(() => {
    const scrollPos = {
      x: window.scrollX,
      y: window.scrollY
    };

    // Calculate how much the user has scrolled
    const deltaX = Math.abs(scrollPos.x - prevScrollPosRef.current.x);
    const deltaY = Math.abs(scrollPos.y - prevScrollPosRef.current.y);

    // Update the previous position
    prevScrollPosRef.current = scrollPos;

    // Update last scroll position state
    setLastScrollPosition(scrollPos);

    // Increase the score based on scroll distance
    setScrollChangeScore((prev) => prev + deltaY * 0.1 + deltaX * 0.05);
  }, []);

  // Handle DOM mutations
  const handleDOMMutation = useCallback((mutations: MutationRecord[]) => {
    let scoreIncrement = 0;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        scoreIncrement += mutation.addedNodes.length * 2;
        scoreIncrement += mutation.removedNodes.length;
      } else if (mutation.type === 'attributes') {
        // Attribute changes (e.g., carousel image src, class changes) should
        // contribute meaningfully to the score. Previously 0.5 was too low
        // and required 280 attribute changes to trigger recapture.
        scoreIncrement += 2;
      }
    });

    setMutationChangeScore((prev) => prev + scoreIncrement);
  }, []);

  // Handle resize events
  const handleResize = useCallback(() => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    // Calculate the change
    const widthChange = Math.abs(currentWidth - viewportSize.width);
    const heightChange = Math.abs(currentHeight - viewportSize.height);

    // Update viewport size
    setViewportSize({
      width: currentWidth,
      height: currentHeight
    });

    // Update score based on size changes
    const scoreIncrement = widthChange * 0.1 + heightChange * 0.2;
    setResizeChangeScore((prev) => prev + scoreIncrement);
  }, [viewportSize]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Set up resize listener
  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Set up mutation observer
  useEffect(() => {
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
    };
  }, [handleDOMMutation]);

  // Process debounced scroll changes
  useEffect(() => {
    if (
      debouncedScrollScore > scrollThreshold &&
      !isProcessingScrollRef.current
    ) {
      log('Scroll threshold exceeded: %d', debouncedScrollScore);
      // Set processing flag to prevent multiple calls
      isProcessingScrollRef.current = true;

      // First update the timestamp
      setLastChangeTimestamp(Date.now());
      // Then trigger the callback
      onSignificantChange();
      // Reset the score with a small delay to ensure effects run in proper sequence
      setTimeout(() => {
        setScrollChangeScore(0);
        // Reset processing flag after score has been reset
        setTimeout(() => {
          isProcessingScrollRef.current = false;
        }, 50);
      }, 0);
    }
  }, [debouncedScrollScore, scrollThreshold, onSignificantChange]);

  // Process debounced mutation changes
  useEffect(() => {
    if (
      debouncedMutationScore > mutationThreshold &&
      !isProcessingMutationRef.current
    ) {
      log('Mutation threshold exceeded: %d', debouncedMutationScore);
      // Set processing flag to prevent multiple calls
      isProcessingMutationRef.current = true;

      setLastChangeTimestamp(Date.now());
      onSignificantChange();

      // Reset the score with a small delay to ensure effects run in proper sequence
      setTimeout(() => {
        setMutationChangeScore(0);
        // Reset processing flag after score has been reset
        setTimeout(() => {
          isProcessingMutationRef.current = false;
        }, 50);
      }, 0);
    }
  }, [debouncedMutationScore, mutationThreshold, onSignificantChange]);

  // Process debounced resize changes
  useEffect(() => {
    if (
      debouncedResizeScore > resizeThreshold &&
      !isProcessingResizeRef.current
    ) {
      log('Resize threshold exceeded: %d', debouncedResizeScore);
      // Set processing flag to prevent multiple calls
      isProcessingResizeRef.current = true;

      setLastChangeTimestamp(Date.now());
      onSignificantChange();

      // Reset the score with a small delay to ensure effects run in proper sequence
      setTimeout(() => {
        setResizeChangeScore(0);
        // Reset processing flag after score has been reset
        setTimeout(() => {
          isProcessingResizeRef.current = false;
        }, 50);
      }, 0);
    }
  }, [debouncedResizeScore, resizeThreshold, onSignificantChange]);

  return {
    lastChangeTimestamp,
    lastScrollPosition
  };
}
