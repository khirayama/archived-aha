import { v4 as uuid } from 'uuid';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrate } from 'react-dom';

import styles from './prototype.module.scss';

/*
 * - Schema
 * - Commands
 * - Model
 * - View
 */

/* Schema */
type SchemaType = {
  type: string;
  view: (props: BlockViewProps) => JSX.Element;
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
  view: (props: BlockViewProps<ParagraphBlock>) => {
    const block = props.block;
    return (
      <div className={styles['paragraphblock']}>
        <div className={styles['decoration']} contentEditable={false}>
          <div className={styles['indentation']} data-indent={block.indent} />
          <div className={styles['handle']}>
            <IconView name="drag_indicator" />
          </div>
        </div>
        <span className={styles['text']} data-text>
          {block.text}
        </span>
      </div>
    );
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
function IconView(props: { name: string }) {
  return <span className="material-icons">{props.name}</span>;
}

type BlockViewProps<T = Block> = {
  block: T;
  paper: Paper;
  schema: Schema;
};

function BlockView(props: BlockViewProps) {
  const block = props.block;
  const schm = props.schema.find(block.type);

  return (
    <div data-blockid={block.id} className={styles['block']} onClick={() => console.log('click')}>
      {schm.view(props)}
    </div>
  );
}

type PaperViewProps = {
  schema: Schema;
  paper: Paper;
};

type PaperViewState = {
  blocks: Block[];
};

class PaperView extends React.Component<PaperViewProps, PaperViewState> {
  public state: PaperViewState = {
    blocks: [],
  };

  private ref: React.RefObject<HTMLDivElement>;

  constructor(props: PaperViewProps) {
    super(props);

    this.state = { blocks: props.paper.blocks };
    this.ref = React.createRef<HTMLDivElement>();

    this.onPaperChange = this.onPaperChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  public componentDidMount() {
    hydrate(this.renderPaper(), this.ref.current);
    this.props.paper.onChange(this.onPaperChange);
  }

  public componentDidUpdate() {
    hydrate(this.renderPaper(), this.ref.current);
  }

  public componentWillUnmount() {
    this.props.paper.offChange(this.onPaperChange);
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

  private getCommandContext(): CommandContext {
    return {
      paper: this.props.paper,
      schema: this.props.schema,
      cursor: this.getCursor(),
    };
  }

  private onPaperChange(paper: Paper) {
    this.setState({ blocks: paper.blocks });
  }

  private onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const paper = this.props.paper;
    const blocks = this.state.blocks;
    const defaultSchema = this.props.schema.defaultSchema();

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
        event.preventDefault();
        if (ctrl) {
          // TODO Take action
        } else {
          // TODO 色々
        }
        break;
      }
      case 'Backspace': {
        break;
      }
      case 'Tab': {
        event.preventDefault();
        if (shift) {
          commands.outdent(this.getCommandContext());
        } else {
          commands.indent(this.getCommandContext());
        }
        break;
      }
      default: {
      }
    }
    this.props.paper.commit();
  }

  private onInput(event: React.KeyboardEvent<HTMLDivElement>) {
    const els = document.querySelectorAll('[data-blockid]');
    const blockTexts = {};
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const blockId = el?.dataset.blockid;
      const text = el.querySelector('[data-text]')?.innerText;
      blockTexts[blockId] = text;
    }
    commands.syncTexts(this.getCommandContext(), blockTexts);
    this.props.paper.commit();
  }

  private renderPaper() {
    return (
      <>
        {this.state.blocks.map((block) => {
          return <BlockView key={block.id} block={block} paper={this.props.paper} schema={this.props.schema} />;
        })}
      </>
    );
  }

  public render() {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        ref={this.ref}
        onKeyDown={this.onKeyDown}
        onInput={this.onInput}
        dangerouslySetInnerHTML={{ __html: renderToString(this.renderPaper()) }}
      />
    );
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
  return <PaperView schema={schema} paper={paper} />;
}
