import { Schema } from './schema';
import { Paper, Cursor } from './model';

type CommandContext = {
  paper: Paper;
  schema: Schema;
  cursor: Cursor;
};

function blockBetween({ paper, schema, cursor }: CommandContext, func: Function) {
  let isStarted = false;
  const newBlocks = paper.blocks.map((b) => {
    if (b.id === cursor.anchorId || b.id === cursor.focusId) {
      isStarted = !isStarted;
      func(b);
    } else if (isStarted && !cursor.isCollapsed) {
      func(b);
    }
    return {
      ...b,
    };
  });
  return newBlocks;
}

const commands = {
  syncTexts: (ctx: CommandContext, blockTexts: { [id: string]: string }) => {
    ctx.paper.tr(() => {
      const newBlocks = ctx.paper.blocks
        .map((b) => {
          // TODO 画像とか、text nullなものはskipするようにする必要がある？
          if (blockTexts[b.id]) {
            b.text = blockTexts[b.id];
          } else {
            return null;
          }
          return { ...b };
        })
        .filter((b) => !!b);
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  indent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = blockBetween(ctx, (block) => {
        block.indent = Math.min(block.indent + 1, 8);
      });
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  outdent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = blockBetween(ctx, (block) => {
        block.indent = Math.max(block.indent - 1, 0);
      });
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
};
