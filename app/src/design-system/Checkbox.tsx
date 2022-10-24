import { dsp } from './utils';

export function Checkbox(props) {
  const p = dsp(props);
  const children = p.children;
  delete p.children;

  return (
    <label>
      <input type="checkbox" {...p} value={p.isChecked} />
      {children}
    </label>
  );
}
