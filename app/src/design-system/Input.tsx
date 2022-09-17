import { dsp } from './utils';

export function Input(props) {
  const p = dsp(props);
  return <input {...p} />;
}
