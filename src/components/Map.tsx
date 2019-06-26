import * as React from 'react';
import styled from 'styled-components';

import MapView from './MapView';

const MapContainer = styled.div`
  flex: 1 0 400px;
  min-width: 0;
  position: relative;
`;

export default class Map extends React.Component {
  render() {
    return (
      <MapContainer>
        <MapView />
      </MapContainer>
    );
  }
}