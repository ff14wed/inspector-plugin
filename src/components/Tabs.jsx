import * as React from 'react';
import { Classes, Tabs as BPTabs, HTMLSelect } from '@blueprintjs/core';

export default class Tabs extends BPTabs {
  render() {
    const { selectedTabId } = this.state;
    const tabTitles = React.Children.map(this.props.children, this.renderTabTitle);

    const tabPanels = this.getTabChildren()
      .filter(tab => tab.props.id === selectedTabId)
      .map(this.renderTabPanel);

    return (
      <div className={Classes.TABS}>
        <span className={Classes.TEXT_LARGE} style={{ marginRight: "5px" }}>Display:</span>
        <span role="tablist">
          <HTMLSelect onChange={this.onChangeTab} value={selectedTabId}>
            {tabTitles}
          </HTMLSelect>
        </span>
        {tabPanels}
      </div>
    );
  }

  onChangeTab = (e) => {
    this.handleTabClick(e.currentTarget.value, e);
  }

  renderTabTitle = (child, i) => {
    if (!child.props) return child;
    let { id, title } = child.props;
    return <option key={i} value={id}>{title}</option>;
  }
}
