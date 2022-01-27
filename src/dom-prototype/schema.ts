import { v4 as uuid } from 'uuid';

import { Paper } from './model';
import { BlockViewProps, PaperElement } from './view';

import styles from '../pages/dom-prototype.module.scss';

type SchemaType = {
  type: string;
  view: any;
  attrs?: {};
  inputRule?: [RegExp, Function?];
  isContinuation?: Boolean;
  create: Function;
  action?: Function | null;
};

type ParagraphBlock = {
  id: string;
  type: 'paragraph';
  text: string;
  indent: number;
  attrs: null;
};

const templates = {
  decoration: (children) => `<div class="${styles['decoration']}" contenteditable="false">${children}</div>`,
  handle: () => `<div class="${styles['handle']}" data-handle>${templates.icon('drag_indicator')}</div>`,
  indentation: (indent) => `<div class="${styles['indentation']}" data-indent=${indent}></div>`,
  text: (text) => `<div class="${styles['text']}" data-text>${text}</div>`,
  icon: (name) => `<span class="material-icons">${name}</span>`,
};

class ParagraphView {
  private el: PaperElement;

  private paper: Paper;

  private schema: Schema;

  private block: Block;

  constructor(props: BlockViewProps<ParagraphBlock>) {
    this.el = props.el;
    this.paper = props.paper;
    this.schema = props.schema;
    this.block = props.block;
  }

  public mount() {
    return `<div class="${styles['paragraphblock']}">
      ${templates.decoration(`
        ${templates.indentation(this.block.indent)}
        ${templates.handle()}
      `)}
      ${templates.text(this.block.text)}
    </div>`;
  }

  public update() {
    const blockElement = this.el.querySelector(`[data-blockid="${this.block.id}"]`);

    const indentElement = blockElement.querySelector<HTMLSpanElement>('[data-indent]');
    if (indentElement.dataset.indent !== String(this.block.indent)) {
      indentElement.dataset.indent = String(this.block.indent);
    }

    const textElement = blockElement.querySelector<HTMLSpanElement>('[data-text]');
    if (textElement.innerText !== this.block.text) {
      textElement.innerText = this.block.text;
    }
  }

  public addEventListeners(paperElement) {
    paperElement.addEventListener('click', (event) => {
      let el = event.target;
      while (!el.dataset.blockid) {
        el = el.parentElement;
      }
      const blockElement = el;
      const blockId = el.dataset.blockid;
      if (blockId === this.block.id) {
        console.log('click paragraph block');
      }
    });
  }

  public static toBlock(blockElement: HTMLDivElement) {
    if (!blockElement) {
      return null;
    }

    const id = blockElement.dataset.blockid;
    const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
    const text = blockElement.querySelector<HTMLSpanElement>('[data-text]')?.innerText.replace(/\n/g, '');

    if (text === undefined || isNaN(indent)) {
      return null;
    }
    return {
      type: 'paragraph',
      id,
      indent,
      text,
    };
  }
}

export const paragraphSchema: SchemaType = {
  type: 'paragraph',
  create: (block: Partial<ParagraphBlock>): ParagraphBlock => {
    return {
      id: uuid(),
      text: '',
      indent: 0,
      ...block,
      type: 'paragraph',
      attrs: null,
    };
  },
  view: ParagraphView,
};

export type Block = ParagraphBlock;

export class Schema {
  private schemas: SchemaType[];

  constructor(schemas: SchemaType[]) {
    this.schemas = schemas;
  }

  public createBlock(typ?: Block['type'], block: Partial<Block> = {}): Block {
    typ = typ || block.type;
    const schema = this.find(typ) || this.schemas[0];

    return schema.create(block);
  }

  public find(typ: Block['type']) {
    return this.schemas.filter((s) => s.type == typ)[0] || null;
  }

  public defaultSchema() {
    return this.schemas[0] || null;
  }

  public execInputRule(text: string) {
    for (let i = 0; i < this.schemas.length; i += 1) {
      const schema = this.schemas[i];
      if (schema.inputRule) {
        if (schema.inputRule[0].test(text)) {
          const result = schema.inputRule[0].exec(text);
          const attrs = (schema.inputRule[1] ? schema.inputRule[1](result.groups) : result.groups) || null;
          return {
            schema,
            text: text.replace(schema.inputRule[0], ''),
            attrs,
          };
        }
      }
    }
    return null;
  }
}
