import { useState, useEffect, useCallback, useRef } from 'react';
import { useLensorState } from './useLensorState';

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
  console.log('[useMediaCapture] Hook called');

  const { useStateItem, callAction } = useLensorState();
  const { autoCapture = true } = options;

  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activeImageCaptureRef = useRef<ImageCapture | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [active] = useStateItem('active');

  console.log('[useMediaCapture] Defining fetchMediaStreamId');
  const fetchMediaStreamId = async () => {
    console.log('[useMediaCapture] calling fetchMediaStreamId');
    const mediaStreamId = await callAction('getMediaStreamId');
    console.log('[useMediaCapture] Media stream id:', mediaStreamId);
    setupMediaCapture(mediaStreamId);
  };

  useEffect(() => {
    if (active) {
      console.log(
        '[useMediaCapture] active is true, calling fetchMediaStreamId'
      );
      fetchMediaStreamId();
    }
  }, [active]);

  // Clean up function
  const cleanupMediaCapture = useCallback(() => {
    console.log('[useMediaCapture] Cleaning up media capture');
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        console.log('[useMediaCapture] Media stream tracks stopped');
      } catch (e) {
        console.error(
          '[useMediaCapture] Error stopping media stream tracks:',
          e
        );
      }
      mediaStreamRef.current = null;
    }

    if (activeImageCaptureRef.current) {
      activeImageCaptureRef.current = null;
      console.log('[useMediaCapture] Image capture reference cleared');
    }
  }, []);

  // Setup media capture
  const setupMediaCapture = useCallback(
    async (streamId: string) => {
      console.log(
        '[useMediaCapture] Setting up media capture with streamId:',
        streamId
      );
      setIsCapturing(true);
      setError(null);

      try {
        // Clean up any existing capture
        cleanupMediaCapture();

        // Create a new media stream
        console.log('[useMediaCapture] Creating media stream');
        const media = await createMediaStream(streamId);

        if (!media) {
          throw new Error('Failed to create media stream');
        }

        console.log('[useMediaCapture] Media stream created successfully');
        mediaStreamRef.current = media;

        // Create and store the ImageCapture instance
        console.log('[useMediaCapture] Creating ImageCapture instance');
        activeImageCaptureRef.current = new ImageCapture(
          media.getVideoTracks()[0]
        );

        // Auto-capture if enabled
        if (autoCapture) {
          console.log(
            '[useMediaCapture] Auto-capture enabled, capturing frame'
          );
          await captureFrame();
        } else {
          setIsCapturing(false);
        }
      } catch (error) {
        console.error(
          '[useMediaCapture] Error setting up media capture:',
          error
        );
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
    console.log('[useMediaCapture] captureFrame called');
    if (!activeImageCaptureRef.current) {
      console.error('[useMediaCapture] No active image capture available');
      setError(new Error('No active image capture available'));
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      console.log('[useMediaCapture] Grabbing frame');
      const rawBitmap = await activeImageCaptureRef.current.grabFrame();
      console.log('[useMediaCapture] Frame grabbed successfully');

      // Process the image (crop borders if needed)
      const cropMetrics = calculateImageBlackBorder(rawBitmap);
      console.log('[useMediaCapture] Calculated crop metrics:', cropMetrics);

      const processedBitmap = await cropImageBlackBorder(
        rawBitmap,
        cropMetrics
      );
      console.log('[useMediaCapture] Image processed, setting bitmap');

      setImageBitmap(processedBitmap);
      console.log('[useMediaCapture] imageBitmap state updated');
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
    console.log('[useMediaCapture] Media stream or active state changed:', {
      mediaStreamRef: mediaStreamRef.current,
      active,
      hasImageBitmap: !!imageBitmap
    });
    if (mediaStreamRef.current && !active) {
      console.log('[useMediaCapture] Active is false, cleaning up');
      cleanupMediaCapture();
      console.log('[useMediaCapture] Clearing imageBitmap');
      setImageBitmap(null);
    }

    return () => {
      console.log('[useMediaCapture] Effect cleanup running');
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
    console.log(
      '[useMediaCapture] Getting user media with streamId:',
      streamId
    );
    const media = await (navigator.mediaDevices as any).getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
    console.log('[useMediaCapture] Media stream obtained successfully');
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

  console.log('[useMediaCapture] Cropping image border:', {
    originalWidth,
    originalHeight,
    newWidth,
    newHeight
  });

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
  console.log('[useMediaCapture] Image cropped successfully');

  return croppedBitmap;
}
