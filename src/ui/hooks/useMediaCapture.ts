import { useState, useEffect, useCallback, useRef } from 'react';
import { useCrannState, useCrannActions } from './useLensorState';
import { debug } from '../../lib/debug';

const log = debug.capture;

// Types
type BorderCropProps = {
  possibleLetterboxing: boolean;
  possiblePillarboxing: boolean;
  estimatedTopBottomBorderHeight: number;
  estimatedLeftRightBorderWidth: number;
};

interface UseMediaCaptureOptions {
  autoCapture?: boolean;
}

interface UseMediaCaptureResult {
  imageBitmap: ImageBitmap | null;
  isCapturing: boolean;
  captureFrame: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for capturing tab screenshots using chrome.tabs.captureVisibleTab.
 *
 * This approach captures single screenshots instead of maintaining a continuous
 * video stream, which:
 * - Eliminates the persistent "recording" indicator in Chrome
 * - Uses less resources when idle
 * - Has a rate limit of 2 captures per second (enforced by Chrome)
 */
export function useMediaCapture(
  options: UseMediaCaptureOptions = {}
): UseMediaCaptureResult {
  const { autoCapture = true } = options;

  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [isCapturingLocal, setIsCapturingLocal] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sync isCapturing to Crann state (for components that need to know capture is in progress)
  const [, setIsCapturingState] = useCrannState('isCapturing');
  // Separate state for flash animation (triggers before capture to avoid flash in screenshot)
  const [, setIsFlashing] = useCrannState('isFlashing');

  // Track the current bitmap so we can close it when replaced
  const currentBitmapRef = useRef<ImageBitmap | null>(null);

  const [active] = useCrannState('active');

  // Get the captureTab action
  const { captureTab } = useCrannActions();

  // Helper to set both local and shared state
  const setIsCapturing = (value: boolean) => {
    setIsCapturingLocal(value);
    setIsCapturingState(value);
  };

  // Time to wait for flash animation to fade before capturing (ms)
  // The full-screen overlay fades in 200ms, so 250ms ensures it's completely gone
  const FLASH_FADE_DELAY_MS = 250;

  // Time to wait for lens to hide via CSS transition (opacity 0.2s = 200ms)
  // Adding buffer for React state update + browser paint
  const LENS_HIDE_DELAY_MS = 250;

  // Capture a frame using captureVisibleTab
  const captureFrame = useCallback(async () => {
    log('Capturing frame via captureVisibleTab');
    setError(null);

    // Step 1: Trigger flash animation (visual feedback for user)
    setIsFlashing(true);

    // Step 2: Wait for flash to fade before capturing
    // This ensures the flash effect doesn't appear in the screenshot
    await new Promise((resolve) => setTimeout(resolve, FLASH_FADE_DELAY_MS));

    // Step 3: Clear flash state and hide lens for capture
    // Setting isCapturing to true triggers CSS opacity transition in useCanvasLifecycle
    setIsFlashing(false);
    setIsCapturing(true);

    // Wait for CSS opacity transition to complete (lens becomes invisible)
    // The transition is 200ms, we add buffer for React state propagation + browser paint
    await new Promise((resolve) => setTimeout(resolve, LENS_HIDE_DELAY_MS));

    try {
      // Call the service worker action to capture the tab
      console.log('[useMediaCapture] About to call captureTab()');
      let dataUrl;
      try {
        dataUrl = await captureTab();
        console.log(
          '[useMediaCapture] captureTab() returned:',
          typeof dataUrl,
          dataUrl ? `length: ${dataUrl.length}` : 'null/undefined'
        );
      } catch (rpcError) {
        console.error('[useMediaCapture] captureTab() threw error:', rpcError);
        throw rpcError;
      }

      if (!dataUrl) {
        throw new Error('Failed to capture tab - no data URL returned');
      }

      log('Received data URL, converting to ImageBitmap');

      // Convert data URL to ImageBitmap
      const rawBitmap = await dataUrlToImageBitmap(dataUrl);

      log(
        'Frame captured, dimensions: %dx%d',
        rawBitmap.width,
        rawBitmap.height
      );

      // Calculate and crop black borders (letterboxing/pillarboxing)
      const cropMetrics = calculateImageBlackBorder(rawBitmap);
      const processedBitmap = await cropImageBlackBorder(
        rawBitmap,
        cropMetrics
      );

      // Close the old bitmap before setting new one (prevent memory leak)
      if (currentBitmapRef.current) {
        currentBitmapRef.current.close();
      }

      currentBitmapRef.current = processedBitmap;
      setImageBitmap(processedBitmap);
      console.log(
        '[useMediaCapture] Successfully set imageBitmap:',
        processedBitmap.width,
        'x',
        processedBitmap.height
      );
    } catch (error) {
      console.error('[useMediaCapture] Error capturing frame:', error);
      setError(
        error instanceof Error
          ? error
          : new Error('Unknown error in frame capture')
      );
    } finally {
      setIsCapturing(false);
    }
  }, [captureTab, setIsFlashing]);

  // Auto-capture when active becomes true
  useEffect(() => {
    if (active && autoCapture) {
      captureFrame();
    }
  }, [active, autoCapture, captureFrame]);

  // Cleanup when active becomes false or component unmounts
  useEffect(() => {
    if (!active && currentBitmapRef.current) {
      log('Active is false, cleaning up bitmap');
      currentBitmapRef.current.close();
      currentBitmapRef.current = null;
      setImageBitmap(null);
    }

    return () => {
      // Cleanup on unmount
      if (currentBitmapRef.current) {
        currentBitmapRef.current.close();
        currentBitmapRef.current = null;
      }
    };
  }, [active]);

  return {
    imageBitmap,
    isCapturing: isCapturingLocal,
    captureFrame,
    error
  };
}

// Helper functions

/**
 * Convert a data URL to an ImageBitmap.
 * This is the bridge between captureVisibleTab (returns data URL) and our canvas pipeline.
 */
async function dataUrlToImageBitmap(dataUrl: string): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        // createImageBitmap is the efficient way to get GPU-ready image data
        const bitmap = await createImageBitmap(img);
        resolve(bitmap);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image from data URL'));
    };

    img.src = dataUrl;
  });
}

function calculateImageBlackBorder(imageBitmap: ImageBitmap): BorderCropProps {
  // Window dimensions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const windowAspectRatio = windowWidth / windowHeight;

  // Captured image dimensions
  const captureWidth = imageBitmap.width;
  const captureHeight = imageBitmap.height;
  const widthScaleFactor = captureWidth / windowWidth;
  const heightScaleFactor = captureHeight / windowHeight;

  // Default values
  let possibleLetterboxing = false;
  let possiblePillarboxing = false;
  let estimatedTopBottomBorderHeight = 0;
  let estimatedLeftRightBorderWidth = 0;

  if (widthScaleFactor < heightScaleFactor) {
    possibleLetterboxing = true;

    // Calculate letterboxing (black bars on top/bottom)
    const expectedHeight = captureWidth / windowAspectRatio;
    const totalBorderHeight = captureHeight - expectedHeight;
    estimatedTopBottomBorderHeight = totalBorderHeight / 2;
  } else {
    possiblePillarboxing = true;

    // Calculate pillarboxing (black bars on left/right)
    const expectedWidth = captureHeight * windowAspectRatio;
    const totalBorderWidth = captureWidth - expectedWidth;
    estimatedLeftRightBorderWidth = totalBorderWidth / 2;
  }

  return {
    possibleLetterboxing,
    possiblePillarboxing,
    estimatedTopBottomBorderHeight,
    estimatedLeftRightBorderWidth
  };
}

async function cropImageBlackBorder(
  sourceBitmap: ImageBitmap,
  cropMetrics: BorderCropProps
): Promise<ImageBitmap> {
  // Calculate the new dimensions
  const originalWidth = sourceBitmap.width;
  const originalHeight = sourceBitmap.height;
  const newHeight =
    originalHeight - cropMetrics.estimatedTopBottomBorderHeight * 2;
  const newWidth =
    originalWidth - cropMetrics.estimatedLeftRightBorderWidth * 2;

  // Create a new ImageBitmap with the cropped dimensions
  const croppedBitmap = await createImageBitmap(
    sourceBitmap,
    cropMetrics.estimatedLeftRightBorderWidth,
    cropMetrics.estimatedTopBottomBorderHeight,
    newWidth,
    newHeight,
    {
      resizeWidth: newWidth,
      resizeHeight: newHeight,
      resizeQuality: 'high'
    }
  );

  sourceBitmap.close();

  return croppedBitmap;
}
