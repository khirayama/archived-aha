import * as React from 'react';
import { v4 as uuid } from 'uuid';

import { BlocksComponent } from '../components';
import { Schema, paragraphSchema, listSchema } from '../schema';

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
      <BlocksComponent schema={schema} blocks={props.blocks} />
    </div>
  );
}
