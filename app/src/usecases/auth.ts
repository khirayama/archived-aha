import {
  getAuth,
  deleteUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, doc, collection, setDoc, addDoc } from 'firebase/firestore';

const db = getFirestore();

export function signUp(email: string, password: string, username: string) {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth) {
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
            resolve();
          });
        });
      });
    }
  });
}

export function signIn(email: string, password: string) {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth) {
      signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
        resolve();
      });
    }
  });
}

export function signOut() {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth) {
      auth.signOut().then(resolve);
    }
  });
}

export function deleteAccount() {
  return new Promise((resolve) => {
    /* TODO Delete profiles, arrangements, ownerships, papers, and accesses */
    const auth = getAuth();
    if (auth) {
      deleteUser(auth.currentUser).then(resolve);
    }
  });
}
