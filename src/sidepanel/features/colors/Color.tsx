import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useLensorState } from '../../../ui/hooks/useLensorState';

const ColorContainer = styled.div`
  padding: 8px;
  margin: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

type ColorBoxProps = {
  color: string;
};
const ColorBox = styled.div<ColorBoxProps>`
  background: ${(props) => props.color};
  width: 100px;
  height: 100px;
`;

const ColorLabel = styled.input`
  margin: 0 8px;
  padding: 0;
`;

interface ColorProps {}

const Color: React.FC<ColorProps> = () => {
  const { useStateItem } = useLensorState();
  const [hoveredColor, setHoveredColor] = useStateItem('hoveredColor');

  useEffect(() => {
    console.log('Color, hoveredColor: ', hoveredColor);
  }, [hoveredColor]);
  return (
    <ColorContainer>
      <ColorBox color={hoveredColor} />
      <ColorLabel type="text" value={hoveredColor} />
    </ColorContainer>
  );
};

export default Color;
