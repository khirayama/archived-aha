import { v4 as uuid } from 'uuid';

import {
  BlockComponentProps,
  TextComponent,
  IndentationComponent,
  HandleComponent,
  FocusableComponent,
} from './components';

import styles from './components/index.module.scss';

export type SchemaType = {
  type: string;
  component?: React.FC;
  attrs?: {};
  action?: Function | null;
  create: Function;
};

type BaseBlock = {
  id: string;
  text: string | null;
  indent: number;
};

function createBaseBlock(block: Partial<BaseBlock> = {}): BaseBlock {
  const b = { ...block };
  if (b.text === null) {
    b.text = '';
  }
  if (b.attrs) {
    delete b.attrs;
  }

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

type ListBlock = BaseBlock & {
  type: 'list';
};

export const listSchema = {
  type: 'list',
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
        <span>L</span>
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
          <img src={props.block.attrs.src} />
        </FocusableComponent>
      </>
    );
  },
};

export type Block = ParagraphBlock | ListBlock | ImageBlock;

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
}
