import * as React from 'react';
import { H3, Colors } from '@blueprintjs/core';
import styled from 'styled-components';

import StreamDetails from './StreamDetails';
import EntityList from './EntityList';
import Details from './Details';

const SidePanel = styled.div`
  flex: 0 0 400px;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: ${Colors.GRAY1};
  }

  &::-webkit-scrollbar-thumb {
    background: ${Colors.DARK_GRAY5};
  }
`;

const Title = styled(H3)`
  padding: 10px;
  text-align: center;
`;

export default class Sidebar extends React.Component {
  render() {
    return (
      <SidePanel>
        <Title>Inspector</Title>
        <StreamDetails />
        <EntityList />
        <Details />
      </SidePanel>
    );
  }
}