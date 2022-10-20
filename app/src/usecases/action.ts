import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

import { schema } from '../components/Editor';
import { debounce } from '../utils';

const db = getFirestore();

export function createPaper() {
  return new Promise((resolve) => {
    const auth = getAuth();

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;

      Promise.all([
        getDoc(doc(db, 'arrangements', uid)),
        addDoc(collection(db, 'papers'), {
          uid,
          tags: [],
          blocks: [schema.createBlock('heading', { text: '', attrs: { level: 1 } })],
        }),
      ])
        .then((res) => {
          const arrangement = res[0].data();
          const paperRef = res[1];

          const front = arrangement.front.concat();
          front.push(paperRef.id);

          Promise.all([
            setDoc(doc(db, 'arrangements', uid), {
              ...arrangement,
              front,
            }),
            setDoc(doc(db, 'ownerships', paperRef.id), { [uid]: 'admin' }),
          ]);
        })
        .then(resolve);
    }
  });
}

export function updatePaper(paper) {
  setDoc(doc(db, 'papers', paper.id), paper);
}

export const debouncedUpdatePaper = debounce((paper) => {
  updatePaper(paper);
}, 600);

export function updateArrangement(arrangement) {
  const auth = getAuth();

  if (auth.currentUser) {
    const uid = auth.currentUser.uid;
    /* TODO Check and delete papers */
    setDoc(doc(db, 'arrangements', uid), arrangement);
  }
}

export function createAccess(paperId) {
  return new Promise((resolve) => {
    const auth = getAuth();

    if (auth.currentUser) {
      setDoc(doc(db, 'accesses', paperId), {
        editable: false,
        ahaindexable: false,
        webindexable: false,
      });
    }
  });
}

export function deleteAccess(paperId) {
  return new Promise((resolve) => {
    const auth = getAuth();

    if (auth.currentUser) {
      deleteDoc(doc(db, 'accesses', paperId));
    }
  });
}
