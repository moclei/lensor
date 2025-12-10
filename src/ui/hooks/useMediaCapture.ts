import { useState, useEffect, useCallback, useRef } from 'react';
import { useLensorState } from './useLensorState';
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

export function useMediaCapture(
  options: UseMediaCaptureOptions = {}
): UseMediaCaptureResult {
  const { useStateItem, callAction } = useLensorState();
  const { autoCapture = true } = options;

  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activeImageCaptureRef = useRef<ImageCapture | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [active] = useStateItem('active');

  const fetchMediaStreamId = async () => {
    log('Fetching media stream ID');
    const mediaStreamId = await callAction('getMediaStreamId');
    log('Received stream ID: %s', mediaStreamId);
    setupMediaCapture(mediaStreamId);
  };

  useEffect(() => {
    if (active) {
      fetchMediaStreamId();
    }
  }, [active]);

  // Clean up function
  const cleanupMediaCapture = useCallback(() => {
    log('Cleaning up media capture');
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error('[useMediaCapture] Error stopping media stream tracks:', e);
      }
      mediaStreamRef.current = null;
    }

    if (activeImageCaptureRef.current) {
      activeImageCaptureRef.current = null;
    }
  }, []);

  // Setup media capture
  const setupMediaCapture = useCallback(
    async (streamId: string) => {
      log('Setting up media capture');
      setIsCapturing(true);
      setError(null);

      try {
        cleanupMediaCapture();

        const media = await createMediaStream(streamId);

        if (!media) {
          throw new Error('Failed to create media stream');
        }

        log('Media stream created successfully');
        mediaStreamRef.current = media;
        activeImageCaptureRef.current = new ImageCapture(
          media.getVideoTracks()[0]
        );

        if (autoCapture) {
          await captureFrame();
        } else {
          setIsCapturing(false);
        }
      } catch (error) {
        console.error('[useMediaCapture] Error setting up media capture:', error);
        setError(
          error instanceof Error
            ? error
            : new Error('Unknown error in media capture setup')
        );
        setIsCapturing(false);
      }
    },
    [autoCapture, cleanupMediaCapture]
  );

  // Capture a frame
  const captureFrame = useCallback(async () => {
    if (!activeImageCaptureRef.current) {
      console.error('[useMediaCapture] No active image capture available');
      setError(new Error('No active image capture available'));
      return;
    }

    setIsCapturing(true);
    setError(null);

    // Wait for React to re-render and browser to paint (lens hidden)
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Additional delay for the tab capture stream to reflect the updated screen
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const rawBitmap = await activeImageCaptureRef.current.grabFrame();
      log('Frame captured');

      const cropMetrics = calculateImageBlackBorder(rawBitmap);
      const processedBitmap = await cropImageBlackBorder(rawBitmap, cropMetrics);

      setImageBitmap(processedBitmap);
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
  }, []);

  // Effect to handle changes to the media stream ID or active state
  useEffect(() => {
    if (mediaStreamRef.current && !active) {
      log('Active is false, cleaning up');
      cleanupMediaCapture();
      setImageBitmap(null);
    }

    return () => {
      cleanupMediaCapture();
    };
  }, [mediaStreamRef, active, setupMediaCapture, cleanupMediaCapture]);

  return {
    imageBitmap,
    isCapturing,
    captureFrame,
    error
  };
}

// Helper functions
async function createMediaStream(
  streamId: string
): Promise<MediaStream | null> {
  try {
    const media = await (navigator.mediaDevices as any).getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
    log('Media stream obtained');
    return media;
  } catch (error) {
    console.error('[useMediaCapture] Error starting recording:', error);
    return null;
  }
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
