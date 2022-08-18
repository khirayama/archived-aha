import { createElement, useCallback, useEffect, useState } from 'react';
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

function Indent(props: NodeProps) {
  return <span style={{ paddingLeft: props.node.attrs.indent + 'rem' }} />;
}

function Text(props: NodeProps) {
  const onKeyDown = useCallback((event) => {
    const key = event.key;
    const meta = event.metaKey;
    const shift = event.shiftKey;
    if (key === 'Enter') {
      event.preventDefault();
      if (!meta) {
        let nodeSchema = props.schema.getNodeSchema(props.node.type);
        if (typeof nodeSchema.attrs.text === 'undefined' || nodeSchema.continuation === false) {
          nodeSchema = props.schema.getNodeSchema('paragraph');
        }
        const node = props.schema.createNode(nodeSchema.type, { indent: props.node.attrs.indent });
        props.state.update(() => {
          for (let i = 0; i < props.state.nodes.length; i += 1) {
            const n = props.state.nodes[i];
            console.log(props.state.selection, n.id, props.state.nodes);
            if (n.id === props.state.selection) {
              props.state.nodes.splice(i + 1, 0, node);
              console.log(props.state.nodes);
              break;
            }
          }
          props.state.selection = node.id;
        });
      } else if (meta) {
        console.log('take action');
      }
    } else if (key === 'Tab') {
      event.preventDefault();
      if (!shift) {
        props.state.update(() => {
          props.node.attrs.indent = Math.min(props.node.attrs.indent + 1, 8);
        });
      } else {
        props.state.update(() => {
          props.node.attrs.indent = Math.min(props.node.attrs.indent - 1, 0);
        });
      }
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
    <span
      data-nodeid={props.node.id}
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
    <span
      data-nodeid={props.node.id}
      className={styles['focusable']}
      contentEditable
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      dangerouslySetInnerHTML={{ __html: renderToString(props.children) }}
    />
  );
}

function Paragraph(props: NodeProps) {
  return (
    <p>
      <Indent {...props} />
      <Text {...props} />
    </p>
  );
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
  const [selection, setSelection] = useState(props.state.nodes);
  const [nodes, setNodes] = useState(props.state.nodes);

  useEffect(() => {
    const onStateChange = (prevState) => {
      console.log('change', prevState, props.state);
      setNodes(props.state.nodes);
      setSelection(props.state.selection);

      if (props.state.selection !== prevState.selection) {
        const query = `[data-nodeid="${props.state.selection}"]`;
        setTimeout(() => {
          const nodeEl = document.querySelector(`[data-nodeid="${props.state.selection}"]`);
          if (nodeEl) {
            nodeEl.focus();
          }
        }, 0);
      }
    };
    state.addChangeListener(onStateChange);
    return () => {
      state.removeChangeListener(onStateChange);
    };
  });

  console.log(nodes);
  return (
    <>
      {nodes.map((node) => {
        const nodeSchema = props.schema.getNodeSchema(node.type);
        if (!nodeSchema) {
          return null;
        }
        return createElement(nodeSchema.component, { schema: props.schema, state: props.state, node, key: node.id });
      })}
    </>
  );
}

class EditorSchema {
  constructor(nodeSchemas) {
    this.nodeSchemas = nodeSchemas;
  }

  public getNodeSchema(nodeType) {
    return this.nodeSchemas.filter((nodeSchema) => nodeSchema.type === nodeType)[0] || null;
  }

  public createNode(nodeType, init?) {
    const nodeSchema = this.getNodeSchema(nodeType);
    if (!nodeSchema) {
      return null;
    }
    return {
      id: uuid(),
      type: nodeType,
      attrs: {
        ...nodeSchema.attrs,
        ...(init || {}),
      },
    };
  }
}

class EditorState {
  private listeners = [];

  constructor(state) {
    this.selection = state.selection;
    this.nodes = state.nodes;
    this.prev = {
      selection: null,
      nodes: [],
    };
  }

  public update(fn: Function) {
    this.prev = {
      selection: this.selection,
      nodes: JSON.parse(JSON.stringify(this.nodes)),
    };
    fn();
    this.emit();
  }

  public addChangeListener(listener) {
    this.listeners.push(() => listener(this.prev));
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
  const schema = new EditorSchema([
    {
      type: 'paragraph',
      component: Paragraph,
      attrs: {
        text: '',
        indent: 0,
      },
    },
    {
      type: 'image',
      component: Image,
      attrs: {
        src: '',
        indent: 0,
      },
    },
  ]);

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
