import * as React from 'react';
import { v4 as uuid } from 'uuid';

import { Blocks, Text } from './components';
import { Schema, paragraphSchema, listSchema } from './schema';

const schema = new Schema([paragraphSchema, listSchema]);

export function getServerSideProps() {
  return {
    props: {
      blocks: [schema.createBlock()],
    },
  };
}

export default function ProtoPage(props) {
  return (
    <div>
      <Blocks schema={schema} blocks={props.blocks} />
    </div>
  );
}
