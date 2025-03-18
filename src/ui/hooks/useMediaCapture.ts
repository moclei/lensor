import { useState, useEffect, useCallback, useRef } from 'react';

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
  mediaStreamId: string | null,
  active: boolean,
  options: UseMediaCaptureOptions = {}
): UseMediaCaptureResult {
  const { autoCapture = true } = options;

  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activeImageCaptureRef = useRef<ImageCapture | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Clean up function
  const cleanupMediaCapture = useCallback(() => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error('Error stopping media stream tracks:', e);
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
      setIsCapturing(true);
      setError(null);

      try {
        // Clean up any existing capture
        cleanupMediaCapture();

        // Create a new media stream
        const media = await createMediaStream(streamId);

        if (!media) {
          throw new Error('Failed to create media stream');
        }

        mediaStreamRef.current = media;

        // Create and store the ImageCapture instance
        activeImageCaptureRef.current = new ImageCapture(
          media.getVideoTracks()[0]
        );

        // Auto-capture if enabled
        if (autoCapture) {
          await captureFrame();
        } else {
          setIsCapturing(false);
        }
      } catch (error) {
        console.error('Error setting up media capture:', error);
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
      setError(new Error('No active image capture available'));
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const rawBitmap = await activeImageCaptureRef.current.grabFrame();

      // Process the image (crop borders if needed)
      const cropMetrics = calculateImageBlackBorder(rawBitmap);
      const processedBitmap = await cropImageBlackBorder(
        rawBitmap,
        cropMetrics
      );

      setImageBitmap(processedBitmap);
    } catch (error) {
      console.error('Error capturing frame:', error);
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
    if (mediaStreamId && active) {
      setupMediaCapture(mediaStreamId);
    } else if (!active) {
      cleanupMediaCapture();
      setImageBitmap(null);
    }

    return () => {
      cleanupMediaCapture();
    };
  }, [mediaStreamId, active, setupMediaCapture, cleanupMediaCapture]);

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
    return media;
  } catch (error) {
    console.error('Error starting recording:', error);
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
