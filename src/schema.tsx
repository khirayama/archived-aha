import { v4 as uuid } from 'uuid';

import { TextComponent } from './components';

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
  return {
    id: uuid(),
    text: '',
    indent: 0,
    ...block,
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
  component: (props) => {
    return <TextComponent block={props.block} onKeyDown={props.onTextKeyDown} onInput={props.onTextInput} />;
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
  component: (props) => {
    return (
      <div>
        <span>LIST </span>
        <TextComponent block={props.block} onKeyDown={props.onTextKeyDown} onInput={props.onTextInput} />
      </div>
    );
  },
};

export type Block = ParagraphBlock | ListBlock;

export class Schema {
  private schemas: SchemaType[];

  constructor(schemas: SchemaType[]) {
    this.schemas = schemas;
  }

  public createBlock(typ?: Block['type'], block: Partial<Block> = {}): Block {
    typ = typ || block.type || 'paragraph';
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
