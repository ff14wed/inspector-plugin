import React, { Component } from 'react';
import { H5, Elevation, NonIdealState, Checkbox } from '@blueprintjs/core';
import styled from 'styled-components';

import { inject, observer } from 'mobx-react';

import PaddedCard from './PaddedCard';
import Summary from './Summary';
import AdditionalInfo from './AdditionalInfo';
import { StreamStoreProps, streamStoreDefaultProps } from '../store/stream';

const Section = styled.div`
  margin: 10px 0;
`;

const NoEntityBox = styled.div`
  height: 400px;
`;

@inject("streamStore")
@observer
export default class Details extends Component<StreamStoreProps> {
  static defaultProps = streamStoreDefaultProps;

  render() {
    const { selectedEntity } = this.props.streamStore;
    if (!selectedEntity) {
      return (
        <PaddedCard elevation={Elevation.THREE}>
          <NoEntityBox>
            <NonIdealState
              icon="person"
              title="No entity exists"
              description="The server has not yet been populated with a list of entities. Please wait a moment."
            />
          </NoEntityBox>
        </PaddedCard>
      );
    }
    return (
      <PaddedCard elevation={Elevation.THREE}>
        <H5>{selectedEntity.realName} ({selectedEntity.hexID})</H5>
        <Section><Summary entity={selectedEntity} /></Section>
        <Section><AdditionalInfo entity={selectedEntity} /></Section>
        <Section><Checkbox checked={selectedEntity.isHidden} label="Hide?" onChange={this.onHideEntity} /> </Section>
      </PaddedCard>
    );
  }

  onHideEntity = (e: React.FormEvent<HTMLInputElement>) => {
    this.props.streamStore.selectedEntity!.isHidden = e.currentTarget.checked;
  }
}
