import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, setDoc, addDoc } from 'firebase/firestore';

const db = getFirestore();

export function signOut(auth) {
  const auth = getAuth();
  auth.signOut();
}
