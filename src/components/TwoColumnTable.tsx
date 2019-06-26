import React, { Component } from 'react';
import { Classes } from '@blueprintjs/core';
import styled from 'styled-components';

import dayjs from 'dayjs';

import LocalizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(LocalizedFormat)

const GridBox = styled.div`
  display: grid;
  grid-row-gap: 5px;
  grid-column-gap: 10px;
  grid-template-columns: max-content auto;
  grid-auto-rows: minmax(18px, auto);
`;

const NameCell = (props: { children: any }) =>
  <div className={`${Classes.TEXT_MUTED} ${Classes.TEXT_SMALL}`}>{props.children}</div>


interface TwoColumnTableProps {
  infos: { [key: string]: any } | Array<{ [key: string]: any }>;
}

export default class TwoColumnTable extends Component<TwoColumnTableProps> {
  render() {
    let entries: JSX.Element[] = [];
    Object.entries(this.props.infos).forEach(([key, value]) => {
      let t = typeof value;
      if (t !== "number" && t !== "string" && !React.isValidElement(value)) {
        if (!value) {
          value = (<div></div>);
        } else {
          value = (<TwoColumnTable infos={value} />);
        }
      }
      if (key === "lastUpdated" ||
          key === "lastTick" ||
          key === "startedTime" ||
          key === "useTime") {
        value = dayjs(value).format("L HH:mm:ss.SSS");
      }

      entries.push(<NameCell key={`${key}-name`}>{key}</NameCell>);
      entries.push(<div key={`${key}-info`}>{value}</div>);
    });

    return (
      <GridBox>
        {entries}
      </GridBox>
    );
  }
}