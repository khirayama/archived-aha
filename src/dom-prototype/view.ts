import { Schema, Block } from './schema';
import { Paper } from './model';

export type BlockViewProps<T = Block> = {
  el: HTMLElement;
  paper: Paper;
  schema: Schema;
  block: T;
};

class BlockView {
  private el: HTMLElement;

  private paper: Paper;

  private schema: Schema;

  private block: Block;

  constructor(props: BlockViewProps) {
    this.el = props.el;
    this.paper = props.paper;
    this.schema = props.schema;
    this.block = props.block;
  }

  public template() {
    const schema = this.schema.find(this.block.type);
    const view = new schema.view({ paper: this.paper, schema: this.schema, block: this.block, el: this.el });
    view.addEventListeners(this.el);
    return `<div data-blockid=${this.block.id}>${view.template()}</div>`;
  }
}

export class PaperView {
  private blocks: { [id: string]: any } = {};

  private el: HTMLElement;

  private paper: Paper;

  private schema: Schema;

  constructor(el: HTMLElement, props: { schema: Schema; paper: Paper }) {
    this.el = el;
    this.paper = props.paper;
    this.schema = props.schema;

    this.el.innerHTML = this.template();
    this.addEventListeners();
  }

  private addEventListeners() {
    const observer = new MutationObserver(() => {
      // console.table(mutations);
      const blocks = [];
      const blockElements = this.el.querySelectorAll('[data-blockid]');
      for (let i = 0; i < blockElements.length; i += 1) {
        const blockElement = blockElements[i] as HTMLDivElement;
        const id = blockElement.dataset.blockid;
        const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
        const text = blockElement.querySelector<HTMLSpanElement>('[data-text]')?.innerText;

        if (indent !== NaN && text !== undefined) {
          blocks.push({
            id,
            indent,
            text,
          });
        } else {
          console.log(`remove ${id}`);
        }
      }
    });

    observer.observe(this.el, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
      // attributes: false,
      // attributeOldValue: false,
      // characterData: true,
      // characterDataOldValue: true,
      // childList: false,
      // subtree: true,
    });

    this.el.addEventListener('click', () => {
      console.log('click paper');
    });
  }

  private template() {
    return `<div contenteditable>${this.paper.blocks
      .map((block) => {
        const props = { paper: this.paper, schema: this.schema, block, el: this.el };
        const blockView = new BlockView(props);
        this.blocks[block.id] = blockView;
        return blockView.template();
      })
      .join('')}</div>`;
  }
}
