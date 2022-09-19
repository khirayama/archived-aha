import { dsp } from './utils';

export function List(props) {
  const p = dsp(props);
  return <ul {...p} />;
}
