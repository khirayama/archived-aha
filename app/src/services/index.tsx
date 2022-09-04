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

/* [はじめに – SWR](https://swr.vercel.app/ja/docs/getting-started) */
function useUser(id) {
  const { data, error } = useSWR(`/api/user/${id}`, fetcher);

  return {
    user: data,
    isLoading: !error && !data,
    isError: error,
  };
}

type User = {
  email: string;
  profile: {
    username: string;
  };
};

function useUser(): User {
  const [user, setUser] = useState(null);

  const auth = getAuth();
  if (auth) {
    getDoc(doc(db, 'profiles', auth.currentUser.uid)).then((res) => {
      const profile = res.data();
      setUser({
        email: auth.currentUser.email,
        profile,
      });
    });
  }

  onAuthStateChanged(auth, (u) => {
    const auth = getAuth();
    if (auth) {
      getDoc(doc(db, 'profiles', auth.currentUser.uid)).then((res) => {
        const profile = res.data();
        setUser({
          email: auth.currentUser.email,
          profile,
        });
      });
    }
  });

  return user;
}
