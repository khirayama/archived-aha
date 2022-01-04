import * as React from 'react';

import { Schema, Block } from './schema';
import { Paper } from './model';
import { afterRendering, keepSelectionPosition, findNextTextElement, findPrevTextElement } from './utils';

import styles from './pages/index.module.scss';

export function HandleComponent(props: BlockComponentProps) {
  return <span className={styles['handle']} onPointerDown={(e) => props.onHandlePointerDown(e, props)} />;
}

export function IndentationComponent(props: BlockComponentProps) {
  return <span className={styles['indentation']} data-indent={props.block.indent} />;
}

export class TextComponent extends React.Component<BlockComponentProps> {
  private ref: React.RefObject<HTMLSpanElement>;

  constructor(props: BlockComponentProps) {
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

  public shouldComponentUpdate(nextProps: BlockComponentProps) {
    this.manualDiffPatch(nextProps);
    return false;
  }

  private manualDiffPatch(nextProps: BlockComponentProps) {
    const el = this.ref.current;
    const block = {
      id: el.parentElement.dataset.blockid,
      text: el.innerText,
    };
    const nextBlock = nextProps.block;

    /* block.text */
    if (nextBlock.text !== block.text) {
      // el.blur();
      el.innerText = nextBlock.text;
    }
  }

  public render() {
    const block = this.props.block;

    return (
      <span
        ref={this.ref}
        contentEditable
        className={styles['text']}
        dangerouslySetInnerHTML={{ __html: block.text }}
        onKeyDown={(e) => this.props.onTextKeyDown(e, this.props)}
        onInput={(e) => this.props.onTextInput(e, this.props)}
      />
    );
  }
}

type BlockComponentProps = {
  block: Block;
  paper: Paper;
  schema: Schema;
  onHandlePointerDown: Function;
  onPointerMove: Function;
  onPointerUp: Function;
  onTextKeyDown: Function;
  onTextInput: Function;
  children?: React.ReactNode;
};

export function BlockComponent(props: BlockComponentProps) {
  const block = props.block;
  const schm = props.schema.find(block.type);
  const ref = React.useRef(null);

  return (
    <div
      className={styles['block']}
      ref={ref}
      data-blockid={block.id}
      onPointerMove={(e) => props.onPointerMove(e, props)}
      onPointerUp={(e) => props.onPointerUp(e, props)}
    >
      {schm.component(props)}
    </div>
  );
}

type PaperComponentProps = {
  schema: Schema;
  paper: Paper;
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

  private schema: Schema;

  private sort: {
    target: {
      el: any /* TODO */;
      id: string | null;
    } | null;
    to: {
      el: any /* TODO */;
      id: string | null;
    } | null;
  } = {
    target: null,
    to: null,
  };

  constructor(props: PaperComponentProps) {
    super(props);
    this.state = { blocks: props.paper.blocks };
    this.schema = props.schema;
    this.onPaperChange = this.onPaperChange.bind(this);
    this.onHandlePointerDown = this.onHandlePointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onTextKeyDown = this.onTextKeyDown.bind(this);
    this.onTextInput = this.onTextInput.bind(this);
  }

  public componentDidMount() {
    this.props.paper.onChange(this.onPaperChange);
  }

  public componentWillUnmount() {
    this.props.paper.offChange(this.onPaperChange);
  }

  private findGroupedBlocks(blockId: string): Block[] {
    const block = this.props.paper.blocks.filter((b) => b.id === blockId)[0];
    const blocks = [];
    let isSameBlock = false;
    for (let i = 0; i < this.props.paper.blocks.length; i += 1) {
      const b = this.props.paper.blocks[i];
      if (b.id === block.id || (isSameBlock && block.indent < b.indent)) {
        isSameBlock = true;
        blocks.push(b);
      } else {
        isSameBlock = false;
      }
    }
    return blocks;
  }

  private onPaperChange(p) {
    this.setState({ blocks: p.blocks });
  }

  private onHandlePointerDown(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const blocks = this.findGroupedBlocks(props.block.id);
    for (let i = 0; i < blocks.length; i += 1) {
      const b = blocks[i];
      const el = document.querySelector(`[data-blockid="${b.id}"]`);
      el.classList.add(styles['is_handling']);
    }

    const el = document.querySelector(`[data-blockid="${props.block.id}"]`);
    this.sort.target = {
      el,
      id: props.block.id,
    };
  }

  private onPointerMove(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    if (this.sort.target) {
      if (this.sort.to) {
        this.sort.to.el.classList.remove(styles['is_hover']);
      }

      let el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
      if (el && !el.dataset.blockid) {
        el = el.parentElement;
      }
      const blockId = el.dataset.blockid;
      const blockIds = this.findGroupedBlocks(this.sort.target.id).map((b) => b.id);

      if (!blockIds.includes(blockId)) {
        this.sort.to = {
          el: el,
          id: el.dataset.blockid,
        };
      } else {
        this.sort.to = null;
      }

      if (this.sort.to) {
        this.sort.to.el.classList.add(styles['is_hover']);
      }
    }
  }

  private onPointerUp(event: React.MouseEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const paper = this.props.paper;
    const blocks = this.state.blocks;

    if (this.sort.target && this.sort.to) {
      paper
        .tr(() => {
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

          const l = this.findGroupedBlocks(this.sort.target.id).length;
          const newBlocks = [...blocks];
          const sort = newBlocks.splice(targetIndex, l);
          newBlocks.splice(toIndex < targetIndex ? toIndex : toIndex - l + 1, 0, ...sort);
          paper.setBlocks(newBlocks);
        })
        .commit();
    }

    if (this.sort.target) {
      const blocks = this.findGroupedBlocks(this.sort.target.id);
      for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i];
        const el = document.querySelector(`[data-blockid="${b.id}"]`);
        el.classList.remove(styles['is_handling']);
      }
    }
    if (this.sort.to) {
      this.sort.to.el.classList.remove(styles['is_hover']);
    }

    this.sort.target = null;
    this.sort.to = null;
  }

  private onTextKeyDown(event: React.KeyboardEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const paper = this.props.paper;
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
      keepSelectionPosition();
      paper.tr(() => {
        const newBlocks = [...blocks].map((b) => {
          if (block.id === b.id) {
            return this.schema.createBlock('list', b);
          }
          return {
            ...b,
          };
        });
        paper.setBlocks(newBlocks);
      });
    } else if (key === 'Enter') {
      event.preventDefault();
      if (block.type !== defaultSchema.type && block.text === '') {
        /* Turn into paragraph block */
        keepSelectionPosition();
        paper.tr(() => {
          const newBlocks = blocks.map((b) => {
            if (block.id === b.id) {
              return this.schema.createBlock('paragraph', b);
            }
            return {
              ...b,
            };
          });
          paper.setBlocks(newBlocks);
        });
      } else {
        /* Split block */
        paper.tr(() => {
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
          paper.setBlocks(newBlocks);
        });
        afterRendering(() => {
          const nextEl = findNextTextElement(el);
          if (nextEl) {
            // nextEl.focus();
            const range = document.createRange();
            const textNode = nextEl.childNodes[0];
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        });
      }
    } else if (key === 'Backspace') {
      if (sel.isCollapsed && sel.anchorOffset == 0) {
        if (block.type !== defaultSchema.type) {
          /* Turn into paragraph block */
          keepSelectionPosition();
          paper.tr(() => {
            const newBlocks = blocks.map((b) => {
              if (block.id === b.id) {
                return this.schema.createBlock('paragraph', b);
              }
              return {
                ...b,
              };
            });
            paper.setBlocks(newBlocks);
          });
        } else if (block.indent > 0) {
          /* Outdent */
          keepSelectionPosition();
          paper.tr(() => {
            const newBlocks = blocks.map((b) => {
              if (b.id === block.id) {
                b.indent = Math.max(b.indent - 1, 0);
              }
              return {
                ...b,
              };
            });
            paper.setBlocks(newBlocks);
          });
        } else {
          /* Combine prev block */
          const prevEl = findPrevTextElement(el);
          if (prevEl) {
            event.preventDefault();
            // prevEl.focus();
            const range = document.createRange();
            const textNode = prevEl.childNodes[0];
            range.setStart(textNode, sel.focusNode.length);
            range.setEnd(textNode, sel.focusNode.length);
            sel.removeAllRanges();
            sel.addRange(range);

            keepSelectionPosition();
            paper.tr(() => {
              const newBlocks = [...blocks]
                .map((b, i) => {
                  if (blocks[i + 1] && block.id === blocks[i + 1].id) {
                    return {
                      ...b,
                      text: b.text + blocks[i + 1].text,
                    };
                  } else if (block.id === b.id) {
                    return null;
                  }
                  return { ...b };
                })
                .filter((b) => !!b);
              paper.setBlocks(newBlocks);
            });
          }
        }
      }
    } else if (key === 'Tab' && !shift) {
      event.preventDefault();
      paper.tr(() => {
        const newBlocks = blocks.map((b) => {
          if (b.id === block.id) {
            b.indent = Math.min(b.indent + 1, 8);
          }
          return {
            ...b,
          };
        });
        paper.setBlocks(newBlocks);
      });
    } else if (key === 'Tab' && shift) {
      event.preventDefault();
      paper.tr(() => {
        const newBlocks = blocks.map((b) => {
          if (b.id === block.id) {
            b.indent = Math.max(b.indent - 1, 0);
          }
          return {
            ...b,
          };
        });
        paper.setBlocks(newBlocks);
      });
    } else if (key == 'ArrowDown' && !shift) {
      if (sel.isCollapsed && sel.focusNode.length === sel.focusOffset) {
        event.preventDefault();
        const nextEl = findNextTextElement(el);
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          let textNode = nextEl.childNodes[0];
          if (!textNode) {
            textNode = document.createTextNode('');
            nextEl.appendChild(textNode);
          }
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if (key == 'ArrowUp' && !shift) {
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        event.preventDefault();
        const prevEl = findPrevTextElement(el);
        if (prevEl) {
          prevEl.focus();
          const range = document.createRange();
          let textNode = prevEl.childNodes[0];
          if (!textNode) {
            textNode = document.createTextNode('');
            prevEl.appendChild(textNode);
          }
          range.setStart(textNode, sel.focusNode.length);
          range.setEnd(textNode, sel.focusNode.length);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
    paper.commit();
  }

  private onTextInput(event: React.KeyboardEvent<HTMLSpanElement>, props: BlockComponentProps) {
    const paper = this.props.paper;
    const blocks = this.state.blocks;

    paper
      .tr(() => {
        const value = event.currentTarget.innerText;
        const newBlocks = [...blocks];
        for (let i = 0; i < newBlocks.length; i += 1) {
          if (newBlocks[i].id === props.block.id) {
            newBlocks[i].text = value;
          }
        }
        paper.setBlocks(newBlocks);
      })
      .commit();
  }

  public render() {
    const blocks = this.state.blocks;

    return (
      <div className={styles['blocks']}>
        {blocks.map((block) => {
          return (
            <BlockComponent
              key={block.id}
              paper={this.props.paper}
              schema={this.schema}
              block={block}
              onHandlePointerDown={this.onHandlePointerDown}
              onPointerMove={this.onPointerMove}
              onPointerUp={this.onPointerUp}
              onTextKeyDown={this.onTextKeyDown}
              onTextInput={this.onTextInput}
            />
          );
        })}
      </div>
    );
  }
}
