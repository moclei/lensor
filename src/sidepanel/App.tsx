import React from 'react';
import styled from 'styled-components';
import Home from './features/home/Home';



const AppContainer = styled.div`
    padding: 8px;
    margin: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const AppTitleContainer = styled.div`
    padding: 8px;
    margin: 8px;
    display: flex;
    align-items: center;
`;

const AppTitleText = styled.h2`
    font-size: 1.5em;
    font-weight: bold;
`;


interface AppProps {
}

const App: React.FC<AppProps> = () => {

    return (
        <AppContainer>
            <AppTitleContainer>
                <AppTitleText>Lensor Controls</AppTitleText>
            </AppTitleContainer>
            <Home />

        </AppContainer>
    );
};

export default App;