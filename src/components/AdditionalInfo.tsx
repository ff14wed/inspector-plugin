import React, { Component } from 'react';
import { Tab } from '@blueprintjs/core';
import { observer } from 'mobx-react';

import TwoColumnTable from './TwoColumnTable';
import Tabs from './Tabs';
import Entity from '../store/entity';

interface AdditionalInfoProps {
  entity: Entity;
}

@observer
export default class AdditionalInfo extends Component<AdditionalInfoProps> {
  render() {
    const { entity } = this.props;

    const lastActionTab = (<TabWrapper infoGetter={() => entity.lastAction} />);
    const castInfoTab = (<TabWrapper infoGetter={() => entity.castingDetails} />);
    const statusEffectsTab = (<TabWrapper infoGetter={() => entity.statusList} />);
    const bNPCInfoTab = (<TabWrapper infoGetter={() => entity.bNPCInfo} />);
    const spawnInfoTab = (<TabWrapper infoGetter={() => entity.rawSpawnData} />);

    return (
      <Tabs>
        <Tab id="la" title="Last Action" panel={lastActionTab} />
        <Tab id="castinf" title="Casting Info" panel={castInfoTab} />
        <Tab id="steff" title="Status Effects" panel={statusEffectsTab} />
        <Tab id="bnpc" title="BNPC Info" panel={bNPCInfoTab} />
        <Tab id="spinf" title="Spawn Info" panel={spawnInfoTab} />
      </Tabs>
    );
  }
}

interface TabWrapperProps {
  infoGetter: () => undefined | null | { [key: string]: any } | Component
}

@observer
class TabWrapper extends Component<TabWrapperProps> {
  render() {
    const infos = this.props.infoGetter();
    if (!infos) {
      return (<div></div>);
    }
    return (<TwoColumnTable infos={infos} />);
  }
}
