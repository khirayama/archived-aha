import { v4 as uuid } from 'uuid';

import { Text } from './components';

type SchemaType = any;

type BaseBlock = {
  id: string;
  text: string | null;
  indent: number;
};

function createBaseBlock(block: Partial<BaseBlock> = {}): Required<BaseBlock> {
  return {
    id: uuid(),
    text: '',
    indent: 0,
    ...block,
  };
}

function createSchema<T>(
  schema: { type: string; component?: React.Component; attrs?: {}; action?: Function | null } = {
    type: '',
    component: null,
    attrs: {},
    action: null,
  },
) {
  return {
    create: (block: Partial<T> = {}): Required<T> => {
      return {
        ...createBaseBlock(block),
        type: schema.type,
      };
    },
    component: (props) => {
      return <Text block={props.block} onKeyDown={props.onTextKeyDown} onInput={props.onTextInput} />;
    },
    ...schema,
  };
}

type ParagraphBlock = BaseBlock & {
  type: 'paragraph';
};

export const paragraphSchema = createSchema<ParagraphBlock>({
  type: 'paragraph',
  component: (props) => {
    return <Text block={props.block} onKeyDown={props.onTextKeyDown} onInput={props.onTextInput} />;
  },
});

type ListBlock = BaseBlock & {
  type: 'list';
};

export const listSchema = createSchema<ListBlock>({
  type: 'list',
  component: (props) => {
    return (
      <div>
        <span>LIST </span>
        <Text block={props.block} onKeyDown={props.onTextKeyDown} onInput={props.onTextInput} />
      </div>
    );
  },
});

type Block = ParagraphBlock | ListBlock;

export class Schema {
  constructor(schemas: SchemaType[]) {
    this.schemas = schemas;
  }

  public createBlock(typ: Block['type'], block: Partial<Block> = {}): Required<Block> {
    typ = typ || block.type || 'paragraph';
    const schema = this.find(typ) || this.schemas[0];

    return schema.create(block);
  }

  public find(typ: Block['type']) {
    return this.schemas.filter((s) => s.type == typ)[0] || null;
  }
}
