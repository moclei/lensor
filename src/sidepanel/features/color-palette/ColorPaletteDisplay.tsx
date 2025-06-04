import React from 'react';
import styled from 'styled-components';
import { useLensorState } from '../../../ui/hooks/useLensorState';
import PaletteSection from './PaletteSection';
import ExportSection from './ExportSection';

const PaletteContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
`;

interface ColorPaletteDisplayProps {}

const ColorPaletteDisplay: React.FC<ColorPaletteDisplayProps> = () => {
  const { useStateItem } = useLensorState();
  const [colorPalette] = useStateItem('colorPalette');
  const [materialPalette] = useStateItem('materialPalette');

  // Convert material palette object to array with weight labels
  const materialPaletteArray = Object.entries(materialPalette)
    .map(([weight, color]) => ({
      color,
      label: weight,
      weight: parseInt(weight)
    }))
    .sort((a, b) => a.weight - b.weight);

  return (
    <PaletteContainer>
      <PaletteSection
        title="Color Harmony"
        colors={colorPalette.map((color, index) => ({
          color,
          label: `Variant ${index + 1}`,
          weight: 0
        }))}
        type="harmony"
      />

      <PaletteSection
        title="Material Tones"
        colors={materialPaletteArray}
        type="material"
      />

      <ExportSection />
    </PaletteContainer>
  );
};

export default ColorPaletteDisplay;
