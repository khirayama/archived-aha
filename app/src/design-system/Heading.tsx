import { dsp } from './utils';

export function Heading(props) {
  const p = dsp(props);
  return <h1 {...p} />;
}
