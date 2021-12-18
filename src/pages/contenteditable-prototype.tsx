import * as React from 'react';
import { v4 as uuid } from 'uuid';

import styles from './contenteditable-prototype.module.scss';

function findNextBlock(el) {
  const els = [...document.querySelectorAll('.' + styles['text'])];
  return (
    els
      .map((e, i) => {
        if (el == e) {
          return els[i + 1] || null;
        }
        return null;
      })
      .filter((i) => !!i)[0] || null
  );
}

function findPrevBlock(el) {
  const els = [...document.querySelectorAll('.' + styles['text'])];
  return (
    els
      .map((e, i) => {
        if (el == e) {
          return els[i - 1] || null;
        }
        return null;
      })
      .filter((i) => !!i)[0] || null
  );
}

function Text(props) {
  const block = props.block;
  const ref = React.useRef(null);

  return (
    <span
      ref={ref}
      contentEditable
      indent={block.indent}
      className={styles['text']}
      dangerouslySetInnerHTML={{ __html: props.block.text || '&#8203;' }}
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
      if (ref.current) {
        ref.current.removeEventListener('touchstart', handleTouchStart);
        ref.current.removeEventListener('touchmove', handleTouchStart);
      }
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

export default class Blocks extends React.Component {
  private state: {
    blocks: { id: string; text: string }[];
  } = {
    blocks: [{ id: uuid(), text: '', indent: 0 }],
  };

  constructor(props) {
    super(props);
    this.onTextKeyDown = this.onTextKeyDown.bind(this);
    this.onTextInput = this.onTextInput.bind(this);
  }

  private onTextKeyDown(event, props, state) {
    const blocks = this.state.blocks;
    const block = props.block;

    const el = event.currentTarget;
    const key = event.key;
    const meta = event.metaKey;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey;

    if ((key === 'b' && ctrl) || (key === 'i' && ctrl) || (key === 's' && ctrl)) {
      event.preventDefault();
    } else if (key === 'Enter') {
      event.preventDefault();
      const newBlocks = [...blocks];
      for (let i = 0; i < blocks.length; i += 1) {
        if (newBlocks[i].id === block.id) {
          newBlocks.splice(i + 1, 0, { id: uuid(), text: '', indent: block.indent });
          break;
        }
      }
      this.setState({ blocks: newBlocks });

      setTimeout(() => {
        const nextEl = findNextBlock(el);
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          const textNode = nextEl.childNodes[0];
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    } else if (key === 'Tab') {
      event.preventDefault();
      const newBlocks = blocks.map((b) => {
        if (b.id === block.id) {
          b.indent += 1;
        }
        return {
          ...b,
        };
      });
      this.setState({ blocks: newBlocks });
    } else if (key == 'ArrowDown' && !shift) {
      const selection = document.getSelection();
      if (selection.isCollapsed && selection.focusNode.length === selection.focusOffset) {
        event.preventDefault();
        const nextEl = findNextBlock(el);
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          const textNode = nextEl.childNodes[0];
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if (key == 'ArrowUp' && !shift) {
      const selection = document.getSelection();
      if (selection.isCollapsed && selection.anchorOffset === 0) {
        event.preventDefault();
        const prevEl = findPrevBlock(el);
        if (prevEl) {
          prevEl.focus();
          const range = document.createRange();
          const textNode = prevEl.childNodes[0];
          range.setStart(textNode, selection.focusNode.length);
          range.setEnd(textNode, selection.focusNode.length);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  private onTextInput(event, props, state) {
    const blocks = this.state.blocks;

    const value = event.target.innerText;
    const newBlocks = [...blocks];
    for (let i = 0; i < newBlocks.length; i += 1) {
      if (newBlocks[i].id === props.block.id) {
        newBlocks[i].text = value;
      }
    }
    this.setState({ blocks: newBlocks });
  }

  public render() {
    const blocks = this.state.blocks;

    return (
      <ul className={styles['ul']}>
        {blocks.map((block) => {
          return (
            <Block
              key={block.id}
              block={block}
              onTextKeyDown={this.onTextKeyDown}
              onTextKeyPress={() => {}}
              onTextKeyUp={() => {}}
              onTextInput={this.onTextInput}
            />
          );
        })}
      </ul>
    );
  }
}
