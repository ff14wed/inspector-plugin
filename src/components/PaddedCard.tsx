import { Card, Colors } from '@blueprintjs/core';
import styled from 'styled-components';

export default styled(Card)`
  padding: 20px;
  margin: 20px;
  && {
    background-color: ${Colors.DARK_GRAY2};
  }
`;

