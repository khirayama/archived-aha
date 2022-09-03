import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
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

import { extractTitle, schema, Editor } from '../components/Editor';

/* TODO
 * - [ ] paperのタグ削除
 * - [ ] paperの共有
 * - [ ] paperの公開
 * - [ ] paperの並び替え
 * - [ ] paperのアーカイブ
 * - [ ] paperの削除
 * - [x] paperの更新
 * - [x] paperの新規作成
 * - [x] paperのタグ付け
 */

const db = getFirestore();

type PaperId = string;

type User = {};

type Arrangement = {
  front: PaperId[];
  archived: PaperId[];
};

type Paper = {
  tags: string[];
  access: {
    target: 'private' | 'limited' | 'public';
    permission: 'write' | 'read';
  };
  blocks: string;
};

type Request = {
  member: User;
  status: 'pending' | 'accepted' | 'rejected';
  permission: 'write' | 'read' | 'admin';
};

type State = {
  user: User;
  arrangement: Arrangement;
  requests: Request[];
  papers: {
    [paperId: PaperId]: Paper;
  };
  currentPaperId: PaperId;
};

onSnapshot(collection(db, 'papers'), () => {
  console.log('update');
});

function fetchData(user) {
  return new Promise((resolve) => {
    Promise.all([getDoc(doc(db, 'profiles', user.uid)), getDoc(doc(db, 'arrangements', user.uid))]).then((res) => {
      const profile = res[0].data();
      const arrangement = res[1].data();
      onSnapshot(query(collection(db, 'papers'), where(documentId(), 'in', arrangement.front)), () => {
        console.log('update');
      });
      getDocs(query(collection(db, 'papers'), where(documentId(), 'in', arrangement.front))).then((res) => {
        const papers = {};
        res.forEach((d) => {
          console.log(d.data());
          papers[d.id] = d.data();
        });
        console.log(papers);
        resolve({ profile, arrangement, papers });
      });
    });
  });
}

const debounce = function (fn, interval = 0) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, interval);
  };
};

const debouncedSetBlocks = debounce((paperId, paper) => {
  setDoc(doc(db, 'papers', paperId), paper);
}, 600);

export default function AppPage() {
  const router = useRouter();
  const auth = getAuth();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [user, setUser] = React.useState(auth.currentUser);
  const [profile, setProfile] = React.useState(auth.currentUser);
  const [arrangement, setArrangement] = React.useState(null);
  const [currentPaperId, setCurrentPaperId] = React.useState(null);
  const [papers, setPapers] = React.useState({});
  const [tag, setTag] = React.useState('');

  function handleFirebaseError(err) {
    setErrorMessage(err.message);
  }

  const onBlocksChange = React.useCallback(
    (newBlocks) => {
      const newPaper = {
        ...papers[currentPaperId],
        blocks: newBlocks,
      };
      setPapers({
        ...papers,
        [currentPaperId]: newPaper,
      });
      debouncedSetBlocks(currentPaperId, newPaper);
    },
    [papers, currentPaperId],
  );

  React.useEffect(() => {
    if (user) {
      fetchData(user).then((res) => {
        setProfile(res.profile);
        setArrangement(res.arrangement);
        setCurrentPaperId(res.arrangement.front[0]);
        setPapers(res.papers);
      });
    }
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchData(u).then((res) => {
          console.log(res);
          setProfile(res.profile);
          setArrangement(res.arrangement);
          setCurrentPaperId(res.arrangement.front[0]);
          setPapers(res.papers);
        });
      } else {
        router.push('/');
      }
    });
  }, []);

  console.log(papers);
  return (
    <>
      <Head>
        <title>{papers[currentPaperId] ? extractTitle(papers[currentPaperId].blocks) : 'aha'}</title>
      </Head>
      <div>
        <p>{errorMessage}</p>
        <p>{user?.email}</p>
        <p>{user?.uid}</p>
        <p>{profile?.username}</p>
        <button
          onClick={() => {
            auth.signOut();
          }}
        >
          SIGN OUT
        </button>
        <button
          onClick={() => {
            deleteUser(user)
              .then(() => {
                console.log('deleted');
              })
              .catch(handleFirebaseError);
          }}
        >
          DELETE ACCOUNT
        </button>
        <button
          onClick={() => {
            addDoc(collection(db, 'papers'), {
              uid: user.uid,
              tags: [],
              blocks: [schema.createBlock('heading', { text: '', attrs: { level: 1 } })],
            })
              .then((paperRef) => {
                const front = arrangement.front.concat();
                front.push(paperRef.id);
                Promise.all([
                  setDoc(doc(db, 'arrangements', user.uid), {
                    ...arrangement,
                    front,
                  }),
                  setDoc(doc(db, 'ownerships', paperRef.id), { [user.uid]: 'admin' }),
                  setDoc(doc(db, 'accesses', paperRef.id), {
                    target: 'private',
                    role: 'none',
                  }),
                ])
                  .then(() => {
                    fetchData(user).then((res) => {
                      setArrangement(res.arrangement);
                      setPapers(res.papers);
                    });
                  })
                  .catch(handleFirebaseError);
              })
              .catch(handleFirebaseError);
          }}
        >
          CREATE NEW PAPER
        </button>
        <ul>
          {arrangement
            ? arrangement.front.map((paperId) => {
                return (
                  <li
                    key={paperId}
                    onClick={() => {
                      setCurrentPaperId(paperId);
                    }}
                  >
                    <div>{papers[paperId] ? extractTitle(papers[paperId].blocks) || paperId : null}</div>
                  </li>
                );
              })
            : null}
        </ul>
        {currentPaperId && papers[currentPaperId] ? (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const t = tag.trim();
                const newTags = papers[currentPaperId].tags.concat();
                if (t && newTags.indexOf(t) === -1) {
                  newTags.push(t);
                  const newPaper = {
                    ...papers[currentPaperId],
                    tags: newTags,
                  };
                  setDoc(doc(db, 'papers', currentPaperId), newPaper);
                  setPapers({
                    ...papers,
                    [currentPaperId]: newPaper,
                  });
                  setTag('');
                }
              }}
            >
              <input type="text" value={tag} onChange={(event) => setTag(event.currentTarget.value.trim())} />
              <button>CREATE TAG</button>
            </form>
            <ul>
              {papers[currentPaperId].tags.map((tag) => {
                return (
                  <li
                    key={tag}
                    onClick={() => {
                      const newTags = papers[currentPaperId].tags.filter((t) => t !== tag);
                      const newPaper = {
                        ...papers[currentPaperId],
                        tags: newTags,
                      };
                      setDoc(doc(db, 'papers', currentPaperId), newPaper);
                      setPapers({
                        ...papers,
                        [currentPaperId]: newPaper,
                      });
                    }}
                  >
                    #{tag}
                  </li>
                );
              })}
            </ul>
            <Editor key={currentPaperId} blocks={papers[currentPaperId].blocks} onChange={onBlocksChange} />
          </>
        ) : null}
      </div>
    </>
  );
}
