import { dsp } from './utils';

export function Box(props) {
  const p = dsp(props);
  return <div {...p} />;
}
