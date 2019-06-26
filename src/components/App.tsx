import * as React from 'react';
import { Colors, Divider } from '@blueprintjs/core';

import styled from 'styled-components';

import './App.css';

import Map from './Map';
import Sidebar from './Sidebar';

const AppRoot = styled.div`
  background-color: ${Colors.DARK_GRAY3};
`;

const AppContent = styled.div`
  display: flex;
  flex-direction: row;

  min-height: 100vh;
  height: 100vh;
  margin: auto;
`;

export default class App extends React.Component {
  render() {
    return (
      <AppRoot className="bp3-dark">
        <AppContent>
          <Map></Map>
          <Divider/>
          <Sidebar></Sidebar>
        </AppContent>
      </AppRoot>
    );
  }
}