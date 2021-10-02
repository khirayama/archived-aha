import * as React from 'react';

import './reset.scss';
import './theme.scss';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}
