import * as React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, setDoc, addDoc } from 'firebase/firestore';

import { schema } from '../../libs/editor/schema';

const db = getFirestore();

export default function IndexPage() {
  const router = useRouter();
  const auth = getAuth();
  const [username, setUsername] = React.useState('khirayama');
  const [email, setEmail] = React.useState('khirayama@example.com');
  const [password, setPassword] = React.useState('abcdefg');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [user, setUser] = React.useState(auth.currentUser);

  function handleFirebaseError(err) {
    setErrorMessage(err.message);
    throw err;
  }

  React.useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => {
      off();
    };
  }, [user]);

  return (
    <div>
      <p>{errorMessage}</p>
      {user ? (
        <p>
          You are already signed in. Move to <Link href="/app">App page</Link> or{' '}
          <button onClick={() => auth.signOut()}>Sign out</button>.
        </p>
      ) : null}
      <div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signInWithEmailAndPassword(auth, email, password)
              .then((userCredential) => {
                router.push('/app');
                setErrorMessage('');
              })
              .catch(handleFirebaseError);
          }}
        >
          <input
            type="text"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
          />
          <input type="text" name="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <button>SUBMIT</button>
        </form>
        <button
          onClick={() => {
            createUserWithEmailAndPassword(auth, email, password)
              .then((userCredential) => {
                const u = userCredential.user;
                setErrorMessage('');
                setDoc(doc(db, 'profiles', u.uid), { username });
                addDoc(collection(db, 'papers'), {
                  uid: user.uid,
                  tags: [],
                  blocks: [schema.createBlock('heading', { text: '', attrs: { level: 1 } })],
                })
                  .then((paperRef) => {
                    Promise.all([
                      setDoc(doc(db, 'arrangements', u.uid), {
                        front: [paperRef.id],
                        archived: [],
                      }),
                      setDoc(doc(db, 'ownerships', paperRef.id), { [u.uid]: 'admin' }),
                    ])
                      .then(() => {
                        router.push('/app');
                      })
                      .catch(handleFirebaseError);
                  })
                  .catch(handleFirebaseError);
              })
              .catch(handleFirebaseError);
          }}
        >
          SIGN UP
        </button>
      </div>
    </div>
  );
}
