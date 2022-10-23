import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

import { t } from '../i18n';
import { useUser } from '../hooks';
import { signUp, signIn, signOut } from '../usecases';
import { Box, FormControl, Input, Button, Text, Link, Heading } from '../design-system';

export default function IndexPage() {
  const router = useRouter();

  const { data: user, isError: isUserError } = useUser();

  const [username, setUsername] = useState('khirayama');
  const [email, setEmail] = useState('khirayama@example.com');
  const [password, setPassword] = useState('abcdefg');

  const onSignInFormSubmit = useCallback((event) => {
    event.preventDefault();
    signIn(email, password).then(() => {
      router.push('/app');
    });
  });
  const onUsernameChange = useCallback((event) => {
    setUsername(event.currentTarget.value);
  });
  const onEmailChange = useCallback((event) => {
    setEmail(event.currentTarget.value);
  });
  const onPasswordChange = useCallback((event) => {
    setEmail(event.currentTarget.value);
  });
  const onSignUpButtonClick = useCallback((event) => {
    signUp(email, password, username).then(() => {
      router.push('/app');
    });
  });

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
        <FormControl onSubmit={onSignInFormSubmit}>
          <Input name="username" value={username} onChange={onUsernameChange} />
          <Input name="email" value={email} onChange={onEmailChange} />
          <Input type="password" name="password" value={password} onChange={onPasswordChange} />
          <Button>{t('Button.SignIn')}</Button>
        </FormControl>
        <Button onClick={onSignUpButtonClick}>{t('Button.SignUp')}</Button>
      </Box>
    </Box>
  );
}
