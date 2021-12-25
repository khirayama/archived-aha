import * as React from 'react';

import { Schema, Block } from './schema';
import { afterRendering, findNextBlock, findPrevBlock } from './utils';

import styles from './pages/index.module.scss';

type TextComponentProps = {
  block: Partial<Block>;
  onKeyDown: Function;
  onInput: Function;
};

export class TextComponent extends React.Component<TextComponentProps> {
  private ref: React.RefObject<HTMLSpanElement>;

  constructor(props: TextComponentProps) {
    super(props);
    this.ref = React.createRef<HTMLSpanElement>();
  }

  public componentDidMount() {
    const el = this.ref.current;
    if (el.childNodes.length === 0) {
      const textNode = document.createTextNode('');
      el.appendChild(textNode);
    }
  }

  public shouldComponentUpdate(nextProps: TextComponentProps) {
    this.manualDiffPatch(nextProps);
    return false;
  }

  private manualDiffPatch(nextProps: TextComponentProps) {
    const el = this.ref.current;
    const block = {
      id: el.parentElement.dataset.blockid,
      indent: Number(el.dataset.indent),
      text: el.innerText,
    };
    const nextBlock = nextProps.block;

    /* block.text */
    if (nextBlock.text !== block.text) {
      el.blur();
      el.innerText = nextBlock.text;
    }

    /* block.indent */
    if (nextBlock.indent !== block.indent) {
      // el.setAttribute('indent', nextBlock.indent);
      el.dataset.indent = String(nextBlock.indent);
    }
  }

  public render() {
    const block = this.props.block;

    return (
      <span
        ref={this.ref}
        contentEditable
        className={styles['text']}
        data-indent={block.indent}
        dangerouslySetInnerHTML={{ __html: block.text }}
        onKeyDown={(e) => this.props.onKeyDown(e, this.props)}
        onInput={(e) => this.props.onInput(e, this.props)}
      />
    );
  }
}

type BlockComponentProps = {
  block: Block;
  schema: Schema;
  onTextKeyDown: Function;
  onTextInput: Function;
};

export function BlockComponent(props: BlockComponentProps) {
  const block = props.block;
  const schm = props.schema.find(block.type);
  const ref = React.useRef(null);

  const handleTouchStart = (event: any /* TODO */) => {
    if (event.target.classList.contains(styles['handle'])) {
      event.preventDefault();
    }
  };

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
    <div className={styles['block']} ref={ref} data-blockid={block.id}>
      <span
        className={styles['handle']}
        onPointerDown={(event) => {
          event.preventDefault();
          const el = event.target as HTMLSpanElement;
          // event.dataTransfer.setData('text/plain', null);
          el.parentElement.style.opacity = '0.5';
        }}
        onTouchMove={(event) => {
          console.log(event.type, props);
          const el = event.target as HTMLSpanElement;
          // event.preventDefault();
          el.parentElement.style.opacity = '0.1';
        }}
        onPointerEnter={(event) => {
          console.log(event.type, props);
          const el = event.target as HTMLSpanElement;
          // event.preventDefault();
          el.parentElement.style.opacity = '0.1';
        }}
        onPointerUp={(event) => {
          console.log(event.type, props);
          const el = event.target as HTMLSpanElement;
          el.parentElement.style.opacity = '';
        }}
      >
        HHH
      </span>
      {schm.component(props)}
    </div>
  );
}

type BlocksComponentProps = {
  schema: Schema;
  blocks: Block[];
};

type BlocksComponentState = {
  blocks: Block[];
};

export class BlocksComponent extends React.Component<BlocksComponentProps, BlocksComponentState> {
  public state: {
    blocks: Block[];
  } = {
    blocks: [],
  };

  private schema: Schema;

  constructor(props: BlocksComponentProps) {
    super(props);
    this.state = { blocks: props.blocks };
    this.schema = props.schema;
    this.onTextKeyDown = this.onTextKeyDown.bind(this);
    this.onTextInput = this.onTextInput.bind(this);
  }

  private onTextKeyDown(event: React.KeyboardEvent<HTMLSpanElement>, props: TextComponentProps) {
    const blocks = this.state.blocks;
    const block = props.block;

    const defaultSchema = this.schema.defaultSchema();

    const el = event.currentTarget;
    const key = event.key;
    // const meta = event.metaKey;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey;

    const sel = window.getSelection() as any; /* TODO focusNode.length is undefined? */

    if ((key === 'b' && ctrl) || (key === 'i' && ctrl) || (key === 's' && ctrl)) {
      event.preventDefault();
    } else if (key === 'm' && ctrl) {
      event.preventDefault();
      // TODO: Keep selection position
      const newBlocks = [...blocks].map((b) => {
        if (block.id === b.id) {
          return this.schema.createBlock('list', b);
        }
        return {
          ...b,
        };
      });
      this.setState({ blocks: newBlocks });
      // TODO: Projection selection position
    } else if (key === 'Enter') {
      event.preventDefault();

      const textArr = Array.from(block.text);
      const s = Math.min(sel.anchorOffset, sel.focusOffset);
      const e = Math.max(sel.anchorOffset, sel.focusOffset);
      const newText = textArr.splice(e, textArr.length - e);
      textArr.splice(s, e - s);

      const newBlock = this.schema.createBlock(block.type, {
        text: newText.join(''),
        indent: block.indent,
      });
      const newBlocks = [...blocks];
      for (let i = 0; i < blocks.length; i += 1) {
        if (newBlocks[i].id === block.id) {
          newBlocks[i].text = textArr.join('');
          newBlocks.splice(i + 1, 0, newBlock);
          break;
        }
      }
      this.setState({ blocks: newBlocks });
      afterRendering(() => {
        const nextEl = findNextBlock(el);
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          const textNode = nextEl.childNodes[0];
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    } else if (key === 'Backspace') {
      if (sel.isCollapsed && sel.anchorOffset == 0) {
        /* TODO */
        console.log('Do something', block, defaultSchema);
        if (block.type !== defaultSchema.type) {
          console.log('change to default schema.');
        } else if (block.indent > 0) {
          console.log('outdent');
        } else {
          console.log('combine to prev block');
        }
      }
    } else if (key === 'Tab' && !shift) {
      event.preventDefault();
      const newBlocks = blocks.map((b) => {
        if (b.id === block.id) {
          b.indent = Math.min(b.indent + 1, 8);
        }
        return {
          ...b,
        };
      });
      this.setState({ blocks: newBlocks });
    } else if (key === 'Tab' && shift) {
      event.preventDefault();
      const newBlocks = blocks.map((b) => {
        if (b.id === block.id) {
          b.indent = Math.max(b.indent - 1, 0);
        }
        return {
          ...b,
        };
      });
      this.setState({ blocks: newBlocks });
    } else if (key == 'ArrowDown' && !shift) {
      if (sel.isCollapsed && sel.focusNode.length === sel.focusOffset) {
        event.preventDefault();
        const nextEl = findNextBlock(el);
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          const textNode = nextEl.childNodes[0];
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if (key == 'ArrowUp' && !shift) {
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        event.preventDefault();
        const prevEl = findPrevBlock(el);
        if (prevEl) {
          prevEl.focus();
          const range = document.createRange();
          const textNode = prevEl.childNodes[0];
          range.setStart(textNode, sel.focusNode.length);
          range.setEnd(textNode, sel.focusNode.length);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  private onTextInput(event: React.KeyboardEvent<HTMLSpanElement>, props: TextComponentProps) {
    const blocks = this.state.blocks;

    const value = event.currentTarget.innerText;
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
      <div className={styles['blocks']}>
        {blocks.map((block) => {
          return (
            <BlockComponent
              key={block.id}
              schema={this.schema}
              block={block}
              onTextKeyDown={this.onTextKeyDown}
              onTextInput={this.onTextInput}
            />
          );
        })}
      </div>
    );
  }
}
