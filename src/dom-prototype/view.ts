import { Schema, Block } from './schema';
import { Paper } from './model';

export type PaperElement = HTMLDivElement;

export type BlockViewProps<T = Block> = {
  el: PaperElement;
  paper: Paper;
  schema: Schema;
  block: T;
};

class BlockView {
  private el: PaperElement;

  private paper: Paper;

  private schema: Schema;

  private block: Block;

  private view: any;

  constructor(props: BlockViewProps) {
    this.el = props.el;
    this.paper = props.paper;
    this.schema = props.schema;
    this.block = props.block;
  }

  public mount() {
    const schema = this.schema.find(this.block.type);
    this.view = new schema.view({ paper: this.paper, schema: this.schema, block: this.block, el: this.el });
    this.view.addEventListeners(this.el);
    return `<div data-blockid=${this.block.id}>${this.view.mount()}</div>`;
  }

  public update() {
    this.block = this.paper.findBlock(this.block.id);
    this.view.block = this.block;
    this.view.update();
  }
}

export class PaperView {
  private blockViews: { [id: string]: any } = {};

  private el: PaperElement;

  private paper: Paper;

  private schema: Schema;

  constructor(el: PaperElement, props: { schema: Schema; paper: Paper }) {
    this.el = el;
    this.paper = props.paper;
    this.schema = props.schema;

    this.el.innerHTML = this.mount();
    this.addEventListeners();
  }

  private addEventListeners() {
    const observer = new MutationObserver(() => {
      const newBlocks = [];
      const els = document.querySelectorAll<HTMLDivElement>('[data-blockid]');
      for (let i = 0; i < els.length; i += 1) {
        const el = els[i];
        const id = el.dataset.blockid;
        const block = this.paper.findBlock(id);
        const schema = this.schema.find(block.type);
        const newBlock = schema.view.toBlock(el);
        if (newBlock) {
          newBlocks.push(newBlock);
        } else {
          this.removeBlockView(block.id);
        }
      }
      this.paper.setBlocks(newBlocks);
    });

    observer.observe(this.el, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });

    this.paper.onChange(() => {
      this.update();
    });

    this.el.addEventListener('drop', (event) => {
      event.preventDefault();
    });

    this.el.addEventListener('paste', (event) => {
      event.preventDefault();
    });

    this.el.addEventListener('keydown', (event) => {
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
          if (!event.isComposing) {
            event.preventDefault();
          }
          break;
        }
        case 'Backspace': {
          if (this.paper.blocks.length === 1 && this.paper.blocks[0].text.length === 0) {
            event.preventDefault();
          }
          break;
        }
        case 'Tab': {
          event.preventDefault();
          if (shift) {
            this.paper.setBlocks(
              this.paper.blocks.map((block) => {
                return {
                  ...block,
                  indent: block.indent - 1,
                };
              }),
            );
          } else {
            this.paper.setBlocks(
              this.paper.blocks.map((block) => {
                return {
                  ...block,
                  indent: block.indent + 1,
                };
              }),
            );
          }
          this.paper.commit();
          break;
        }
      }
    });
  }

  private mount() {
    return `
      <div contenteditable>${this.paper.blocks
        .map((block) => {
          const props = { paper: this.paper, schema: this.schema, block, el: this.el };
          const blockView = new BlockView(props);
          this.blockViews[block.id] = blockView;
          return blockView.mount();
        })
        .join('')}
      </div>`;
  }

  private update() {
    for (let i = 0; i < this.paper.blocks.length; i += 1) {
      const block = this.paper.blocks[i];
      this.blockViews[block.id].update();
    }
  }

  private removeBlockView(blockId: string) {
    delete this.blockViews[blockId];
    const el = this.el.querySelector(`[data-blockid="${blockId}"]`);
    if (el) {
      el.parentNode.removeChild(el);
    }
  }
}
