
import React, { Component } from 'react';
import { Colors, NonIdealState, Spinner } from '@blueprintjs/core';

import styled from 'styled-components';

import './App.css';

const AppRoot = styled.div`
  background-color: ${Colors.DARK_GRAY3};
  min-height: 100vh;
  height: 100vh;
  margin: auto;
`;

interface LoadingAppProps {
  error?: string;
}

export default class LoadingApp extends Component<LoadingAppProps> {
  render() {
    if (this.props.error) {
      return (
        <AppRoot className="bp3-dark">
          <NonIdealState
            icon="warning-sign"
            title={this.props.error}
          />
        </AppRoot>
      )
    }
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
