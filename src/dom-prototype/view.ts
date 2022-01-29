import { Schema, Block } from './schema';
import { Paper, Cursor } from './model';
import { CommandContext, commands } from '../dom-prototype/commands';

export type PaperElement = HTMLDivElement;

export type BlockViewProps<T = Block> = {
  key: string;
  paper: Paper;
  schema: Schema;
  block: T;
};

class BlockView {
  public el: HTMLDivElement | null = null;

  private children: { [id: string]: any } = {};

  public props: BlockViewProps;

  constructor(props: BlockViewProps) {
    this.props = props;
    this.render(props);
    this.addEventListeners();
  }

  private addEventListeners() {}

  public render(props) {
    this.props = props;

    if (this.el === null) {
      this.el = document.createElement('div');
      this.el.dataset.blockid = props.block.id;
    }
    const schema = props.schema.find(props.block.type);
    if (this.children[props.block.id]) {
      this.children[props.block.id].render(this.props);
    } else {
      const view = new schema.view(this.el, props);
      this.children[props.block.id] = view;
    }
  }
}

type PaperViewProp = {
  key: string;
  schema: Schema;
  paper: Paper;
};

export class PaperView {
  public el: HTMLDivElement | null = null;

  public props: PaperViewProp;

  private _: any = {
    order: {
      prev: [],
      next: [],
    },
    keys: [],
    map: {},
  };

  constructor(props: PaperViewProp) {
    this.props = props;
    this.render(props);
    this.addEventListeners();
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

  private addEventListeners() {
    const observer = new MutationObserver(() => {
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
          }
        }
      }
      this.props.paper.setBlocks(newBlocks);
      this.render(this.props);
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
      this.render(this.props);
    });

    this.el.addEventListener('drop', (event) => {
      event.preventDefault();
    });

    this.el.addEventListener('paste', (event) => {
      // TODO toBlock(el)するようにする
      event.preventDefault();
    });

    this.el.addEventListener('keydown', (event) => {
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
    });
  }

  private prepare(props: PaperViewProp) {
    this.props = props;
    this._.order.next = [];
  }

  private create<T extends { key: string }>(view: any, props: T) {
    this._.order.next.push(props.key);
    if (this._.map[props.key]) {
      this._.map[props.key].render(props);
    } else {
      const v = new view(props);
      this._.map[props.key] = v;
    }
  }

  private clean() {
    const keys = Object.keys(this._.map);
    for (let i = 0; i < this._.keys.length; i += 1) {
      const key = this._.keys[i];
      if (keys.indexOf(key) === -1) {
        const el = this._.map[key].el;
        this.el.removeChild(el);
        delete this._.map[key];
      }
    }
    this._.keys = keys;

    const l = Math.max(this._.order.next.length, this._.order.prev.length);
    for (let i = 0; i < l; i += 1) {
      const prevKey = this._.order.prev[i];
      const nextKey = this._.order.next[i];
      if (prevKey !== nextKey && this._.order.next[i - 1]) {
        this._.map[this._.order.next[i - 1]].el.insertAdjacentElement('afterend', this._.map[nextKey].el);
      }
    }
    this._.order.prev = this._.order.next;
  }

  private render(props: PaperViewProp) {
    this.prepare(props);

    if (this.el === null) {
      this.el = document.createElement('div');
      this.el.contentEditable = 'true';
    }

    this.props.paper.blocks.forEach((block, i) => {
      const props: BlockViewProps = {
        key: block.id,
        paper: this.props.paper,
        schema: this.props.schema,
        block,
      };
      this.create<BlockViewProps>(BlockView, props);
    });

    this.clean();
  }
}
