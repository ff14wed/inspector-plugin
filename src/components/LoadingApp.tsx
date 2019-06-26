
import * as React from 'react';
import { Colors, NonIdealState, Spinner  } from '@blueprintjs/core';

import styled from 'styled-components';

import './App.css';

const AppRoot = styled.div`
  background-color: ${Colors.DARK_GRAY3};
  min-height: 100vh;
  height: 100vh;
  margin: auto;
`;

export default class LoadingApp extends React.Component {
  render() {
    return (
      <AppRoot className="bp3-dark">
        <NonIdealState
          icon={<Spinner intent="primary" />}
          title="Loading..."
        />
      </AppRoot>
    );
  }
}