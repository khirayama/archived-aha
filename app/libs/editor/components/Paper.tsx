import * as React from 'react';
import Head from 'next/head';

import { Block } from '../schema';
import { EditorSchema } from '../EditorSchema';
import { EditorState } from '../EditorState';
import { CommandContext, commands } from '../commands';
import { afterRendering, keepSelectionPosition } from './utils';
import { BlockComponent, BlockComponentProps } from './Block';

import styles from './index.module.scss';

const k = {
  Delete: 8,
  Tab: 9,
  Enter: 13,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  b: 66,
  i: 73,
  s: 83,
};

type PaperComponentProps = {
  schema: EditorSchema;
  state: EditorState;
};

type PaperComponentState = {
  blocks: Block[];
};

export class PaperComponent extends React.Component<PaperComponentProps, PaperComponentState> {
  public state: {
    blocks: Block[];
  } = {
    blocks: [],
  };

  private schema: EditorSchema;

  private sort: {
    target: {
      el: HTMLDivElement;
      id: string | null;
    } | null;
    to: {
      el: HTMLDivElement;
      id: string | null;
    } | null;
  } = {
    target: null,
    to: null,
  };

  private ref: React.RefObject<HTMLDivElement>;

  constructor(props: PaperComponentProps) {
    super(props);
    this.state = { blocks: props.state.blocks };
    this.schema = props.schema;
    this.ref = React.createRef<HTMLDivElement>();

    this.onPaperChange = this.onPaperChange.bind(this);
    this.onHandlePointerDown = this.onHandlePointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onTextKeyDown = this.onTextKeyDown.bind(this);
    this.onTextInput = this.onTextInput.bind(this);
    this.onFocusableKeyDown = this.onFocusableKeyDown.bind(this);
    this.onFocusableClick = this.onFocusableClick.bind(this);
  }

  public componentDidMount() {
    this.props.state.onChange(this.onPaperChange);
  }

  public componentWillUnmount() {
    this.props.state.offChange(this.onPaperChange);
  }

  private extractTitleFromBlocks() {
    const blocks = this.props.state.blocks;
    const cur = {
      title: blocks[0]?.text || '',
      level: 8,
    };
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.type === 'heading' && block.attrs.level < cur.level) {
        cur.title = block.text;
        cur.level = block.attrs.level;
      }
    }
    return cur.title;
  }

  private findBlockElement(blockId: string): HTMLDivElement | null {
    return this.ref.current.querySelector(`[data-blockid="${blockId}"]`);
  }

  private findFocusableElementFromBlockElement(blockElement: HTMLDivElement): HTMLElement {
    return blockElement.querySelector('[contentEditable]');
  }

  private extractTextNodeFromFocusableElement(el: HTMLDivElement | HTMLSpanElement | Text) {
    let textNode = el.childNodes[0];
    if (!textNode) {
      textNode = document.createTextNode('');
      el.appendChild(textNode);
    }
    return textNode as Text;
  }

  private focus(el: HTMLDivElement | HTMLSpanElement | Text, s: number, e?: number) {
    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(el, s);
    range.setEnd(el, e !== undefined ? e : s);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private onPaperChange(state: EditorState) {
    this.setState({ blocks: state.blocks });
  }

  private onHandlePointerDown(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const blocks = this.props.state.findGroupedBlocks(props.block.id);
    for (let i = 0; i < blocks.length; i += 1) {
      const b = blocks[i];
      const el = this.findBlockElement(b.id);
      el.classList.add(styles['is_handling']);
    }

    const el = this.findBlockElement(props.block.id);
    this.sort.target = {
      el,
      id: props.block.id,
    };
  }

  private onPointerMove(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const blocks = this.props.state.blocks;

    if (this.sort.target) {
      if (this.sort.to) {
        this.sort.to.el.classList.remove(styles['is_hover_upper']);
        this.sort.to.el.classList.remove(styles['is_hover_lower']);
      }

      let el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      while (el && !el.dataset.blockid) {
        el = el.parentElement;
      }
      const blockId = el.dataset.blockid;
      const blockIds = this.props.state.findGroupedBlocks(this.sort.target.id).map((b) => b.id);

      if (!blockIds.includes(blockId)) {
        this.sort.to = {
          el: el as HTMLDivElement,
          id: el.dataset.blockid,
        };
      } else {
        this.sort.to = null;
      }

      if (this.sort.to) {
        let targetIndex = 0;
        let toIndex = 0;

        for (let i = 0; i < blocks.length; i += 1) {
          if (this.sort.target.id === blocks[i].id) {
            targetIndex = i;
          }

          if (this.sort.to.id === blocks[i].id) {
            toIndex = i;
          }
        }

        if (targetIndex > toIndex) {
          this.sort.to.el.classList.add(styles['is_hover_upper']);
        } else {
          this.sort.to.el.classList.add(styles['is_hover_lower']);
        }
      }
    }
  }

  private onPointerUp(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const state = this.props.state;
    const blocks = this.state.blocks;
    const block = props.block;
    const sel = window.getSelection();

    const ctx: CommandContext = {
      block,
      schema: this.schema,
      state: this.props.state,
    };

    if (this.sort.target && this.sort.to) {
      commands.moveTo(ctx, this.sort.target.id, this.sort.to.id);
      this.props.state.commit();
    }

    if (this.sort.target) {
      const blocks = this.props.state.findGroupedBlocks(this.sort.target.id);
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i];
        const el = this.findBlockElement(b.id);
        el.classList.remove(styles['is_handling']);
      }
    }

    if (this.sort.to) {
      this.sort.to.el.classList.remove(styles['is_hover_upper']);
      this.sort.to.el.classList.remove(styles['is_hover_lower']);
    }

    this.sort.target = null;
    this.sort.to = null;
  }

  private onTextKeyDown(event: React.KeyboardEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const state = this.props.state;
    const blocks = this.state.blocks;
    const block = props.block;

    const defaultSchema = this.schema.defaultSchema();

    const key = event.keyCode;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;

    const sel = window.getSelection();
    const ctx: CommandContext = {
      block,
      schema: this.schema,
      state: this.props.state,
    };

    if ((key === k.b && ctrl) || (key === k.i && ctrl) || (key === k.s && ctrl)) {
      event.preventDefault();
    } else if (key === k.Enter && ctrl) {
      event.preventDefault();
      const schema = props.schema.find(props.block.type);
      if (schema && schema.action) {
        schema.action(ctx);
      }
    } else if (key === k.Enter) {
      event.preventDefault();
      if (block.type !== defaultSchema.type && block.text === '') {
        keepSelectionPosition(sel);
        commands.turnInto(ctx, defaultSchema.type as Block['type']);
      } else {
        afterRendering(() => {
          const nextBlock = state.findNextBlock(block.id);
          if (nextBlock) {
            const nextBlockEl = this.findBlockElement(nextBlock.id);
            const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          }
        });
        const s = Math.min(sel.anchorOffset, sel.focusOffset);
        const e = Math.max(sel.anchorOffset, sel.focusOffset);
        commands.splitBlock(ctx, s, e);
      }
    } else if (key === k.Delete && ctrl) {
      const prevBlock = this.props.state.findPrevBlock(block.id);
      if (prevBlock) {
        event.preventDefault();
        const prevBlockEl = this.findBlockElement(prevBlock.id);
        const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
        this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);

        keepSelectionPosition(sel);
        commands.updateText(ctx, '');
        commands.combineBlock(ctx);
      }
    } else if (key === k.Delete) {
      if (sel.isCollapsed && sel.anchorOffset == 0) {
        if (block.type !== defaultSchema.type) {
          keepSelectionPosition(sel);
          commands.turnInto(ctx, defaultSchema.type as Block['type']);
        } else {
          const prevBlock = this.props.state.findPrevBlock(block.id);
          if (prevBlock) {
            event.preventDefault();
            const prevBlockEl = this.findBlockElement(prevBlock.id);
            const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
            this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);

            keepSelectionPosition(sel);
            commands.combineBlock(ctx);
          }
        }
      }
    } else if (key === k.Tab && !shift) {
      event.preventDefault();
      commands.indent(ctx);
    } else if (key === k.Tab && shift) {
      event.preventDefault();
      commands.outdent(ctx);
    } else if (key === k.ArrowDown && !shift) {
      if (sel.isCollapsed) {
        const nextBlock = state.findNextBlock(block.id);
        if (nextBlock && sel.anchorOffset === (sel.anchorNode as Text).length) {
          event.preventDefault();
          const nextBlockEl = this.findBlockElement(nextBlock.id);
          const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
          if (nextBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          } else {
            this.focus(nextFocusableElement, 0);
          }
        }
      }
    } else if (key === k.ArrowRight && !shift) {
      if (sel.isCollapsed && (sel.focusNode as Text).length === sel.focusOffset) {
        event.preventDefault();
        const nextBlock = state.findNextBlock(block.id);
        if (nextBlock) {
          const nextBlockEl = this.findBlockElement(nextBlock.id);
          const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
          if (nextBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          } else {
            this.focus(nextFocusableElement, 0);
          }
        }
      }
    } else if (key === k.ArrowLeft && !shift) {
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        event.preventDefault();
        const prevBlock = this.props.state.findPrevBlock(block.id);
        if (prevBlock) {
          const prevBlockEl = this.findBlockElement(prevBlock.id);
          const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
          if (prevBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);
          } else {
            this.focus(prevFocusableElement, prevFocusableElement.childNodes.length);
          }
        }
      }
    } else if (key === k.ArrowUp && !shift) {
      if (sel.isCollapsed) {
        const prevBlock = this.props.state.findPrevBlock(block.id);
        if (prevBlock && sel.anchorOffset === 0) {
          event.preventDefault();
          const prevBlockEl = this.findBlockElement(prevBlock.id);
          const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
          if (prevBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);
          } else {
            this.focus(prevFocusableElement, prevFocusableElement.childNodes.length);
          }
        }
      }
    }
    state.commit();
  }

  private onFocusableKeyDown(event: React.KeyboardEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const state = this.props.state;
    const blocks = this.state.blocks;
    const block = props.block;

    const defaultSchema = this.schema.defaultSchema();

    const key = event.keyCode;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;

    const sel = window.getSelection();
    const ctx: CommandContext = {
      block,
      schema: this.schema,
      state: this.props.state,
    };

    if (key === k.Enter) {
      event.preventDefault();
      if (block.type !== defaultSchema.type && block.text === null && sel.anchorOffset === 0) {
        commands.turnInto(ctx, defaultSchema.type as Block['type']);
        afterRendering(() => {
          const blockElement = this.findBlockElement(block.id);
          const focusableElement = this.findFocusableElementFromBlockElement(blockElement);
          this.focus(focusableElement, 0);
        });
      } else {
        afterRendering(() => {
          const nextBlock = state.findNextBlock(block.id);
          if (nextBlock) {
            const nextBlockEl = this.findBlockElement(nextBlock.id);
            const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          }
        });
        const s = Math.min(sel.anchorOffset, sel.focusOffset);
        const e = Math.max(sel.anchorOffset, sel.focusOffset);
        commands.splitBlock(ctx, s, e);
      }
    } else if (key === k.Delete) {
      event.preventDefault();
      commands.turnInto(ctx, defaultSchema.type as Block['type']);
      afterRendering(() => {
        const el = this.findBlockElement(block.id);
        const focusableElement = this.findFocusableElementFromBlockElement(el);
        focusableElement.focus();
      });
    } else if (key === k.Tab && !shift) {
      event.preventDefault();
      commands.indent(ctx);
    } else if (key === k.Tab && shift) {
      event.preventDefault();
      commands.outdent(ctx);
    } else if (key === k.ArrowDown && !shift) {
      const focusableElement = this.findFocusableElementFromBlockElement(this.findBlockElement(block.id));
      if (
        (sel.isCollapsed && (sel.focusNode as Text).length === sel.focusOffset) ||
        (focusableElement === sel.focusNode && focusableElement.childNodes.length === sel.focusOffset)
      ) {
        const nextBlock = state.findNextBlock(block.id);
        if (nextBlock) {
          event.preventDefault();
          const nextBlockEl = this.findBlockElement(nextBlock.id);
          const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
          if (nextBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          } else {
            this.focus(nextFocusableElement, 0);
          }
        }
      }
    } else if (key === k.ArrowUp && !shift) {
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        const prevBlock = this.props.state.findPrevBlock(block.id);
        if (prevBlock) {
          event.preventDefault();
          const prevBlockEl = this.findBlockElement(prevBlock.id);
          const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
          if (prevBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);
          } else {
            this.focus(prevFocusableElement, prevFocusableElement.childNodes.length);
          }
        }
      }
    } else if (key === k.ArrowRight && !shift) {
      if (sel.isCollapsed && sel.focusNode.childNodes.length === sel.focusOffset) {
        event.preventDefault();
        const nextBlock = state.findNextBlock(block.id);
        if (nextBlock) {
          const nextBlockEl = this.findBlockElement(nextBlock.id);
          const nextFocusableElement = this.findFocusableElementFromBlockElement(nextBlockEl);
          if (nextBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(nextFocusableElement), 0);
          } else {
            this.focus(nextFocusableElement, 0);
          }
        }
      }
    } else if (key === k.ArrowLeft && !shift) {
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        event.preventDefault();
        const prevBlock = this.props.state.findPrevBlock(block.id);
        if (prevBlock) {
          const prevBlockEl = this.findBlockElement(prevBlock.id);
          const prevFocusableElement = this.findFocusableElementFromBlockElement(prevBlockEl);
          if (prevBlock.text !== null) {
            this.focus(this.extractTextNodeFromFocusableElement(prevFocusableElement), new Text(prevBlock.text).length);
          } else {
            this.focus(prevFocusableElement, prevFocusableElement.childNodes.length);
          }
        }
      }
    } else if (!ctrl) {
      event.preventDefault();
    }
    state.commit();
  }

  private onFocusableClick(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const blockElement = this.findBlockElement(props.block.id);
    const focusableElement = this.findFocusableElementFromBlockElement(blockElement);
    this.focus(focusableElement, focusableElement.childNodes.length);
  }

  private onTextInput(event: React.KeyboardEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const sel = window.getSelection();
    let value = event.currentTarget.innerText;

    const ctx: CommandContext = {
      block: props.block,
      schema: this.schema,
      state: this.props.state,
    };

    const result = this.schema.execInputRule(value);
    if (result) {
      commands.updateText(ctx, result.text);
      commands.turnInto(ctx, result.schema.type as Block['type'], { attrs: result.attrs as any });
      const pos = Math.max(sel.focusOffset - (new Text(value).length - new Text(result.text).length), 0);
      afterRendering(() => {
        const blockElement = this.findBlockElement(props.block.id);
        const focusableElement = this.findFocusableElementFromBlockElement(blockElement);
        const block = this.props.state.findBlock(props.block.id);
        if (block.text !== null) {
          this.focus(focusableElement, pos);
        } else {
          this.focus(focusableElement, focusableElement.childNodes.length);
        }
      });
    } else {
      commands.updateText(ctx, value);
    }
    ctx.state.commit();
  }

  public render() {
    const blocks = this.state.blocks;
    const title = this.extractTitleFromBlocks();

    return (
      <>
        <Head>
          <title>{title}</title>
        </Head>
        <div className={styles['paper']} ref={this.ref}>
          {blocks.map((block) => {
            return (
              <BlockComponent
                key={block.id}
                state={this.props.state}
                schema={this.schema}
                block={block}
                onHandlePointerDown={this.onHandlePointerDown}
                onPointerMove={this.onPointerMove}
                onPointerUp={this.onPointerUp}
                onTextKeyDown={this.onTextKeyDown}
                onTextInput={this.onTextInput}
                onFocusableKeyDown={this.onFocusableKeyDown}
                onFocusableClick={this.onFocusableClick}
                onPaste={(event, props) => {
                  event.preventDefault();
                  const ctx: CommandContext = {
                    block,
                    schema: this.schema,
                    state: this.props.state,
                  };
                  commands.paste(ctx, event.clipboardData.getData('text'));
                  this.props.state.commit();
                }}
              />
            );
          })}
        </div>
      </>
    );
  }
}
