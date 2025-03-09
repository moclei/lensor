import React, { useEffect } from 'react';
import styled from 'styled-components';
import Color from '../colors/Color';
import { useLensorState } from '../../../ui/hook/useLensorState';
import { PorterContext } from 'porter-source';
import Checkbox from '../../components/checkbox/Checkbox';
import ZoomControl from '../zoom-control/ZoomControl';

const HomeContainer = styled.div`
  padding: 8px;
  margin: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SettingRow = styled.div`
  width: 100%;
  padding: 8px;
  margin: 8px;
  display: flex;
`;

// const Checkbox = styled.input`
//     margin: 0 8px;
//     padding: 0;
//     `;

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const { useStateItem } = useLensorState(PorterContext.React);
  const [isGridShown, setIsGridShown] = useStateItem('showGrid');
  const [isFisheyeShown, setFisheyeShown] = useStateItem('showFisheye');
  const [zoomLevel, setZoomLevel] = useStateItem('zoom');
  const [pixelScalingEnabled, setPixelScalingEnabled] = useStateItem(
    'pixelScalingEnabled'
  );
  const handleChange = (setting: string) => {
    console.log('handleChange, setting: ', setting);
    if (setting === 'grid') {
      setIsGridShown(!isGridShown);
    } else if (setting === 'fisheye') {
      setFisheyeShown(!isFisheyeShown);
    } else if (setting === 'pixelScaling') {
      setPixelScalingEnabled(!pixelScalingEnabled);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    console.log('[SP] handleZoomChange, newZoom: ', newZoom);
    setZoomLevel(newZoom);
  };

  console.log('Home, isGridShown: ', isGridShown);
  console.log('Home, isFisheyeShown: ', isFisheyeShown);
  return (
    <HomeContainer>
      <SettingRow>
        <Checkbox
          label="Show grid"
          checked={isGridShown}
          onChange={() => handleChange('grid')}
        />
      </SettingRow>

      <SettingRow>
        <Checkbox
          label="Show fisheye"
          checked={isFisheyeShown}
          onChange={() => handleChange('fisheye')}
        />
      </SettingRow>

      <SettingRow>
        <Checkbox
          label="True pixel scaling"
          checked={pixelScalingEnabled}
          onChange={() => handleChange('pixelScaling')}
        />
      </SettingRow>

      <SettingRow>
        <ZoomControl
          zoom={zoomLevel}
          onZoomChange={handleZoomChange}
          minZoom={0.5}
          maxZoom={3}
          step={0.1}
        />
      </SettingRow>
      <Color />
    </HomeContainer>
  );
};

export default Home;
