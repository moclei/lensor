import React from 'react';
import Stepper, { zoomFormatter } from '../../components/stepper/Stepper';
import { useLensorState } from '../../../ui/hooks/useLensorState';

export const ZoomControl: React.FC<{
  minZoom: number;
  maxZoom: number;
  step: number;
}> = ({ minZoom, maxZoom, step }) => {
  const { useStateItem } = useLensorState();
  const [zoom, setZoom] = useStateItem('zoom');

  return (
    <Stepper
      value={zoom}
      onValueChange={setZoom}
      minValue={minZoom}
      maxValue={maxZoom}
      step={step}
      label="Zoom"
      formatter={zoomFormatter}
      incrementAriaLabel="Increase zoom"
      decrementAriaLabel="Decrease zoom"
    />
  );
};

export default ZoomControl;
