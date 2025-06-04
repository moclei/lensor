import React from 'react';
import styled from 'styled-components';
import ColorBar from './ColorBar';

const SectionContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 8px;
  opacity: 0.9;
`;

const ColorsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

interface ColorData {
  color: string;
  label: string;
  weight: number;
}

interface PaletteSectionProps {
  title: string;
  colors: ColorData[];
  type: 'harmony' | 'material';
}

const PaletteSection: React.FC<PaletteSectionProps> = ({
  title,
  colors,
  type
}) => {
  return (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <ColorsContainer>
        {colors.map((colorData, index) => (
          <ColorBar
            key={`${type}-${index}`}
            color={colorData.color}
            label={colorData.label}
            type={type}
          />
        ))}
      </ColorsContainer>
    </SectionContainer>
  );
};

export default PaletteSection;
