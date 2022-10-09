import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getFirestore, collection, doc, addDoc, setDoc } from 'firebase/firestore';

import { t } from '../i18n';
import { extractTitle, schema, Editor } from '../components/Editor';
import { useUser, useArrangement, usePapers, useOwnership, useAccess } from '../hooks';
import { signOut, deleteAcount, createPaper } from '../usecases';
import { debounce } from '../utils';
import { Box, Flex, FormControl, Button, Text, List, ListItem } from '../design-system';

const db = getFirestore();

const debouncedSetBlocks = debounce((paperId, paper) => {
  setDoc(doc(db, 'papers', paperId), paper);
}, 600);

export default function AppPage() {
  const router = useRouter();

  const { data: user, isError: isUserError } = useUser();
  const { data: arrangement, isError: isArrangementError } = useArrangement();
  const { data: papers, isError: isPapersError } = usePapers(arrangement?.front || []);
  const { data: ownership, isError: isOwnershipError } = useOwnership(arrangement?.front[0]);
  const { data: access, isError: isAccessError } = useAccess(arrangement?.front[0]);

  const [currentPaperId, setCurrentPaperId] = useState(null);
  const [tag, setTag] = useState('');
  const [paperSnapshot, setPaperSnapshot] = useState(null);

  useEffect(() => {
    if (arrangement?.front.length && paperSnapshot == null) {
      const p = papers.filter((p) => p.id === arrangement.front[0])[0];
      setPaperSnapshot(p);
    }
  }, [arrangement, papers, paperSnapshot]);

  useEffect(() => {
    if (paperSnapshot) {
      const p = papers.filter((p) => p.id === paperSnapshot.id)[0];
      setPaperSnapshot(p);
    }
  }, [papers, paperSnapshot]);

  const onBlocksChange = useCallback(
    (newBlocks) => {
      const newPaper = {
        ...paperSnapshot,
        blocks: newBlocks,
      };
      debouncedSetBlocks(newPaper.id, newPaper);
    },
    [papers, paperSnapshot],
  );

  const onCreatePaperClick = () => {
    createPaper();
  };

  const onSignOutButtonClick = () => {
    signOut();
  };

  const onDeleteAccountButton = () => {
    deleteAcount();
  };

  const onTagFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
  };

  if (isUserError) {
    /* TODO: display sign in form modal would be better */
    router.push('/');
  }

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
            <Button onClick={onCreatePaperClick}>{t('Button.CreatePaper')}</Button>
          </Box>
          <List>
            {arrangement
              ? arrangement.front.map((paperId) => {
                  const p = papers.filter((p) => p.id === paperId)[0];
                  const onPaperListItemClick = () => {
                    setPaperSnapshot(p || null);
                  };

                  return (
                    <ListItem key={paperId} onClick={onPaperListItemClick}>
                      <Box>{p ? extractTitle(p.blocks) || paperId : null}</Box>
                    </ListItem>
                  );
                })
              : null}
          </List>
          <Box>
            <Box>
              <Button onClick={onSignOutButtonClick}>{t('Button.SignOut')}</Button>
            </Box>
            <Box>
              <Button onClick={onDeleteAccountButton}>{t('Button.DeleteAccount')}</Button>
            </Box>
          </Box>
        </Box>
        <Box flex={1}>
          {paperSnapshot ? (
            <>
              <Box p={4}>
                <FormControl onSubmit={onTagFormSubmit}>
                  <input type="text" value={tag} onChange={(event) => setTag(event.currentTarget.value.trim())} />
                  <Button>{t('Button.AddTag')}</Button>
                </FormControl>
                <Flex>
                  {paperSnapshot.tags.map((tag) => {
                    const onTagClick = () => {
                      const newTags = paperSnapshot.tags.filter((t) => t !== tag);
                      const newPaper = {
                        ...paperSnapshot,
                        tags: newTags,
                      };
                      setDoc(doc(db, 'papers', paperSnapshot.id), newPaper);
                    };
                    return (
                      <Button key={tag} onClick={onTagClick}>
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
