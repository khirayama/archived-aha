import * as React from 'react';

import styles from './contenteditable-prototype.module.scss';

export default function ContentEditablePage(props) {
  const [state, setState] = React.useState(['0000', '1111', '2222', '3333', '4444']);
  const ref = React.useRef(null);

  return (
    <ul className={styles['ul']}>
      {state.map((text, i) => {
        return (
          <li
            key={text}
            className={styles['li']}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', null);
            }}
            onDragOver={(event) => {
              ref.current = i;
              event.preventDefault();
            }}
            onDragEnd={(event) => {
              console.log(ref.current, i);
              if (ref.current !== null) {
                const d = state.concat();
                const tmp = d[ref.current];
                d[ref.current] = d[i];
                d[i] = tmp;
                console.log(d);
                setState(d);
              }
            }}
          >
            HHH
            <span contentEditable className={styles['text']}>
              {text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
