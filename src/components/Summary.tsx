import React, { Component } from 'react';
import { Colors } from '@blueprintjs/core';

import { observer } from 'mobx-react';

import ResourceValue from './ResourceValue';
import TwoColumnTable from './TwoColumnTable';
import Entity from '../store/entity';

const toDegrees = (radians: number) => {
  return (radians / Math.PI) * 180;
}

interface SummaryProps {
  entity: Entity;
}

@observer
export default class Summary extends Component<SummaryProps> {
  render() {
    const { targetString, level, resources, location } = this.props.entity;
    const infos = {
      Target: targetString,
      Level: level,
      HP: (<ResourceValue current={resources.hp} max={resources.maxHP} color={Colors.FOREST3} />),
      MP: (<ResourceValue current={resources.mp} max={resources.maxMP} color={Colors.ROSE3} />),
      TP: (<ResourceValue current={resources.tp} max={1000} color={Colors.GOLD3} />),
      X: location.x,
      Y: location.y,
      Z: location.z,
      Rot: `${toDegrees(location.orientation).toFixed(3)}° CCW from North`,
    }
    return (
      <TwoColumnTable infos={infos} />
    );
  }
}
