import { v4 as uuid } from 'uuid';
import * as React from 'react';
import Head from 'next/head';
import { renderToString } from 'react-dom/server';
import { hydrate } from 'react-dom';

import styles from './dom-prototype.module.scss';

/*
 * - Schema
 * - Commands
 * - Model
 * - View
 */

/* Schema */
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

const paragraphSchema: SchemaType = {
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
  view: class ParagraphView {
    constructor() {
      console.log('create paragraph view.');
    }

    public template() {
      return `<div>paragraph</div>`;
    }
  },
};

type Block = ParagraphBlock;

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

/* Commands */
type CommandContext = {
  paper: Paper;
  schema: Schema;
  cursor: Cursor;
};

function blockBetween({ paper, schema, cursor }: CommandContext, func: Function) {
  let isStarted = false;
  const newBlocks = paper.blocks.map((b) => {
    if (b.id === cursor.anchorId || b.id === cursor.focusId) {
      isStarted = !isStarted;
      func(b);
    } else if (isStarted && !cursor.isCollapsed) {
      func(b);
    }
    return {
      ...b,
    };
  });
  return newBlocks;
}

const commands = {
  syncTexts: (ctx: CommandContext, blockTexts: { [id: string]: string }) => {
    ctx.paper.tr(() => {
      const newBlocks = ctx.paper.blocks
        .map((b) => {
          // TODO 画像とか、text nullなものはskipするようにする必要がある？
          if (blockTexts[b.id]) {
            b.text = blockTexts[b.id];
          } else {
            return null;
          }
          return { ...b };
        })
        .filter((b) => !!b);
      paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  indent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = blockBetween(ctx, (block) => {
        block.indent = Math.min(block.indent + 1, 8);
      });
      paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  outdent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = blockBetween(ctx, (block) => {
        block.indent = Math.max(block.indent - 1, 0);
      });
      paper.setBlocks(newBlocks);
    });
    return ctx;
  },
};

/* Model */
type Cursor = {
  isCollapsed: boolean;
  anchorId: string | null;
  anchorOffset: number | null;
  focusId: string | null;
  focusOffset: number | null;
};

class Paper {
  private listeners: Function[] = [];

  private transactions: Function[] = [];

  public blocks: Block[];

  constructor(blocks = []) {
    this.blocks = blocks;
  }

  public onChange(callback: Function) {
    this.listeners.push(callback);
  }

  public offChange(callback: Function) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  public tr(tr: Function) {
    this.transactions.push(tr);
    return this;
  }

  public setBlocks(blocks: Block[]) {
    this.blocks = blocks;
  }

  public commit() {
    this.transactions.forEach((tr) => {
      tr(this);
    });
    this.transactions = [];
    this.listeners.forEach((callback) => {
      callback(this);
    });
  }

  public findBlock(blockId: string): Block | null {
    return this.blocks.filter((b) => b.id === blockId)[0] || null;
  }

  public findGroupedBlocks(blockId: string): Block[] {
    const block = this.findBlock(blockId);
    const blocks = [];
    let isSameBlock = false;
    for (let i = 0; i < this.blocks.length; i += 1) {
      const b = this.blocks[i];
      if (b.id === block.id || (isSameBlock && block.indent < b.indent)) {
        isSameBlock = true;
        blocks.push(b);
      } else {
        isSameBlock = false;
      }
    }
    return blocks;
  }

  public findNextBlock(blockId: string): Block | null {
    for (let i = 0; i < this.blocks.length; i += 1) {
      if (this.blocks[i].id === blockId) {
        return this.blocks[i + 1] || null;
      }
    }
  }

  public findPrevBlock(blockId: string): Block | null {
    for (let i = 0; i < this.blocks.length; i += 1) {
      if (this.blocks[i].id === blockId) {
        return this.blocks[i - 1] || null;
      }
    }
  }
}

/* View */
class BlockView {
  private id: string = uuid();

  private el: HTMLDivElement;

  private paper: Paper;

  private schema: Schema;

  constructor(props: { schema: Schema; paper: Paper; block: Block }) {
    this.el = null;
    this.paper = props.paper;
    this.schema = props.schema;
    this.block = props.block;
  }

  private addEventListeners() {
    if (this.el) {
      this.el.addEventListener('click', () => {
        console.log('click block');
      });
    }
  }

  public template() {
    return `<div viewid=${this.id} data-blockid=${this.block.id}>${this.block.text}</div>`;
  }
}

class PaperView {
  private id: string = uuid();

  private children: { [id: string]: any } = {};

  private root: HTMLElement;

  private el: HTMLDivElement;

  private paper: Paper;

  private schema: Schema;

  constructor(props: { schema: Schema; paper: Paper }) {
    this.el = null;
    this.paper = props.paper;
    this.schema = props.schema;
  }

  private afterRendering(callback) {
    setTimeout(() => {
      callback.bind(this)();
    }, 0);
  }

  private addEventListeners() {
    this.el.addEventListener('click', () => {
      console.log('click paper');
    });
  }

  private viewDidMount() {
    this.paper.onChange(() => {
      console.log('change blocks!');
      this.render();
    });
    console.log('did mount!');
  }

  private mountChildren(View, props) {
    const view = new View(props);
    return view.template();
  }

  private template() {
    return `<div contenteditable viewid=${this.id}>${this.paper.blocks
      .map((block) => {
        const props = { paper: this.paper, schema: this.schema, block };
        const blockView = new BlockView(props);
        this.children[blockView.id] = blockView;
        return blockView.template();
      })
      .join('')}</div>`;
  }

  private render() {
    console.log('render');
    console.log(this.paper.blocks);
    this.el.innerHTML = this.template();
    this.addEventListeners();
    const children = Object.values(this.children);
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      child.render();
    }
  }
}

type PaperViewContainerProps = {
  schema: Schema;
  paper: Paper;
};

type PaperViewContainerState = {
  blocks: Block[];
};

class PaperViewContainer extends React.Component<PaperViewContainerProps, PaperViewContainerState> {
  public state: PaperViewContainerState = {
    blocks: [],
  };

  private ref: React.RefObject<HTMLDivElement>;

  constructor(props: PaperViewContainerProps) {
    super(props);

    this.ref = React.createRef<HTMLDivElement>();
  }

  public componentDidMount() {
    const paperView = new PaperView({ paper: this.props.paper, schema: this.props.schema });
    paperView.el = this.ref.current;
    paperView.viewDidMount();
    paperView.render();
  }

  public render() {
    return <div ref={this.ref} />;
  }
}

export function getServerSideProps() {
  return {
    props: {
      blocks: [
        // schema.createBlock('heading', { text: 'TITLE OF THIS PAPER', attrs: { level: 1 } }),
        // schema.createBlock('todo', { text: 'タスク1' }),
        // schema.createBlock('todo', { text: 'タスク2', attrs: { done: true } }),
        schema.createBlock('paragraph', { text: '𠮷野屋で𩸽頼んで𠮟られる😭' }),
        // schema.createBlock('heading', { text: '000', attrs: { level: 2 } }),
        schema.createBlock('paragraph', { text: '111' }),
        schema.createBlock('paragraph', { text: '222', indent: 1 }),
        schema.createBlock('paragraph', { text: '333', indent: 2 }),
        schema.createBlock('paragraph', { text: '444' }),
        schema.createBlock('paragraph', { text: '555' }),
        schema.createBlock('paragraph', { text: '666', indent: 1 }),
        schema.createBlock('paragraph', { text: '777', indent: 1 }),
        schema.createBlock('paragraph', { text: '888', indent: 2 }),
        schema.createBlock('paragraph', { text: '999', indent: 1 }),
        schema.createBlock('paragraph', { text: '101010', indent: 1 }),
        schema.createBlock('paragraph', { text: '111111' }),
        // schema.createBlock('image', { attrs: { src: 'https://placehold.jp/256x256.png' } }),
        schema.createBlock('paragraph', { text: '121212' }),
      ],
    },
  };
}

const schema = new Schema([paragraphSchema]);
const paper = new Paper();

export default function PrototypePage(props) {
  paper.setBlocks(props.blocks);
  return (
    <>
      <Head>
        <title>DOM Prototype</title>
      </Head>
      <PaperViewContainer schema={schema} paper={paper} />
    </>
  );
}
