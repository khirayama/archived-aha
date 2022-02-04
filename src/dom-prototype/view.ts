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

  public props: BlockViewProps;

  private child: any = null;

  constructor(props: BlockViewProps) {
    this.props = props;
    this.mount();
  }

  public mount() {
    this.el = document.createElement('div');
    this.el.dataset.blockid = this.props.block.id;

    const schema = this.props.schema.find(this.props.block.type);
    const view = new schema.view(this.props);
    this.el.appendChild(view.el);
    this.child = view;
  }

  public update(props: BlockViewProps) {
    this.props = props;
    const schema = props.schema.find(props.block.type);
    if (this.child.props.block.type !== this.props.block.type) {
      const view = new schema.view(this.props);
      this.el.replaceChild(view.el, this.child.el);
      this.child = view;
    } else {
      this.child.update(this.props);
    }
  }
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

  public mount() {
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

  public update(props: PaperViewProp) {
    const fragment = new DocumentFragment();

    this.props = props;
    this.props.paper.blocks.forEach((block, i) => {
      const props: BlockViewProps = {
        paper: this.props.paper,
        schema: this.props.schema,
        block,
      };
      if (this.map[block.id]) {
        this.updateBlock(props);
      } else {
        this.createBlock(props);
      }
      fragment.appendChild(this.map[block.id].el);
    });

    this.el.appendChild(fragment);
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
    this.el.addEventListener('input', this.onInput.bind(this));
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

  private focus(anchorNode: ChildNode, anchorOffset: number, focusNode?: ChildNode, focusOffset?: number) {
    const range = document.createRange();
    range.setStart(anchorNode, anchorOffset);
    range.setEnd(focusNode || anchorNode, focusOffset !== undefined ? focusOffset : anchorOffset);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private keepCursor(cursor: Cursor) {
    this.afterRendering(() => {
      const anchorNode: ChildNode = this.el.querySelector(`[data-blockid="${cursor.anchorId}"] [data-focusable]`)
        .childNodes[0];
      const focusNode: ChildNode = this.el.querySelector(`[data-blockid="${cursor.focusId}"] [data-focusable]`)
        .childNodes[0];
      this.focus(anchorNode, cursor.anchorOffset, focusNode, cursor.focusOffset);
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
          event.preventDefault();
          commands.takeAction(ctx);
          this.keepCursor(ctx.cursor);
          this.props.paper.commit();
        } else {
          if (!event.isComposing) {
            event.preventDefault();
            commands.splitBlock(ctx);
            this.afterRendering(() => {
              const nextBlock = this.props.paper.findNextBlock(ctx.cursor.anchorId);
              const anchorNode: ChildNode = this.el.querySelector(`[data-blockid="${nextBlock.id}"] [data-focusable]`);
              this.focus(anchorNode, 0);
            });
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
          this.keepCursor(ctx.cursor);
          commands.outdent(ctx);
        } else {
          this.keepCursor(ctx.cursor);
          commands.indent(ctx);
        }
        this.props.paper.commit();
        break;
      }
    }
  }

  private onInput() {
    const cursor = this.getCursor();
    const block = this.props.paper.findBlock(cursor.anchorId);
    if (cursor.isCollapsed && block.text !== null) {
      const val = block.text;
      const result = this.props.schema.execInputRule(val);
      if (result) {
        const ctx: CommandContext = {
          schema: this.props.schema,
          paper: this.props.paper,
          cursor: this.getCursor(),
        };
        commands.updateText(ctx, result.text);
        commands.turnInto(ctx, result.schema.type as Block['type'], { attrs: result.attrs as any });
        this.props.paper.commit();
        const pos = Math.max(cursor.anchorOffset - (new Text(val).length - new Text(result.text).length), 0);
        this.afterRendering(() => {
          const blockElement = this.map[block.id].el;
          const focusableElement = this.map[block.id].el.querySelector('[data-focusable]').childNodes[0];
          if (block.text !== null) {
            this.focus(focusableElement, pos);
          } else {
            this.focus(focusableElement, focusableElement.childNodes.length);
          }
        });
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
