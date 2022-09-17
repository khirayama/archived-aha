const theme = {
  space: 4,
};

function mapStyle(props, style, propsKeys: string[], mappedKeys: string[], unit: string = 'px') {
  for (let i = 0; i < propsKeys.length; i += 1) {
    const propsKey = propsKeys[i];
    if (props[propsKey] !== undefined) {
      for (let j = 0; j < mappedKeys.length; j += 1) {
        const mappedKey = mappedKeys[j];
        style[mappedKey] = theme.space * props[propsKey] + unit;
      }
      delete props[propsKey];
    }
  }
}

export function dsp(props: {
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
}) {
  const newProps = { ...props };

  const style = {};
  /* padding */
  mapStyle(newProps, style, ['p', 'padding'], ['padding']);
  mapStyle(newProps, style, ['pt', 'paddingTop'], ['paddingTop']);
  mapStyle(newProps, style, ['pb', 'paddingBottom'], ['paddingBottom']);
  mapStyle(newProps, style, ['pl', 'paddingLeft'], ['paddingLeft']);
  mapStyle(newProps, style, ['pr', 'paddingRight'], ['paddingRight']);
  mapStyle(newProps, style, ['px', 'paddingX'], ['paddingLeft', 'paddingRight']);
  mapStyle(newProps, style, ['py', 'paddingY'], ['paddingTop', 'paddingBottom']);
  mapStyle(newProps, style, ['ps', 'paddingStart'], ['paddingInlineStart']);
  mapStyle(newProps, style, ['pe', 'paddingEnd'], ['paddingInlineEnd']);

  newProps.style = { ...newProps.style, ...style };
  return newProps;
}
