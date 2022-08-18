import * as React from 'react';
import { v4 as uuid } from 'uuid';

import {
  BlockComponentProps,
  TextComponent,
  IndentationComponent,
  HandleComponent,
  FocusableComponent,
} from './components';
import { CommandContext } from './commands';

import styles from './components/index.module.scss';

/*
 * TODO add attrs editor component to imageSchema width
 */

export type SchemaType = {
  type: string;
  component: React.FC;
  attrs?: {};
  inputRule?: [RegExp, Function?];
  isContinuation?: Boolean;
  create: Function;
  action?: Function | null;
};

type BaseBlock = {
  id: string;
  text: string | null;
  indent: number;
};

function createBaseBlock(block: Partial<Block> = {}): BaseBlock {
  const b = { ...block };
  if (b.text === null) {
    b.text = '';
  }
  delete b['attrs'];

  return {
    id: uuid(),
    text: '',
    indent: 0,
    ...b,
  };
}

type ParagraphBlock = BaseBlock & {
  type: 'paragraph';
};

export const paragraphSchema = {
  type: 'paragraph',
  create: (block: Partial<ParagraphBlock>): ParagraphBlock => {
    return {
      ...createBaseBlock(block),
      type: 'paragraph',
    };
  },
  component: (props: BlockComponentProps) => {
    return (
      <>
        <IndentationComponent {...props} />
        <HandleComponent {...props} />
        <TextComponent {...props} />
      </>
    );
  },
};

type HeadingBlock = BaseBlock & {
  type: 'heading';
  attrs: {
    level: number;
  };
};

export const headingSchema = {
  type: 'heading',
  isContinuation: false,
  inputRule: [
    /^(?<level>#*)\s/,
    (groups: { level: string }) => {
      const l = groups.level.length;
      const level = Math.max(Math.min(l, 6), 0);
      return {
        level,
      };
    },
  ],
  create: (block: Partial<HeadingBlock>): HeadingBlock => {
    return {
      ...createBaseBlock(block),
      type: 'heading',
      attrs: block.attrs || { level: 1 },
    };
  },
  component: (props: BlockComponentProps) => {
    const level = (props.block as HeadingBlock).attrs.level;
    return React.createElement(
      `h${level}`,
      {
        className: styles[`heading${level}`],
      },
      <>
        <IndentationComponent {...props} />
        <HandleComponent {...props} />
        <TextComponent {...props} />
      </>,
    );
  },
};

type ListBlock = BaseBlock & {
  type: 'list';
};

export const listSchema = {
  type: 'list',
  inputRule: [/^[-+*]\s/],
  create: (block: Partial<ListBlock>): ListBlock => {
    return {
      ...createBaseBlock(block),
      type: 'list',
    };
  },
  component: (props: BlockComponentProps) => {
    return (
      <>
        <IndentationComponent {...props} />
        <HandleComponent {...props} />
        <span className={styles['list']} />
        <TextComponent {...props} />
      </>
    );
  },
};

type TodoBlock = BaseBlock & {
  type: 'todo';
  attrs: {
    done: boolean;
  };
};

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
  action: (ctx: CommandContext) => {
    const newBlocks = ctx.paper.blocks.map((b) => {
      if (ctx.block.id === b.id && b.type === 'todo') {
        b.attrs.done = !b.attrs.done;
      }
      return { ...b };
    });
    ctx.paper.setBlocks(newBlocks);
    ctx.paper.commit();
  },
  create: (block: Partial<TodoBlock>): TodoBlock => {
    return {
      ...createBaseBlock(block),
      type: 'todo',
      attrs: block.attrs || {
        done: false,
      },
    };
  },
  component: (props: BlockComponentProps) => {
    const block = props.block as TodoBlock;

    return (
      <>
        <IndentationComponent {...props} />
        <HandleComponent {...props} />
        <span className={styles['todo']} data-checked={block.attrs.done}>
          <input
            className={styles['todocheckbox']}
            type="checkbox"
            checked={block.attrs.done}
            onChange={(e) => {
              const schema = props.schema.find(block.type);
              if (schema) {
                schema.action({
                  block,
                  schema: props.schema,
                  paper: props.paper,
                });
              }
            }}
          />
        </span>
        <TextComponent {...props} />
      </>
    );
  },
};

type ImageBlock = BaseBlock & {
  type: 'image';
  attrs: {
    src: string;
  };
};

export const imageSchema = {
  type: 'image',
  inputRule: [/^\!\[(?<caption>.*)\]\((?<src>.*)\)\s/],
  create: (block: Partial<ImageBlock>): ImageBlock => {
    return {
      ...createBaseBlock(block),
      type: 'image',
      text: null,
      attrs: block.attrs,
    };
  },
  component: (props: BlockComponentProps) => {
    if (props.block.type !== 'image') {
      return null;
    }

    return (
      <>
        <IndentationComponent {...props} />
        <HandleComponent {...props} />
        <FocusableComponent {...props}>
          <img src={props.block.attrs.src} className={styles['image']} />
        </FocusableComponent>
      </>
    );
  },
};

export type Block = ParagraphBlock | HeadingBlock | ListBlock | TodoBlock | ImageBlock;

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
