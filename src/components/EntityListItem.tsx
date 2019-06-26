import React, { Component } from 'react';

import { MenuItem, Classes } from '@blueprintjs/core';

import { observer } from 'mobx-react';

import InlineDiv from './InlineDiv';
import Entity from '../store/entity';

const smallClasses = `${Classes.TEXT_SMALL} ${Classes.TEXT_MUTED}`;

interface EntityListItemProps {
  entity: Entity;
  selected: boolean;

  onSelect: (id: number) => void;
}

@observer
export default class EntityListItem extends Component<EntityListItemProps> {
  onClick = () => {
    this.props.onSelect(this.props.entity.id);
  }

  render() {
    const { entity, selected } = this.props;

    let child = (
      <div>
        <div>
          <InlineDiv>{entity.realName} </InlineDiv>
          { entity.hasTarget && entity.target &&
            <InlineDiv className={smallClasses}>>> {entity.target.realName} </InlineDiv>
          }
        </div>
        <div>
          { entity.hasTarget ? (
            <InlineDiv className={smallClasses}>({entity.hexID} >> {entity.hexTargetID})</InlineDiv>
          ) : (
            <InlineDiv className={smallClasses}>({entity.hexID})</InlineDiv>
          )}
          { entity.castingSummary && (
            <InlineDiv className={smallClasses}>| Casting: {entity.castingSummary}</InlineDiv>
          )}
        </div>
      </div>
    );

    return (
      <MenuItem text={child} active={selected} onClick={this.onClick} />
    );
  }
}