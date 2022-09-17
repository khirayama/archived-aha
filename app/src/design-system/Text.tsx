import { dsp } from './utils';

export function Text(props) {
  const p = dsp(props);
  return <p {...p} />;
}
