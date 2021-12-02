import * as React from 'react';
import Head from 'next/head';

import styles from './contenteditable-prototype.module.scss';

function Block(props) {
  const text = props.text;
  const ref = React.useRef(null);

  const handleTouchStart = React.useCallback((event) => {
    if (event.target.classList.contains(styles['handle'])) {
      event.preventDefault();
    }
  });

  React.useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('touchstart', handleTouchStart, { passive: false });
      ref.current.addEventListener('touchmove', handleTouchStart, { passive: false });
    }
    return () => {
      ref.current.removeEventListener('touchstart', handleTouchStart);
      ref.current.removeEventListener('touchmove', handleTouchStart);
    };
  });

  return (
    <li className={styles['li']} ref={ref}>
      <span
        className={styles['handle']}
        onPointerDown={(event) => {
          event.preventDefault();
          // event.dataTransfer.setData('text/plain', null);
          event.target.parentNode.style.opacity = 0.5;
        }}
        onPointerOver={(event) => {
          event.preventDefault();
          event.target.parentNode.style.opacity = 0.1;
        }}
        onPointerUp={(event) => {
          event.target.parentNode.style.opacity = '';
        }}
      >
        HHH
      </span>
      <span contentEditable className={styles['text']} dangerouslySetInnerHTML={{ __html: text }} />
    </li>
  );
}

export default function ContentEditablePage(props) {
  const [state, setState] = React.useState(['0000', '1111', '2222', '3333', '4444']);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <ul className={styles['ul']}>
        {state.map((text, i) => {
          return <Block key={i} text={text} />;
        })}
      </ul>
    </>
  );
}
