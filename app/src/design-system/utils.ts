const theme = {
  space: 4,
};

function mapStyle(props, style, propsKeys: string[], mappedKeys: string[], fn?: Function) {
  for (let i = 0; i < propsKeys.length; i += 1) {
    const propsKey = propsKeys[i];
    const v = props[propsKey];
    if (v !== undefined) {
      for (let j = 0; j < mappedKeys.length; j += 1) {
        const mappedKey = mappedKeys[j];
        style[mappedKey] = fn ? fn(v) : v;
      }
      delete props[propsKey];
    }
  }
}

function s2p(v) {
  return theme.space * v + 'px';
}

function designSysytemProps(props: {
  /* padding */
  p?: number;
  padding?: number;
  pt?: number;
  paddingTop?: number;
  pb?: number;
  paddingBottom?: number;
  pl?: number;
  paddingLeft?: number;
  pr?: number;
  paddingRight?: number;
  px?: number;
  paddingX?: number;
  py?: number;
  paddingY?: number;
  ps?: number;
  paddingStart?: number;
  pe?: number;
  paddingEnd?: number;
  /* flex */
  flex?: number;
  /* width */
  w?: string;
  width?: string;
}) {
  const newProps = { ...props };

  const style = {};
  /* padding */
  mapStyle(newProps, style, ['p', 'padding'], ['padding'], s2p);
  mapStyle(newProps, style, ['pt', 'paddingTop'], ['paddingTop'], s2p);
  mapStyle(newProps, style, ['pb', 'paddingBottom'], ['paddingBottom'], s2p);
  mapStyle(newProps, style, ['pl', 'paddingLeft'], ['paddingLeft'], s2p);
  mapStyle(newProps, style, ['pr', 'paddingRight'], ['paddingRight'], s2p);
  mapStyle(newProps, style, ['px', 'paddingX'], ['paddingLeft', 'paddingRight'], s2p);
  mapStyle(newProps, style, ['py', 'paddingY'], ['paddingTop', 'paddingBottom'], s2p);
  mapStyle(newProps, style, ['ps', 'paddingStart'], ['paddingInlineStart'], s2p);
  mapStyle(newProps, style, ['pe', 'paddingEnd'], ['paddingInlineEnd'], s2p);
  /* flex */
  mapStyle(newProps, style, ['flex'], ['flex']);
  /* width */
  mapStyle(newProps, style, ['w', 'width'], ['width']);

  newProps.style = { ...newProps.style, ...style };
  return newProps;
}

export const dsp = designSysytemProps;
