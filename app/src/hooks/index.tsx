import { useState, useEffect } from 'react';
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

const db = getFirestore();

type PaperId = string;

type Async<T> = {
  data: T;
  isLoading: boolean;
  isError: Error;
};

type User = {
  uid: string;
  email: string;
  profile: {
    username: string;
  };
};

type Arrangement = {
  front: PaperId[];
  archived: PaperId[];
};

export function useUser(): Async<User> {
  const [user, setUser] = useState(null);
  const [err, setError] = useState(null);

  function fetchProfile() {
    const auth = getAuth();
    const u = auth.currentUser;
    setError(null);
    if (u) {
      getDoc(doc(db, 'profiles', u.uid))
        .then((res) => {
          const profile = res.data();
          setUser({
            uid: u.uid,
            email: u.email,
            profile,
          });
        })
        .catch((e) => {
          setError(e);
        });
    } else if ((auth as any) /* TODO */._isInitialized) {
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
    data: user,
    isLoading: !user && !err,
    isError: err,
  };
}

export function useArrangement(): Async<Arrangement> {
  const [arrangement, setArrangment] = useState(null);
  const [err, setError] = useState(null);
  const { data: user } = useUser();

  function fetchArrangement(u) {
    getDoc(doc(db, 'arrangements', u.uid))
      .then((res) => {
        const arrangement = res.data();
        setArrangment(arrangement);
      })
      .catch((e) => {
        setError(e);
      });
  }

  useEffect(() => {
    if (user) {
      fetchArrangement(user);
      const unsubscribe = onSnapshot(doc(db, 'arrangements', user.uid), () => {
        fetchArrangement(user);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  return {
    data: arrangement,
    isLoading: !arrangement && !err,
    isError: err,
  };
}
