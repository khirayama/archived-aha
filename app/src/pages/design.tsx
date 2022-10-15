import { renderToStaticMarkup } from 'react-dom/server';
import prettify from 'html-prettify';

import {
  /* Layout */
  Box,
  Flex,
  /* Form */
  FormControl,
  Input,
  Button,
  /* Navigation */
  Link,
  /* Typography */
  Text,
  Heading,
  /* Display */
  List,
  ListItem,
} from '../design-system';
import { dsp } from '../design-system/utils';

function Code(props) {
  const p = dsp(props);
  return <code {...p} />;
}

function Preview(props) {
  return (
    <Box>
      <Code style={{ whiteSpace: 'pre' }}>{prettify(renderToStaticMarkup(props.children).replace(/></g, '>\n<'))}</Code>
      <Box>{props.children}</Box>
    </Box>
  );
}

export default function DesignPage() {
  return (
    <Box>
      <Box p={4}>
        <Heading>Design System</Heading>
      </Box>

      <Box p={4}>
        <Heading as="h2">Properties</Heading>
        <Text>padding, flex, width</Text>
      </Box>

      <Box p={4}>
        <Heading as="h2">Layout</Heading>
      </Box>

      <Box p={4}>
        <Heading as="h2">Form</Heading>
      </Box>

      <Box p={4}>
        <Heading as="h2">Navigation</Heading>
      </Box>

      <Box p={4}>
        <Heading as="h2">Typography</Heading>

        <Box p={4}>
          <Heading as="h3">Heading</Heading>
          <Box>
            <Text>props: as</Text>
            <Text>scheduled: size</Text>
          </Box>
          <Preview>
            <Heading>Heading 1</Heading>
            <Heading as="h2">Heading 2</Heading>
            <Heading as="h3">Heading 3</Heading>
            <Heading as="h4">Heading 4</Heading>
            <Heading as="h5">Heading 5</Heading>
            <Heading as="h6">Heading 6</Heading>
          </Preview>
        </Box>
      </Box>

      <Box p={4}>
        <Heading as="h2">Display</Heading>
        <Box p={4}>
          <Preview>
            <List>
              <ListItem>Item 1</ListItem>
              <ListItem>Item 2</ListItem>
              <ListItem>Item 3</ListItem>
            </List>
          </Preview>
        </Box>
      </Box>
    </Box>
  );
}
