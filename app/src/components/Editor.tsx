import * as React from 'react';

import {
  PaperComponent,
  FloatingNavComponent,
  CommandButtonComponent,
  IconComponent,
} from '../../libs/editor/components';
import { EditorState } from '../../libs/editor/EditorState';
import { schema, paragraphSchema, headingSchema, listSchema, todoSchema, imageSchema } from '../../libs/editor/schema';
export { schema, extractTitle } from '../../libs/editor/schema';

export class Editor extends React.Component {
  private editorState: EditorState;

  constructor(props) {
    super(props);
    const blocks = props.blocks;
    if (!blocks.length) {
      blocks.push(schema.createBlock('heading', { text: 'TITLE', attrs: { level: 1 } }));
    }
    this.editorState = new EditorState(blocks);
  }

  public componentDidMount() {
    this.editorState.onChange(() => {
      this.props.onChange(this.editorState.blocks);
    });
  }

  public render() {
    return <PaperComponent schema={schema} state={this.editorState} />;
  }
}
