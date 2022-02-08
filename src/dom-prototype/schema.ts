import { v4 as uuid } from 'uuid';

import { BlockViewProps } from './view';
import { CommandContext } from './commands';

import styles from '../pages/dom-prototype.module.scss';

type SchemaType = {
  type: Block['type'];
  view: any;
  attrs?: {};
  inputRule?: [RegExp, Function?];
  isContinuation?: Boolean;
  create: Function;
  action?: Function | null;
};

const templates = {
  decoration: (children) => `<div class="${styles['decoration']}" contenteditable="false">${children}</div>`,
  handle: () => `<div class="${styles['handle']}" data-handle>${templates.icon('drag_indicator')}</div>`,
  indentation: (indent) => `<div class="${styles['indentation']}" data-indent=${indent}></div>`,
  icon: (name) => `<span class="material-icons">${name}</span>`,
};

type ParagraphBlock = {
  id: string;
  type: 'paragraph';
  text: string;
  indent: number;
  attrs: null;
};

class ParagraphView {
  public el: HTMLDivElement | null = null;

  public props: BlockViewProps<ParagraphBlock>;

  constructor(props: BlockViewProps<ParagraphBlock>) {
    this.props = props;
    this.mount();
  }

  public mount() {
    this.el = document.createElement('div');
    this.el.classList.add(styles['paragraphblock']);
    this.el.innerHTML = `${templates.decoration(
      `${templates.indentation(this.props.block.indent)}${templates.handle()}`,
    )}<p class="${styles['text']}" data-focusable>${this.props.block.text}</p>`;
    if (!this.props.block.text) {
      this.el.querySelector('[data-focusable]').appendChild(new Text(''));
    }
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

  public static toBlock(blockElement: HTMLDivElement): ParagraphBlock {
    if (!blockElement) {
      return null;
    }

    const id = blockElement.dataset.blockid;
    const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
    const text = blockElement.querySelector<HTMLSpanElement>('[data-focusable]')?.innerText.replace(/\n/g, '');

    if (text === undefined || Number.isNaN(indent)) {
      return null;
    }
    return {
      type: 'paragraph',
      id,
      indent,
      text,
      attrs: null,
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

type TodoBlock = {
  id: string;
  type: 'todo';
  text: string;
  indent: number;
  attrs: {
    done: boolean;
  };
};

class TodoView {
  public el: HTMLDivElement | null = null;

  public props: BlockViewProps<TodoBlock>;

  constructor(props: BlockViewProps<TodoBlock>) {
    this.props = props;
    this.mount();
  }

  public mount() {
    this.el = document.createElement('div');
    this.el.classList.add(styles['todoblock']);
    this.el.dataset.checked = String(this.props.block.attrs.done);
    this.el.innerHTML = `
      ${templates.decoration(`
        ${templates.indentation(this.props.block.indent)}
        ${templates.handle()}
        <div class=${styles['todocheckboxcontainer']}>
          <input type="checkbox" class=${styles['todocheckbox']} ${this.props.block.attrs.done ? 'checked' : ''} />
        </div>
      `)}
      <span class="${styles['text']}" data-focusable>${this.props.block.text}</span>
    `;
    if (!this.props.block.text) {
      this.el.querySelector('[data-focusable]').appendChild(new Text(''));
    }
  }

  public update(props: BlockViewProps<TodoBlock>) {
    this.props = props;

    const indentElement = this.el.querySelector<HTMLSpanElement>('[data-indent]');
    if (indentElement.dataset.indent !== String(props.block.indent)) {
      indentElement.dataset.indent = String(props.block.indent);
    }

    const textElement = this.el.querySelector<HTMLSpanElement>('[data-focusable]');
    if (textElement.innerText !== props.block.text) {
      textElement.innerText = props.block.text;
    }

    const checkboxElement = this.el.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkboxElement.checked !== props.block.attrs.done) {
      checkboxElement.checked = props.block.attrs.done;
    }

    this.el.dataset.checked = String(this.props.block.attrs.done);
  }

  public static toBlock(blockElement: HTMLDivElement): TodoBlock {
    if (!blockElement) {
      return null;
    }

    const id = blockElement.dataset.blockid;
    const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
    const text = blockElement.querySelector<HTMLSpanElement>('[data-focusable]')?.innerText.replace(/\n/g, '');
    const done = blockElement.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked;

    if (text === undefined || Number.isNaN(indent)) {
      return null;
    }

    return {
      type: 'todo',
      id,
      indent,
      text,
      attrs: {
        done,
      },
    };
  }
}

export const todoSchema = {
  type: 'todo',
  inputRule: [
    /^\[(?<done>.*)\]\s/,
    (groups: { done: string }) => {
      return {
        done: !!groups.done.trim(),
      };
    },
  ],
  action: (ctx: CommandContext, block: TodoBlock) => {
    const newBlocks = ctx.paper.blocks.map((b) => {
      if (block.id === b.id) {
        b.attrs.done = !b.attrs.done;
      }
      return { ...b };
    });
    ctx.paper.setBlocks(newBlocks);
  },
  create: (block: Partial<TodoBlock>): TodoBlock => {
    return {
      id: uuid(),
      text: '',
      indent: 0,
      ...block,
      type: 'todo',
      attrs: {
        done: false,
        ...block.attrs,
      },
    };
  },
  view: TodoView,
};

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingBlock = {
  id: string;
  type: 'heading';
  text: string;
  indent: number;
  attrs: {
    level: HeadingLevel;
  };
};

class HeadingView {
  public el: HTMLDivElement | null = null;

  public props: BlockViewProps<HeadingBlock>;

  constructor(props: BlockViewProps<HeadingBlock>) {
    this.props = props;
    this.mount();
  }

  public mount() {
    const level = this.props.block.attrs.level;
    this.el = document.createElement('div');
    this.el.classList.add(styles[`heading${level}block`]);
    this.el.innerHTML = `${templates.decoration(
      `${templates.indentation(this.props.block.indent)}${templates.handle()}`,
    )}<h${level} style="${styles['text']}" data-focusable>${this.props.block.text}</h${level}>`;
    if (!this.props.block.text) {
      this.el.querySelector('[data-focusable]').appendChild(new Text(''));
    }
  }

  public update(props: BlockViewProps<HeadingBlock>) {
    this.props = props;

    const indentElement = this.el.querySelector<HTMLSpanElement>('[data-indent]');
    if (indentElement.dataset.indent !== String(props.block.indent)) {
      indentElement.dataset.indent = String(props.block.indent);
    }

    const textElement = this.el.querySelector<HTMLSpanElement>('[data-focusable]');
    if (textElement.innerText !== props.block.text) {
      textElement.innerText = props.block.text;
    }

    const headingElement = this.el.querySelector<HTMLHeadingElement>('[data-focusable]');
    const level = Number(headingElement.tagName.replace('H', ''));
    if (level !== props.block.attrs.level) {
      this.el.classList.remove(styles[`heading${level}block`]);
      this.el.classList.add(styles[`heading${props.block.attrs.level}block`]);
      const h = document.createElement('h' + props.block.attrs.level);
      for (let i = 0; i < headingElement.children.length; i += 1) {
        h.appendChild(headingElement.children[i]);
      }
      headingElement.parentNode.replaceChild(h, headingElement);
    }
  }

  public static toBlock(blockElement: HTMLDivElement): HeadingBlock {
    if (!blockElement) {
      return null;
    }

    const id = blockElement.dataset.blockid;
    const indent = Number(blockElement.querySelector<HTMLSpanElement>('[data-indent]')?.dataset?.indent);
    const text = blockElement.querySelector<HTMLSpanElement>('[data-focusable]')?.innerText.replace(/\n/g, '');
    const level = Number(
      blockElement.querySelector<HTMLHeadingElement>('[data-focusable]').tagName.replace('H', ''),
    ) as HeadingLevel;

    if (text === undefined || Number.isNaN(indent)) {
      return null;
    }
    return {
      type: 'heading',
      id,
      indent,
      text,
      attrs: {
        level,
      },
    };
  }
}

export const headingSchema = {
  type: 'heading',
  isContinuation: false,
  inputRule: [
    /^(?<level>#+)\s/,
    (groups: { level: string }) => {
      const l = groups.level.length;
      const level = Math.max(Math.min(l, 6), 1);
      return {
        level,
      };
    },
  ],
  create: (block: Partial<HeadingBlock>): HeadingBlock => {
    return {
      id: uuid(),
      text: '',
      indent: 0,
      ...block,
      type: 'heading',
      attrs: {
        level: 1,
        ...block.attrs,
      },
    };
  },
  view: HeadingView,
};

export type Block = ParagraphBlock | TodoBlock | HeadingBlock;

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
