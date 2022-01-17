import * as React from 'react';

import { PaperComponent, FloatingNavComponent, CommandButtonComponent, IconComponent } from '../components';
import { Schema, paragraphSchema, headingSchema, listSchema, todoSchema, imageSchema } from '../schema';
import { Paper } from '../model';
import { commands } from '../commands';

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

const schema = new Schema([paragraphSchema, headingSchema, listSchema, todoSchema, imageSchema]);
const paper = new Paper();

export default function ProtoPage(props) {
  paper.setBlocks(props.blocks);

  return (
    <div className={styles['container']}>
      <PaperComponent schema={schema} paper={paper} />
      <FloatingNavComponent>
        <CommandButtonComponent
          schema={schema}
          paper={paper}
          onClick={(event, block) => {
            commands.indent({
              block,
              schema,
              paper,
              sel: window.getSelection(),
            });
            paper.commit();
          }}
        >
          <IconComponent name="format_indent_increase" />
        </CommandButtonComponent>
        <CommandButtonComponent
          schema={schema}
          paper={paper}
          onClick={(event, block) => {
            commands.outdent({
              block,
              schema,
              paper,
              sel: window.getSelection(),
            });
            paper.commit();
          }}
        >
          <IconComponent name="format_indent_decrease" />
        </CommandButtonComponent>
      </FloatingNavComponent>
    </div>
  );
}
