import React, { Component } from 'react';

import styled from 'styled-components';
import { Classes } from '@blueprintjs/core';

const ResourceRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const ResourceText = styled.div`
  flex: 1 0 auto;
  margin-right: 5px;
`;

const ResourceBar = styled.div`
  margin: 5px 0px;
  flex: 0 0 auto;
  margin-left: 5px;
  flex-basis: 120px;
`;

interface ResourceValueProps {
  current: number;
  max: number;
  color: string;
}

export default class ResourceValue extends Component<ResourceValueProps> {
  render() {
    let { current, max, color } = this.props;
    let ratioPct = (current/max) * 100;
    if (isNaN(ratioPct)) {
      ratioPct = 100;
    }
    return (
      <ResourceRow>
        <ResourceText style={{color: color}}>{current}/{max}</ResourceText>
        <ResourceBar>
          <div className={`${Classes.PROGRESS_BAR} ${Classes.PROGRESS_NO_ANIMATION}`}>
            <div className={Classes.PROGRESS_METER} style={{
              backgroundColor: color,
              width: `${ratioPct}%`,
            }}></div>
          </div>
        </ResourceBar>
      </ResourceRow>
    );
  }
}