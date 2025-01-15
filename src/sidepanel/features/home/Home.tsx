import React, { useEffect } from 'react';
import styled from 'styled-components';
import Color from '../colors/Color';
import { useLensorState } from '../../../ui/hook/useLensorState';
import { PorterContext } from 'porter-source';
import Checkbox from '../../components/checkbox/Checkbox';


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

interface HomeProps {
}

const Home: React.FC<HomeProps> = () => {

    const { useStateItem } = useLensorState(PorterContext.React);
    const [isGridShown, setIsGridShown] = useStateItem('showGrid');
    const [isFisheyeShown, setFisheyeShown] = useStateItem('showFisheye');
    const handleChange = (setting: string) => {
        console.log('handleChange, setting: ', setting);
        if (setting === 'grid') {
            setIsGridShown(!isGridShown);
        } else if (setting === 'fisheye') {
            setFisheyeShown(!isFisheyeShown);
        }
    }

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
            <Color />
        </HomeContainer>
    );
};

export default Home;