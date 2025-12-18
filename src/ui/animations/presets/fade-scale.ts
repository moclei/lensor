import { AnimationPreset } from '../types';

/**
 * Fade + Scale preset
 * 
 * A subtle, professional animation. Elements fade in while scaling
 * from slightly smaller (0.95) to full size. Quick and unobtrusive.
 */
export const fadeScale: AnimationPreset = {
  name: 'fade-scale',
  description: 'Subtle fade with slight scale up. Professional and quick.',
  
  handle: {
    hidden: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    visible: {
      opacity: 1,
      transform: 'scale(1)',
    },
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  },
  
  lenses: {
    hidden: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    visible: {
      opacity: 1,
      transform: 'scale(1)',
    },
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  },
  
  drawer: {
    hidden: {
      opacity: 0,
      // NOTE: Cannot use transform here - it overwrites the drawer's positioning transforms
      // (translateX(-50%) / translateY(-50%) used for centering)
    },
    visible: {
      opacity: 1,
    },
    // Slight delay after lens appears
    transition: 'opacity 0.15s ease-out 0.1s',
  },
};

