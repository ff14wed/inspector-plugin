import React, { Component } from 'react';

import { UL, Elevation, InputGroup, Classes, Colors, MenuDivider, H5 } from '@blueprintjs/core';
import styled from 'styled-components';

import PaddedCard from './PaddedCard';
import EntityListItem from './EntityListItem';

import { inject, observer } from 'mobx-react';
import { StreamStoreProps, streamStoreDefaultProps } from '../store/stream';

const List = styled(UL)`
  list-style: none;
  padding: 0;
  max-height: 23vh;
  overflow-y: auto;

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

function partition<T>(array: T[], predicate: (elem: T) => boolean) {
  return array.reduce<T[][]>(([pass, fail], elem) => {
    return predicate(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

export default class EntityListContainer extends Component<{}, { filter: string}> {
  constructor(props: any) {
    super(props);
    this.state = { filter: "" };
  }

  handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ filter: e.target.value });
  }

  render() {
    return (
      <PaddedCard elevation={Elevation.THREE}>
        <H5>Entities</H5>
        <EntityList filter={this.state.filter} />
        <InputGroup
          className={Classes.ROUND}
          leftIcon="search"
          placeholder="Search..."
          onChange={this.handleFilter}
        />
      </PaddedCard>
    );
  }
}

interface EntityListProps extends StreamStoreProps {
  filter: string;
}

@inject("streamStore")
@observer
class EntityList extends Component<EntityListProps> {
  static defaultProps = streamStoreDefaultProps;

  onSelect = (id: number) => {
    this.props.streamStore.setSelectedEntityID(id);
  }

  render() {
    const { entityList, selectedEntity }  = this.props.streamStore;
    let filteredList = entityList.filter(e => e.realName.includes(this.props.filter));
    let [npcs, players] = partition(filteredList, (e) => e.isNPC);
    return (
      <List>
        <MenuDivider title="Players" />
        { players.map(e =>
          <EntityListItem
            key={e.id} entity={e}
            selected={e === selectedEntity}
            onSelect={this.onSelect}
          />
        )}
        <MenuDivider title="NPCs" />
        { npcs.map(e =>
          <EntityListItem
            key={e.id} entity={e}
            selected={e === selectedEntity}
            onSelect={this.onSelect}
          />
        )}
      </List>
    );
  }
}