import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { schema } from '../../libs/editor/schema';
import { t } from '../i18n';
import { Box, FormControl, Input, Button, Text, Link, Heading } from '../design-system';
import { useUser } from '../hooks';
import { signUp, signIn, signOut } from '../usecases';

export default function IndexPage() {
  const router = useRouter();
  const { data: user, isError: isUserError } = useUser();

  const [username, setUsername] = useState('khirayama');
  const [email, setEmail] = useState('khirayama@example.com');
  const [password, setPassword] = useState('abcdefg');

  return (
    <Box p={4}>
      <Heading>aha</Heading>
      {user ? (
        <Text>
          {t('Page.index.AlreadySignedIn.0')}
          <Link href="/app">{t('Page.index.LinkToAppPage')}</Link>
          {t('Page.index.AlreadySignedIn.1')}
          <Button onClick={signOut}>{t('Button.SignOut')}</Button>
          {t('Page.index.AlreadySignedIn.2')}
        </Text>
      ) : null}
      <Box>
        <FormControl
          onSubmit={(event) => {
            event.preventDefault();
            signIn(email, password).then(() => {
              router.push('/app');
            });
          }}
        >
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
          />
          <Input type="text" name="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Button>{t('Button.SignIn')}</Button>
        </FormControl>
        <Button
          onClick={() => {
            signUp().then(() => {
              router.push('/app');
            });
          }}
        >
          {t('Button.SignUp')}
        </Button>
      </Box>
    </Box>
  );
}
