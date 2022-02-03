import { v4 as uuid } from 'uuid';

import { BlockViewProps } from './view';

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
  text: (text) => `<div class="${styles['text']}" data-focusable>${text}</div>`,
  icon: (name) => `<span class="material-icons">${name}</span>`,
};

abstract class View<T> {
  public el: HTMLElement | null = null;

  protected props: BlockViewProps<T>;

  constructor(props: BlockViewProps<T>) {
    this.props = props;
    this.mount();
  }

  protected mount() {}
}

class ParagraphView extends View<ParagraphBlock> {
  public mount() {
    this.el = document.createElement('div');
    this.el.classList.add(styles['paragraphblock']);
    this.el.innerHTML = `
      ${templates.decoration(`
        ${templates.indentation(this.props.block.indent)}
        ${templates.handle()}
      `)}
      ${templates.text(this.props.block.text)}
    `;
    if (!this.props.block.text) {
      this.el.querySelector('[data-focusable]').appendChild(new Text(''));
    }

    this.el.addEventListener('click', (event) => {
      console.log('click paragraph block');
    });
  }

  public update(props: BlockViewProps<ParagraphBlock>) {
    this.props = props;

    const indentElement = this.el.querySelector<HTMLSpanElement>('[data-indent]');
    if (indentElement.dataset.indent !== String(props.block.indent)) {
      indentElement.dataset.indent = String(props.block.indent);
    }

    const textElement = this.el.querySelector<HTMLSpanElement>('[data-focusable]');
    if (textElement.innerText !== props.block.text) {
      textElement.innerText = props.block.text;
    }
  }

  public static toBlock(blockElement: HTMLDivElement) {
    if (!blockElement) {
      return null;
    }

    const id = blockElement.dataset.blockid;
    const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
    const text = blockElement.querySelector<HTMLSpanElement>('[data-focusable]')?.innerText.replace(/\n/g, '');

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
