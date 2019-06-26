import React, { Component } from 'react';
import { H5, Elevation, NonIdealState, Tab, Tabs, HTMLSelect, Switch } from '@blueprintjs/core';
import styled from 'styled-components';

import { inject, observer } from 'mobx-react';

import PaddedCard from './PaddedCard';
import TwoColumnTable from './TwoColumnTable';
import { StreamStoreProps, streamStoreDefaultProps } from '../store/stream';

const NotInitializedBox = styled.div`
  height: 200px;
`;

@inject("streamStore")
@observer
export default class StreamDetails extends Component<StreamStoreProps> {
  static defaultProps = streamStoreDefaultProps;

  render() {
    const { streamID, serverID, hexCharacterID, currentMap } = this.props.streamStore;
    if (!serverID) {
      return (
        <PaddedCard elevation={Elevation.THREE}>
          <NotInitializedBox>
            <NonIdealState
              icon="database"
              title="Not yet initialized."
              description="The server has not yet been initialized. Please rezone to populate the data."
            />
          </NotInitializedBox>
        </PaddedCard>
      );
    }
    const infos = {
      ServerID: serverID,
      CharacterID: hexCharacterID,
      CurrentMap: currentMap,
    };

    return (
      <PaddedCard elevation={Elevation.THREE}>
        <H5>Stream { streamID }</H5>
        <TwoColumnTable infos={infos} />
        <Tabs id="ViewControls">
          <Tab id="map" title="Map" panel={<MapSelectorPanel />} />
          <Tab id="options" title="Options" panel={<OptionsPanel />} />
        </Tabs>
      </PaddedCard>
    );
  }
}

@inject("streamStore")
@observer
class MapSelectorPanel extends Component<StreamStoreProps> {
  static defaultProps = streamStoreDefaultProps;

  onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.streamStore.setSelectedMapIndex(Number(e.currentTarget.value));
  }

  render() {
    const { place, selectedMapIndex } = this.props.streamStore;

    return (
      <div>
        <HTMLSelect onChange={this.onChange} value={selectedMapIndex}>
          { place.maps.map((m, i) => <option key={i} value={i}>{m.PlaceName}{m.PlaceNameSub && ` - ${m.PlaceNameSub}`}</option>) }
        </HTMLSelect>
      </div>
    );
  }
}

@inject("streamStore")
@observer
class OptionsPanel extends Component<StreamStoreProps> {
  static defaultProps = streamStoreDefaultProps;

  render() {
    let { options } = this.props.streamStore;
    return (
      <div>
        <Switch
          checked={options.followSelection}
          label="Follow Selection"
          onChange={(e) => this.props.streamStore.setOption("followSelection", e.currentTarget.checked)}
        />
        <Switch
          checked={options.locationInterpolation}
          label="Interpolate Locations"
          onChange={(e) => this.props.streamStore.setOption("locationInterpolation", e.currentTarget.checked)}
        />
      </div>
    );
  }
}