import { createElement, useCallback, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { v4 as uuid } from 'uuid';

/*
 * - Text
 *   - Heading
 *   - Paragraph
 *   - Todo
 *   - List
 * - Focusable
 *   - Image
 *   - Divider
 */
import styles from './simple.module.scss';

/*
 * Textは基本入力を受け付ける
 * Focusableは基本入力を受け付けない
 * commandsは副作用がある
 * traverseは探索のみ
 */

const transform = {
  after: (currentNode, targetNode) => {
    console.log('after');
  },
};

const commands = {
  focusHead: (nodeOrNodeId) => {
    console.log('focus head');
  },
  focusTail: (nodeOrNodeId) => {
    console.log('focus tail');
  },
};

const traverse = {
  prev: () => {
    console.log('prev');
  },
  next: () => {
    console.log('next');
  },
};

type Node = any;

type NodeProps = {
  schema: EditorSchema;
  state: EditorState;
  node: Node;
};

function Text(props: NodeProps) {
  const onKeyDown = useCallback((event) => {
    const key = event.key;
    console.log(key);
    if (key === 'Enter') {
      event.preventDefault();
      let nodeSchema = props.schema.getNodeSchema(props.node.type);
      if (typeof nodeSchema.attrs.text === 'undefined' || nodeSchema.continuation === false) {
        nodeSchema = props.schema.getNodeSchema('paragraph');
      }
      console.log(nodeSchema);
    }
  });

  const onInput = useCallback((event) => {
    const value = event.currentTarget.textContent;
    props.state.update(() => {
      const node = props.state.findNode(props.node.id);
      if (node) {
        node.attrs.text = value;
      }
    });
  });

  const onFocus = useCallback(() => {
    props.state.update(() => {
      props.state.selection = props.node.id;
    });
  });

  return (
    <div
      className={styles['text']}
      contentEditable
      onKeyDown={onKeyDown}
      onInput={onInput}
      onFocus={onFocus}
      dangerouslySetInnerHTML={{ __html: props.node.attrs.text }}
    />
  );
}

function Focusable(props: NodeProps) {
  const onKeyDown = useCallback((event) => {
    const key = event.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      // noop
    } else {
      event.preventDefault();
    }
    console.log('keydown on focusable');
  });

  const onFocus = useCallback(() => {
    props.state.update(() => {
      props.state.selection = props.node.id;
    });
  });

  return (
    <div
      className={styles['focusable']}
      contentEditable
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      dangerouslySetInnerHTML={{ __html: renderToString(props.children) }}
    />
  );
}

function Paragraph(props: NodeProps) {
  return <Text {...props} />;
}

function Image(props: NodeProps) {
  return (
    <Focusable {...props}>
      <img src={props.node.attrs.src} alt={props.node.attrs.alt} />
    </Focusable>
  );
}

function Editor(props: { schema: EditorSchema; state: EditorState }) {
  const schema = props.schema;
  const state = props.state;

  useEffect(() => {
    const onStateChange = () => {
      console.log(state);
    };
    state.addChangeListener(onStateChange);
    return () => {
      state.removeChangeListener(onStateChange);
    };
  });

  return state.nodes.map((node) => {
    const nodeSchema = props.schema.getNodeSchema(node.type);
    if (!nodeSchema) {
      return null;
    }
    return createElement(nodeSchema.component, { schema: props.schema, state: props.state, node, key: node.id });
  });
}

class EditorSchema {
  constructor(nodeSchemas) {
    this.nodeSchemas = nodeSchemas;
  }

  public create(nodeType, init?) {
    const nodeSchema = this.getNodeSchema(nodeType);

    if (!nodeSchema) {
      return null;
    }
    return {
      id: uuid(),
      ...nodeSchema.attrs,
      ...(init || {}),
    };
  }

  public getNodeSchema(nodeType) {
    return this.nodeSchemas[nodeType] || null;
  }
}

class EditorState {
  private listeners = [];

  constructor(state) {
    this.selection = state.selection;
    this.nodes = state.nodes;
  }

  public update(fn: Function) {
    fn();
    this.emit();
  }

  public addChangeListener(listener) {
    this.listeners.push(listener);
  }

  public removeChangeListener(listener) {
    this.listeners = this.listeners.filter((fn) => fn !== listener);
  }

  public findNode(nodeId: string) {
    return this.nodes.filter((node) => node.id === nodeId)[0] || null;
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export default function SimplePage() {
  const schema = new EditorSchema({
    paragraph: {
      component: Paragraph,
      attrs: {
        text: '',
        indent: 0,
      },
    },
    image: {
      component: Image,
      attrs: {
        src: '',
        indent: 0,
      },
    },
  });

  const nodes = [
    {
      id: uuid(),
      type: 'paragraph',
      attrs: {
        text: 'Hello',
        indent: 0,
      },
    },
    {
      id: uuid(),
      type: 'paragraph',
      attrs: {
        text: 'World',
        indent: 1,
      },
    },
    {
      id: uuid(),
      type: 'image',
      attrs: {
        src: 'https://placehold.jp/150x150.png',
        indent: 0,
      },
    },
    {
      id: uuid(),
      type: 'image',
      attrs: {
        src: 'https://placehold.jp/200x150.png',
        indent: 1,
      },
    },
  ];

  const state = new EditorState({
    nodes,
    selection: null,
  });

  return <Editor schema={schema} state={state} />;
}
