import * as React from 'react';

import { BlockComponentProps } from './Block';

import styles from './index.module.scss';

export class TextComponent extends React.Component<BlockComponentProps> {
  private ref: React.RefObject<HTMLSpanElement>;

  constructor(props: BlockComponentProps) {
    super(props);
    this.ref = React.createRef<HTMLSpanElement>();
  }

  public componentDidMount() {
    const el = this.ref.current;
    if (el.childNodes.length === 0) {
      const textNode = document.createTextNode('');
      el.appendChild(textNode);
    }
  }

  public shouldComponentUpdate(nextProps: BlockComponentProps) {
    this.manualDiffPatch(nextProps);
    return false;
  }

  private manualDiffPatch(nextProps: BlockComponentProps) {
    const el = this.ref.current;
    const block = {
      id: el.parentElement.dataset.blockid,
      text: el.innerText,
    };
    const nextBlock = nextProps.block;

    /* block.text */
    if (nextBlock.text !== block.text) {
      el.innerText = nextBlock.text;
    }
  }

  public render() {
    const block = this.props.block;

    return (
      <span
        ref={this.ref}
        contentEditable
        className={styles['text']}
        dangerouslySetInnerHTML={{ __html: block.text }}
        onKeyDown={(e) => this.props.onTextKeyDown(e, this.props)}
        onInput={(e) => this.props.onTextInput(e, this.props)}
      />
    );
  }
}
