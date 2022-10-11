import { createElement } from 'react';

import { dsp } from './utils';

/* TODO: Support size
 * https://chakra-ui.com/docs/components/heading
 */
export function Heading(props) {
  const p = dsp(props);
  const tag = props.as || 'h1';
  return createElement(tag, p);
}
