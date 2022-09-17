import { dsp } from './utils';

export function FormControl(props) {
  const p = dsp(props);
  return <form {...p} />;
}
