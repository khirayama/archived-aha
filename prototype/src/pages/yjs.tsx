import * as Y from 'yjs';

const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

doc1.on('update', (update) => {
  Y.applyUpdate(doc2, update);
});

doc2.on('update', (update) => {
  Y.applyUpdate(doc1, update);
});

doc1.getArray('myarray').insert(0, ['Hello doc2, you got this?']);
doc2.getArray('myarray').get(0);
console.log(doc1.toJSON(), doc2.toJSON());

type Page = {
  title: string;
  sections: Section[];
};

type Section = {
  heading: string;
  items: Item[];
};

type Item = {
  text: string;
  indent: number;
};

const page = new Y.Doc();
page.getText('title').insert(0, 'THIS IS TITLE');
const section0 = new Y.Map();
section0.set('heading', new Y.Text('THIS IS HEADING OF SECTION 0'));
page.getArray('sections').insert(0, [section0]);
const item0 = new Y.Map();
const items0 = new Y.Array();
items0.insert(0, [item0]);
section0.set('items', items0);
console.log(page.toJSON());

export default function YjsPage() {
  return (
    <>
      <h1>yjs</h1>
      <div>ok</div>
    </>
  );
}
