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
import { debounce } from '../utils';
import { Box, Flex, FormControl, Button, Text, List, ListItem } from '../design-system';

const db = getFirestore();

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
      <Flex>
        <Box w="240px" p={4}>
          <Text>{user?.profile?.username}</Text>
          <Text>{user?.email}</Text>
          <Box>
            <Button
              onClick={() => {
                addDoc(collection(db, 'papers'), {
                  uid: user.uid,
                  tags: [],
                  blocks: [schema.createBlock('heading', { text: '', attrs: { level: 1 } })],
                }).then((paperRef) => {
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
                  ]);
                });
              }}
            >
              CREATE NEW PAPER
            </Button>
          </Box>
          <List>
            {arrangement
              ? arrangement.front.map((paperId) => {
                  const p = papers.filter((p) => p.id === paperId)[0];
                  return (
                    <ListItem
                      key={paperId}
                      onClick={() => {
                        setPaperSnapshot(p || null);
                      }}
                    >
                      <Box>{p ? extractTitle(p.blocks) || paperId : null}</Box>
                    </ListItem>
                  );
                })
              : null}
          </List>
          <Box>
            <Box>
              <Button
                onClick={() => {
                  auth.signOut();
                }}
              >
                SIGN OUT
              </Button>
            </Box>
            <Box>
              <Button
                onClick={() => {
                  deleteUser(user).then(() => {
                    console.log('deleted');
                  });
                }}
              >
                DELETE ACCOUNT
              </Button>
            </Box>
          </Box>
        </Box>
        <Box flex={1}>
          {paperSnapshot ? (
            <>
              <Box p={4}>
                <FormControl
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
                </FormControl>
                <Flex>
                  {paperSnapshot.tags.map((tag) => {
                    return (
                      <Button
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
                      </Button>
                    );
                  })}
                </Flex>
              </Box>
              <Box>
                <Editor key={paperSnapshot.id} blocks={paperSnapshot.blocks} onChange={onBlocksChange} />
              </Box>
            </>
          ) : null}
        </Box>
      </Flex>
    </>
  );
}
