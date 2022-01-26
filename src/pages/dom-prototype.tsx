import { v4 as uuid } from 'uuid';
import * as React from 'react';
import Head from 'next/head';

import { Paper } from '../dom-prototype/model';
import { Schema, Block, paragraphSchema } from '../dom-prototype/schema';
import { PaperView } from '../dom-prototype/view';

import styles from './dom-prototype.module.scss';

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

type PaperViewContainerProps = {
  schema: Schema;
  paper: Paper;
};

type PaperViewContainerState = {
  blocks: Block[];
};

class PaperViewContainer extends React.Component<PaperViewContainerProps, PaperViewContainerState> {
  public state: PaperViewContainerState = {
    blocks: [],
  };

  private ref: React.RefObject<HTMLDivElement>;

  constructor(props: PaperViewContainerProps) {
    super(props);

    this.ref = React.createRef<HTMLDivElement>();
  }

  public componentDidMount() {
    new PaperView(this.ref.current, { paper: this.props.paper, schema: this.props.schema });
  }

  public render() {
    return <div ref={this.ref} />;
  }
}

export default function PrototypePage(props) {
  paper.setBlocks(props.blocks);
  return (
    <>
      <Head>
        <title>DOM Prototype</title>
      </Head>
      <PaperViewContainer schema={schema} paper={paper} />
    </>
  );
}
