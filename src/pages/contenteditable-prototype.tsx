import * as React from 'react';
import Head from 'next/head';

import styles from './contenteditable-prototype.module.scss';

function Text(props) {
  const block = props.block;
  const ref = React.useRef(null);
  if (ref.current) {
    if (ref.current.innerText !== block.text) {
      throw new Error(`Unmatch contents: text is ${props.text} and innerText is ${ref.current.innerText}.`);
    }
  }

  return (
    <span
      ref={ref}
      contentEditable
      className={styles['text']}
      dangerouslySetInnerHTML={{ __html: props.block.text }}
      onKeyDown={(e) => props.onKeyDown(e, props)}
      onKeyPress={(e) => props.onKeyPress(e, props)}
      onKeyUp={(e) => props.onKeyUp(e, props)}
      onInput={(e) => props.onInput(e, props)}
    />
  );
}

function Block(props) {
  const block = props.block;
  const ref = React.useRef(null);
  const textMemo = React.useMemo(
    () => (
      <Text
        block={block}
        onKeyDown={props.onTextKeyDown}
        onKeyPress={props.onTextKeyPress}
        onKeyUp={props.onTextKeyUp}
        onInput={props.onTextInput}
      />
    ),
    [block],
  );

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
        onTouchMove={(event) => {
          console.log(event.type, props);
          // event.preventDefault();
          event.target.parentNode.style.opacity = 0.1;
        }}
        onPointerEnter={(event) => {
          console.log(event.type, props);
          // event.preventDefault();
          event.target.parentNode.style.opacity = 0.1;
        }}
        onPointerUp={(event) => {
          console.log(event.type, props);
          event.target.parentNode.style.opacity = '';
        }}
      >
        HHH
      </span>
      {textMemo}
    </li>
  );
}

export default function Blocks(props) {
  const [blocks, setBlocks] = React.useState([
    { id: '0', text: '0000' },
    { id: '1', text: '1111' },
    { id: '2', text: '2222' },
    { id: '3', text: '3333' },
    { id: '4', text: '4444' },
  ]);

  const onTextKeyDown = React.useCallback((event, props, blocks) => {
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

  const onTextInput = React.useCallback((event, props, state) => {
    const value = event.target.innerText;
    const newBlocks = blocks.concat();
    for (let i = 0; i < newBlocks.length; i += 1) {
      if (newBlocks[i].id === props.block.id) {
        newBlocks[i].text = value;
      }
    }
    setBlocks(newBlocks);
  });

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <ul className={styles['ul']}>
        {blocks.map((block) => {
          return (
            <Block
              key={block.id}
              block={block}
              onTextKeyDown={onTextKeyDown}
              onTextKeyPress={() => {}}
              onTextKeyUp={() => {}}
              onTextInput={onTextInput}
            />
          );
        })}
      </ul>
    </>
  );
}
