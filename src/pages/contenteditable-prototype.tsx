import * as React from 'react';
import Head from 'next/head';

import styles from './contenteditable-prototype.module.scss';

function Text(props) {
  const ref = React.useRef(null);
  console.log(ref.current);
  if (ref.current) {
    console.log(`Unmatch contents: text is ${props.text} and innerText is ${ref.current.innerText}.`);
    if (ref.current.innerText !== props.text) {
      throw new Error(`Unmatch contents: text is ${props.text} and innerText is ${ref.current.innerText}.`);
    }
  }
  return (
    <span
      ref={ref}
      contentEditable
      className={styles['text']}
      dangerouslySetInnerHTML={{ __html: props.text }}
      onKeyDown={props.onKeyDown || ((e) => {})}
      onKeyPress={props.onKeyPress || ((e) => {})}
      onKeyUp={props.onKeyUp || ((e) => {})}
      onInput={props.onInput || ((e) => {})}
    />
  );
}

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
      <Text
        text={text}
        onKeyDown={props.onTextKeyDown}
        onKeyPress={props.onTextKeyPress}
        onKeyUp={props.onTextKeyUp}
        onInput={props.onTextInput}
      />
    </li>
  );
}

export default function Blocks(props) {
  const [state, setState] = React.useState(['0000', '1111', '2222', '3333', '4444']);

  const onTextKeyDown = React.useCallback((event) => {
    const key = event.key;
    const meta = event.metaKey;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey;
    if ((key === 'b' && ctrl) || (key === 'i' && ctrl) || (key === 's' && ctrl)) {
      event.preventDefault();
    } else if (key === 'Enter') {
      event.preventDefault();
      console.log('Create and inter new block');
    }
  });

  const onTextInput = React.useCallback((event) => {
    console.log(event);
  });

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <ul className={styles['ul']}>
        {state.map((text, i) => {
          return <Block key={i} text={text} onTextKeyDown={onTextKeyDown} onTextInput={onTextInput} />;
        })}
      </ul>
    </>
  );
}
