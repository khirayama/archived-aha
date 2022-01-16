import * as React from 'react';
import { v4 as uuid } from 'uuid';

import {
  BlockComponentProps,
  TextComponent,
  IndentationComponent,
  HandleComponent,
  FocusableComponent,
} from './components';

import styles from './components/index.module.scss';

/*
 * TODO todoSchema with action
 * TODO add attrs editor component to imageSchema width
 */

export type SchemaType = {
  type: string;
  component: React.FC;
  attrs?: {};
  inputRule?: RegExp;
  groupsToAttrs?: Function;
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
  inputRule: /^(?<level>#*)\s/,
  groupsToAttrs: (groups: { level: string }) => {
    const l = groups.level.length;
    const level = Math.max(Math.min(l, 6), 0);
    return {
      level,
    };
  },
  create: (block: Partial<HeadingBlock>): HeadingBlock => {
    return {
      ...createBaseBlock(block),
      type: 'heading',
      attrs: block.attrs || { level: 1 },
    };
  },
  component: (props: BlockComponentProps) => {
    const level = props.block.attrs.level;
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
  inputRule: /^[-+*]\s/,
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

type ImageBlock = BaseBlock & {
  type: 'image';
  attrs: {
    src: string;
  };
};

export const imageSchema = {
  type: 'image',
  inputRule: /^\!\[(?<caption>.*)\]\((?<src>.*)\)\s/,
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

export type Block = ParagraphBlock | HeadingBlock | ListBlock | ImageBlock;

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
        if (schema.inputRule.test(text)) {
          const result = schema.inputRule.exec(text);
          const attrs = (schema.groupsToAttrs ? schema.groupsToAttrs(result.groups) : result.groups) || null;
          return {
            schema,
            text: text.replace(schema.inputRule, ''),
            attrs,
          };
        }
      }
    }
    return null;
  }
}
