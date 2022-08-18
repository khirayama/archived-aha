import * as React from 'react';
import Head from 'next/head';

import './reset.scss';
import './theme.scss';

import './lexical.scss';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
