import NextLink from 'next/link';
import { dsp } from './utils';

export function Link(props) {
  const p = dsp(props);
  return (
    <NextLink {...p}>
      <a {...p} />
    </NextLink>
  );
}
