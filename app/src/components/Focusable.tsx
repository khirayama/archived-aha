import * as React from 'react';
import { renderToString } from 'react-dom/server';

import { BlockComponentProps } from './Block';

import styles from './index.module.scss';

export function FocusableComponent(props: BlockComponentProps) {
  return (
    <span
      className={styles['focusable']}
      contentEditable
      dangerouslySetInnerHTML={{ __html: renderToString(props.children) }}
      onKeyDown={(e) => props.onFocusableKeyDown(e, props)}
      onClick={(e) => props.onFocusableClick(e, props)}
    />
  );
}
