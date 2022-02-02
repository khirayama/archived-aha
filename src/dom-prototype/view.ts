import deepEqual from 'fast-deep-equal';

import { Schema, Block } from './schema';
import { Paper, Cursor } from './model';
import { CommandContext, commands } from '../dom-prototype/commands';

export type BlockViewProps<T = Block> = {
  paper: Paper;
  schema: Schema;
  block: T;
};

class BlockView {
  public el: HTMLDivElement | null = null;

  private child: any = null;

  private props: BlockViewProps;

  constructor(props: BlockViewProps) {
    this.props = props;
    this.mount();
  }

  public mount() {
    this.el = document.createElement('div');
    this.el.dataset.blockid = this.props.block.id;

    const schema = this.props.schema.find(this.props.block.type);
    const view = new schema.view(this.el, this.props);
    this.child = view;
    this.addEventListeners();
  }

  public update(props: BlockViewProps) {
    this.props = props;
    const schema = props.schema.find(props.block.type);
    this.child.render(this.props);
  }

  private addEventListeners() {}
}

type PaperViewProp = {
  schema: Schema;
  paper: Paper;
};

export class PaperView {
  public el: HTMLDivElement | null = null;

  public props: PaperViewProp;

  private map: {
    [blockId: string]: BlockView;
  } = {};

  constructor(props: PaperViewProp) {
    this.props = props;
    this.mount();
  }

  private addEventListeners() {
    const observer = new MutationObserver(() => {
      this.sync();
    });

    observer.observe(this.el, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });

    this.props.paper.onChange(() => {
      this.update(this.props);
    });

    this.el.addEventListener('drop', this.onDrop.bind(this));
    this.el.addEventListener('paste', this.onPaste.bind(this));
    this.el.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private mount() {
    this.el = document.createElement('div');
    this.el.contentEditable = 'true';
    this.props.paper.blocks.forEach((block) => {
      const props: BlockViewProps = {
        paper: this.props.paper,
        schema: this.props.schema,
        block,
      };
      this.createBlock(props);
      this.el.appendChild(this.map[block.id].el);
    });
    this.addEventListeners();
  }

  private update(props: PaperViewProp) {
    this.props.paper.blocks.forEach((block, i) => {
      const props: BlockViewProps = {
        paper: this.props.paper,
        schema: this.props.schema,
        block,
      };
      if (this.map[block.id]) {
        this.updateBlock(props);
        this.el.appendChild(this.map[block.id].el);
      } else {
        this.createBlock(props);
        this.el.appendChild(this.map[block.id].el);
      }
    });
  }

  private createBlock(props: BlockViewProps) {
    const blockView = new BlockView(props);
    this.map[props.block.id] = blockView;
  }

  private updateBlock(props: BlockViewProps) {
    if (this.map[props.block.id]) {
      this.map[props.block.id].update(props);
    }
  }

  private removeBlock(blockId: string) {
    if (this.map[blockId]) {
      this.el.removeChild(this.map[blockId].el);
      delete this.map[blockId];
    }
  }

  private sync() {
    const newBlocks = [];
    const els = document.querySelectorAll<HTMLDivElement>('[data-blockid]');
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const id = el.dataset.blockid;
      const block = this.props.paper.findBlock(id);
      if (block) {
        const schema = this.props.schema.find(block.type);
        const newBlock = schema.view.toBlock(el);
        if (newBlock) {
          newBlocks.push(newBlock);
        } else {
          this.removeBlock(id);
        }
      } else {
        this.removeBlock(id);
      }
    }
    this.props.paper.setBlocks(newBlocks);
  }

  private getCursor(): Cursor {
    const sel = window.getSelection();
    const cursor: Cursor = {
      isCollapsed: sel.isCollapsed,
      anchorId: null,
      anchorOffset: sel.anchorOffset,
      focusId: null,
      focusOffset: sel.focusOffset,
    };

    let el: any = sel.anchorNode;
    while (!el.dataset?.blockid) {
      el = el.parentElement;
    }
    cursor.anchorId = el.dataset.blockid;

    el = sel.focusNode;
    while (!el.dataset?.blockid) {
      el = el.parentElement;
    }
    cursor.focusId = el.dataset.blockid;

    return cursor;
  }

  private afterRendering(callback: Function) {
    Promise.resolve().then(() => {
      callback();
    });
  }

  private focus(anchorElement: ChildNode, anchorOffset: number, focusElement?: ChildNode, focusOffset?: number) {
    const range = document.createRange();
    range.setStart(anchorElement, anchorOffset);
    range.setEnd(focusElement || anchorElement, focusOffset !== undefined ? focusOffset : anchorOffset);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private keepCursor(cursor: Cursor) {
    this.afterRendering(() => {
      const anchorElement = this.el.querySelector(`[data-blockid="${cursor.anchorId}"] [data-text]`).childNodes[0];
      const focusElement = this.el.querySelector(`[data-blockid="${cursor.focusId}"] [data-text]`).childNodes[0];
      this.focus(anchorElement, cursor.anchorOffset, focusElement, cursor.focusOffset);
    });
  }

  private onKeyDown(event) {
    const ctx: CommandContext = {
      schema: this.props.schema,
      paper: this.props.paper,
      cursor: this.getCursor(),
    };

    const key = event.key;
    // const meta = event.metaKey;
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey;

    switch (key) {
      case 'b': {
        if (ctrl) {
          event.preventDefault();
        }
        break;
      }
      case 'i': {
        if (ctrl) {
          event.preventDefault();
        }
        break;
      }
      case 's': {
        if (ctrl) {
          event.preventDefault();
        }
        break;
      }
      case 'Enter': {
        if (ctrl) {
          console.log('Take action');
        } else {
          if (!event.isComposing) {
            event.preventDefault();
            this.keepCursor(ctx.cursor);
            commands.splitBlock(ctx);
            this.props.paper.commit();
          }
        }
        break;
      }
      case 'Backspace': {
        if (this.props.paper.blocks.length === 1 && this.props.paper.blocks[0].text.length === 0) {
          event.preventDefault();
        }
        break;
      }
      case 'Tab': {
        event.preventDefault();
        if (shift) {
          commands.outdent(ctx);
        } else {
          commands.indent(ctx);
        }
        this.props.paper.commit();
        break;
      }
    }
  }

  private onPaste() {
    // TODO toBlock(el)するようにする
    event.preventDefault();
  }

  private onDrop() {
    event.preventDefault();
  }
}
