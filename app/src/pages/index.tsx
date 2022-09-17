import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, setDoc, addDoc } from 'firebase/firestore';

import { schema } from '../../libs/editor/schema';

import { t } from '../i18n';
import { Box, FormControl, Input, Button, Text, Link, Heading } from '../design-system';

const db = getFirestore();

export default function IndexPage() {
  const router = useRouter();
  const auth = getAuth();
  const [username, setUsername] = useState('khirayama');
  const [email, setEmail] = useState('khirayama@example.com');
  const [password, setPassword] = useState('abcdefg');
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => {
      off();
    };
  }, [user]);

  return (
    <Box p={4}>
      <Heading>aha</Heading>
      {user ? (
        <Text>
          {t('Page.index.AlreadySignedIn.0')}
          <Link href="/app">{t('Page.index.LinkToAppPage')}</Link>
          {t('Page.index.AlreadySignedIn.1')}
          <Button onClick={() => auth.signOut()}>{t('Button.SignOut')}</Button>
          {t('Page.index.AlreadySignedIn.2')}
        </Text>
      ) : null}
      <Box>
        <FormControl
          onSubmit={(event) => {
            event.preventDefault();
            signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
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
            createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
              const u = userCredential.user;
              setDoc(doc(db, 'profiles', u.uid), { username });
              addDoc(collection(db, 'papers'), {
                uid: user.uid,
                tags: [],
                blocks: [schema.createBlock('heading', { text: '', attrs: { level: 1 } })],
              }).then((paperRef) => {
                Promise.all([
                  setDoc(doc(db, 'arrangements', u.uid), {
                    front: [paperRef.id],
                    archived: [],
                  }),
                  setDoc(doc(db, 'ownerships', paperRef.id), { [u.uid]: 'admin' }),
                ]).then(() => {
                  router.push('/app');
                });
              });
            });
          }}
        >
          {t('Button.SignUp')}
        </Button>
      </Box>
    </Box>
  );
}
