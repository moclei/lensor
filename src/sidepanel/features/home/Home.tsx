import React, { useEffect } from 'react';
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
  const [colorPalette] = useStateItem('colorPalette');
  const [materialPalette] = useStateItem('materialPalette');

  const handleChange = (setting: string) => {
    console.log('handleChange, setting: ', setting);
    if (setting === 'grid') {
      setIsGridShown(!isGridShown);
    } else if (setting === 'fisheye') {
      setFisheyeShown(!isFisheyeShown);
    }
  };

  useEffect(() => {
    console.log('colorPalette: ', colorPalette);
    console.log('materialPalette: ', materialPalette);
  }, [colorPalette, materialPalette]);

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
        <ZoomControl minZoom={0.5} maxZoom={16} step={1} />
      </SettingRow>
      <Color />
    </HomeContainer>
  );
};

export default Home;
