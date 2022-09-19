import { dsp } from './utils';

export function Flex(props) {
  const p = dsp(props);
  p.style.display = 'flex';
  return <div {...p} />;
}
