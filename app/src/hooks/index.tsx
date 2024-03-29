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

type UserId = string;

type PaperId = string;

type Async<T> = {
  data: T;
  isLoading: boolean;
  isError: Error;
};

type Profile = {
  username: string;
};

type User = {
  uid: UserId;
  email: string;
  profile: Profile;
};

type Arrangement = {
  front: PaperId[];
  archived: PaperId[];
};

type Paper = {
  id: PaperId;
  tags: string[];
  blocks: any[] /* TODO */;
};

type Role = 'none' | 'read' | 'editor' | 'admin';

type Ownership = {
  uid: UserId;
  profile: Profile;
  role: Role;
};

type Access = {
  target: 'private' | 'limited' | 'public';
  role: Role;
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
    data: user || null,
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
    data: arrangement || null,
    isLoading: !arrangement && !err,
    isError: err,
  };
}

export function usePapers(paperIds: PaperId[]): Async<Paper[]> {
  const [papers, setPapers] = useState([]);
  const [err, setError] = useState(null);
  const { data: user } = useUser();

  const paperIdChunks: PaperId[][] = [];
  for (let i = 0; i < paperIds.length; i += 10) {
    const paperIdChunk = paperIds.concat().splice(i, 10, 0);
    paperIdChunks.push(paperIdChunk);
  }

  function fetchPapers(u) {
    Promise.all(
      paperIdChunks.map((paperIdChunk) => {
        return getDocs(query(collection(db, 'papers'), where(documentId(), 'in', paperIdChunk)));
      }),
    )
      .then((res) => {
        const ps = [];
        for (let i = 0; i < res.length; i += 1) {
          res[i].forEach((d) => {
            ps.push({ id: d.id, ...d.data() });
          });
        }
        setPapers(ps);
      })
      .catch((e) => {
        setError(e);
      });
  }

  useEffect(() => {
    if (user && paperIds?.length) {
      fetchPapers(user);

      const unsubscribes = paperIdChunks.map((paperIdChunk) => {
        return onSnapshot(query(collection(db, 'papers'), where(documentId(), 'in', paperIdChunk)), () => {
          fetchPapers(user);
        });
      });

      return () => {
        unsubscribes.forEach((unsubscribe) => {
          unsubscribe();
        });
      };
    }
  }, [user, paperIds]);

  return {
    data: papers || [],
    isLoading: !papers.length && !err,
    isError: err,
  };
}

export function useOwnership(paperId: PaperId): Async<Ownership> {
  const [ownership, setOwnership] = useState(null);
  const [err, setError] = useState(null);
  const { data: user } = useUser();

  function fetchOwnership() {
    getDoc(doc(db, 'ownerships', paperId))
      .then((res) => {
        const ownership = res.data();
        setOwnership(ownership);
      })
      .catch((e) => {
        setError(e);
      });
  }

  useEffect(() => {
    if (user && paperId) {
      fetchOwnership(paperId);
      const unsubscribe = onSnapshot(doc(db, 'ownerships', paperId), () => {
        fetchOwnership(paperId);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, paperId]);

  return {
    data: ownership || null,
    isLoading: !ownership && !err,
    isError: err,
  };
}

export function useAccess(paperId: PaperId): Async<Access> {
  const [access, setAccess] = useState(null);
  const [err, setError] = useState(null);

  const { data: user } = useUser();

  function fetchAccess() {
    getDoc(doc(db, 'accesses', paperId))
      .then((res) => {
        const access = res.data();
        setAccess(access);
      })
      .catch((e) => {
        setError(e);
      });
  }

  useEffect(() => {
    if (user && paperId) {
      fetchAccess(paperId);
      const unsubscribe = onSnapshot(doc(db, 'accesses', paperId), () => {
        fetchAccess(paperId);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user, paperId]);

  return {
    data: access || null,
    isLoading: !access && !err,
    isError: err,
  };
}
