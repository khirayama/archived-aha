import * as React from 'react';
import { renderToString } from 'react-dom/server';

import { BlockComponentProps } from './Block';

export function FocusableComponent(props: BlockComponentProps) {
  return (
    <span
      contentEditable
      dangerouslySetInnerHTML={{ __html: renderToString(props.children) }}
      onKeyDown={(e) => {
        e.preventDefault();
        props.onTextKeyDown(e, props);
      }}
      onInput={(e) => props.onTextInput(e, props)}
    />
  );
}
