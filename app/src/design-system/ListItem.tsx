import { dsp } from './utils';

export function ListItem(props) {
  const p = dsp(props);
  return <li {...p} />;
}
