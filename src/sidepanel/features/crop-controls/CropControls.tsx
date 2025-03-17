import Stepper, {
  cropOffsetFormatter
} from '@/sidepanel/components/stepper/Stepper';
import { useLensorState } from '@/ui/hooks/useLensorState';
import React from 'react';
import { styled } from 'styled-components';

const CropControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CropControls: React.FC = () => {
  const { useStateItem } = useLensorState();
  const [imageCropX, setImageCropX] = useStateItem('imageCropX');
  const [imageCropY, setImageCropY] = useStateItem('imageCropY');

  return (
    <CropControlsContainer>
      <Stepper
        value={imageCropX}
        onValueChange={setImageCropX}
        minValue={-500}
        maxValue={500}
        step={1}
        label="Crop X"
        formatter={cropOffsetFormatter}
        incrementAriaLabel="Increase X crop offset"
        decrementAriaLabel="Decrease X crop offset"
      />
      <Stepper
        value={imageCropY}
        onValueChange={setImageCropY}
        minValue={-500}
        maxValue={500}
        step={1}
        label="Crop Y"
        formatter={cropOffsetFormatter}
        incrementAriaLabel="Increase Y crop offset"
        decrementAriaLabel="Decrease Y crop offset"
      />
    </CropControlsContainer>
  );
};
