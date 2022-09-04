import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  addDoc,
  getDocs,
  getDoc,
  documentId,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const db = getFirestore();

export function useUser(): User {
  const [user, setUser] = useState(null);
  const [err, setError] = useState(null);

  function fetchProfile() {
    const auth = getAuth();
    const u = auth.currentUser;
    setError(null);
    if (u) {
      getDoc(doc(db, 'profiles', u.uid)).then((res) => {
        const profile = res.data();
        setUser({
          email: u.email,
          profile,
        });
      });
    } else if (auth._isInitialized) {
      setUser(null);
      setError(new Error('Not logged in'));
    }
  }

  useEffect(() => {
    fetchProfile();
    const unsubscribe = onAuthStateChanged(getAuth(), (u) => {
      fetchProfile();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading: !user && !err,
    isError: err,
  };
}
