import * as React from 'react';

import {
  PaperComponent,
  FloatingNavComponent,
  CommandButtonComponent,
  IconComponent,
} from '../../libs/editor/components';
import { EditorSchema } from '../../libs/editor/EditorSchema';
import { paragraphSchema, headingSchema, listSchema, todoSchema, imageSchema } from '../../libs/editor/schema';
import { EditorState } from '../../libs/editor/EditorState';
import { commands } from '../../libs/editor/commands';

import styles from './index.module.scss';

export function getServerSideProps() {
  return {
    props: {
      blocks: [
        schema.createBlock('heading', { text: 'TITLE OF THIS PAPER', attrs: { level: 1 } }),
        schema.createBlock('todo', { text: 'タスク1' }),
        schema.createBlock('todo', { text: 'タスク2', attrs: { done: true } }),
        schema.createBlock('paragraph', { text: '𠮷野屋で𩸽頼んで𠮟られる😭' }),
        schema.createBlock('heading', { text: '000', attrs: { level: 2 } }),
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
        schema.createBlock('image', { attrs: { src: 'https://placehold.jp/256x256.png' } }),
        schema.createBlock('paragraph', { text: '121212' }),
      ],
    },
  };
}

const schema = new EditorSchema([paragraphSchema, headingSchema, listSchema, todoSchema, imageSchema]);
const state = new EditorState();

export default function ProtoPage(props) {
  state.setBlocks(props.blocks);

  return (
    <div className={styles['container']}>
      <PaperComponent schema={schema} state={state} />
      <FloatingNavComponent>
        <CommandButtonComponent
          schema={schema}
          state={state}
          onClick={(event, block) => {
            commands.outdent({
              block,
              schema,
              state,
            });
            state.commit();
          }}
        >
          <IconComponent name="format_indent_decrease" />
        </CommandButtonComponent>
        <CommandButtonComponent
          schema={schema}
          state={state}
          onClick={(event, block) => {
            commands.indent({
              block,
              schema,
              state,
            });
            state.commit();
          }}
        >
          <IconComponent name="format_indent_increase" />
        </CommandButtonComponent>
      </FloatingNavComponent>
    </div>
  );
}
