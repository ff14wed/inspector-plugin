import React, { Component } from 'react';

import { MenuItem, Classes } from '@blueprintjs/core';

import { observer } from 'mobx-react';

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
          <span>{entity.realName}</span>
          {entity.hasTarget && entity.target &&
            <span className={smallClasses}> {">>"} {entity.target.realName} </span>
          }
        </div>
        <div>
          {entity.hasTarget ? (
            <span className={smallClasses}>({entity.hexID} {">>"} {entity.hexTargetID})</span>
          ) : (
              <span className={smallClasses}>({entity.hexID})</span>
            )}
          {entity.castingSummary && (
            <span className={smallClasses}> | Casting: {entity.castingSummary}</span>
          )}
        </div>
      </div>
    );

    return (
      <MenuItem text={child} active={selected} onClick={this.onClick} />
    );
  }
}
