import React from 'react';
import styled from 'styled-components';
import Color from '../colors/Color';
import { useLensorState } from '../../../ui/hooks/useLensorState';
import Checkbox from '../../components/checkbox/Checkbox';
import ZoomControl from '../zoom-control/ZoomControl';
import { CropControls } from '../crop-controls/CropControls';

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

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const { useStateItem } = useLensorState();
  const [isGridShown, setIsGridShown] = useStateItem('showGrid');
  const [isFisheyeShown, setFisheyeShown] = useStateItem('showFisheye');
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
        <ZoomControl minZoom={0.5} maxZoom={3} step={0.1} />
      </SettingRow>
      <Color />
      <CropControls />
    </HomeContainer>
  );
};

export default Home;
