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
} from 'firebase/firestore';

import { extractTitle, schema, Editor } from '../components/Editor';
import { useUser, useArrangement, usePapers, useOwnership, useAccess } from '../hooks';
import { Button } from '../design-system';

const db = getFirestore();

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

  const { data: user, isError: isUserError } = useUser();
  const { data: arrangement, isError: isArrangementError } = useArrangement();
  const { data: papers, isError: isPapersError } = usePapers(arrangement?.front);
  const { data: ownership, isError: isOwnershipError } = useOwnership(arrangement?.front[0]);
  const { data: access, isError: isAccessError } = useAccess(arrangement?.front[0]);

  const [errorMessage, setErrorMessage] = React.useState('');
  const [currentPaperId, setCurrentPaperId] = React.useState(null);
  const [tag, setTag] = React.useState('');
  const [paperSnapshot, setPaperSnapshot] = React.useState(null);

  if (isUserError) {
    /* TODO: display sign in form modal would be better */
    router.push('/');
  }

  React.useEffect(() => {
    if (arrangement?.front.length && paperSnapshot == null) {
      const p = papers.filter((p) => p.id === arrangement.front[0])[0];
      setPaperSnapshot(p);
    }
  }, [arrangement, papers, paperSnapshot]);

  React.useEffect(() => {
    if (paperSnapshot) {
      const p = papers.filter((p) => p.id === paperSnapshot.id)[0];
      setPaperSnapshot(p);
    }
  }, [papers, paperSnapshot]);

  function handleFirebaseError(err) {
    setErrorMessage(err.message);
  }

  const onBlocksChange = React.useCallback(
    (newBlocks) => {
      const newPaper = {
        ...paperSnapshot,
        blocks: newBlocks,
      };
      debouncedSetBlocks(newPaper.id, newPaper);
    },
    [papers, paperSnapshot],
  );

  return (
    <>
      <Head>
        <title>{paperSnapshot ? extractTitle(paperSnapshot.blocks) : 'aha'}</title>
      </Head>
      <div>
        <p>{errorMessage}</p>
        <p>{user?.email}</p>
        <p>{user?.uid}</p>
        <p>{user?.profile?.username}</p>
        <div>
          <Button
            onClick={() => {
              auth.signOut();
            }}
          >
            SIGN OUT
          </Button>
        </div>
        <div>
          <Button
            onClick={() => {
              deleteUser(user)
                .then(() => {
                  console.log('deleted');
                })
                .catch(handleFirebaseError);
            }}
          >
            DELETE ACCOUNT
          </Button>
        </div>
        <div>
          <Button
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
                  ]).catch(handleFirebaseError);
                })
                .catch(handleFirebaseError);
            }}
          >
            CREATE NEW PAPER
          </Button>
        </div>
        <ul>
          {arrangement
            ? arrangement.front.map((paperId) => {
                const p = papers.filter((p) => p.id === paperId)[0];
                return (
                  <li
                    key={paperId}
                    onClick={() => {
                      setPaperSnapshot(p || null);
                    }}
                  >
                    <div>{p ? extractTitle(p.blocks) || paperId : null}</div>
                  </li>
                );
              })
            : null}
        </ul>
        {paperSnapshot ? (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const t = tag.trim();
                const newTags = paperSnapshot.tags.concat();
                if (t && newTags.indexOf(t) === -1) {
                  newTags.push(t);
                  const newPaper = {
                    ...paperSnapshot,
                    tags: newTags,
                  };
                  setDoc(doc(db, 'papers', paperSnapshot.id), newPaper);
                  setTag('');
                }
              }}
            >
              <input type="text" value={tag} onChange={(event) => setTag(event.currentTarget.value.trim())} />
              <Button>CREATE TAG</Button>
            </form>
            <ul>
              {paperSnapshot.tags.map((tag) => {
                return (
                  <li
                    key={tag}
                    onClick={() => {
                      const newTags = paperSnapshot.tags.filter((t) => t !== tag);
                      const newPaper = {
                        ...paperSnapshot,
                        tags: newTags,
                      };
                      setDoc(doc(db, 'papers', paperSnapshot.id), newPaper);
                    }}
                  >
                    #{tag}
                  </li>
                );
              })}
            </ul>
            <Editor key={paperSnapshot.id} blocks={paperSnapshot.blocks} onChange={onBlocksChange} />
          </>
        ) : null}
      </div>
    </>
  );
}
