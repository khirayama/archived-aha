import { dsp } from './utils';

export function Button(props) {
  const p = dsp(props);
  return <button {...p} />;
}
