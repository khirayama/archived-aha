import { Schema, Block } from './schema';
import { Paper, Cursor } from './model';

export type CommandContext = {
  paper: Paper;
  schema: Schema;
  cursor: Cursor;
};

function blockBetween(ctx: CommandContext, func: (block: Block) => Block) {
  let isStarted = false;
  const newBlocks = ctx.paper.blocks.map((b) => {
    if (b.id === ctx.cursor.anchorId || b.id === ctx.cursor.focusId) {
      isStarted = !isStarted;
      return {
        ...func(b),
      };
    } else if (isStarted && !ctx.cursor.isCollapsed) {
      return {
        ...func(b),
      };
    }
    return {
      ...b,
    };
  });
  return newBlocks.filter((b) => !!b);
}

function getStartAndEnd(ctx: CommandContext) {
  for (let i = 0; i < ctx.paper.blocks.length; i += 1) {
    const block = ctx.paper.blocks[i];
    if (ctx.cursor.anchorId === block.id && ctx.cursor.anchorId === ctx.cursor.focusId) {
      return {
        start: {
          id: ctx.cursor.anchorId,
          offset: Math.min(ctx.cursor.anchorOffset, ctx.cursor.focusOffset),
        },
        end: {
          id: ctx.cursor.focusId,
          offset: Math.max(ctx.cursor.anchorOffset, ctx.cursor.focusOffset),
        },
      };
    } else if (ctx.cursor.anchorId === block.id) {
      return {
        start: {
          id: ctx.cursor.anchorId,
          offset: ctx.cursor.anchorOffset,
        },
        end: {
          id: ctx.cursor.focusId,
          offset: ctx.cursor.focusOffset,
        },
      };
    } else if (ctx.cursor.focusId === block.id) {
      return {
        start: {
          id: ctx.cursor.focusId,
          offset: ctx.cursor.focusOffset,
        },
        end: {
          id: ctx.cursor.anchorId,
          offset: ctx.cursor.anchorOffset,
        },
      };
    }
  }
}

export const commands = {
  turnInto: (ctx: CommandContext, blockType: Block['type'], block: Partial<Block> = {}) => {
    if (ctx.cursor.isCollapsed) {
      ctx.paper.tr(() => {
        const newBlocks = ctx.paper.blocks.map((b: Block) => {
          if (ctx.cursor.anchorId === b.id) {
            return ctx.schema.createBlock(blockType, { ...b, ...block } as Partial<Block>);
          }
          return {
            ...b,
          };
        });
        ctx.paper.setBlocks(newBlocks);
      });
    }
    return ctx;
  },
  splitBlock: (ctx: CommandContext): CommandContext => {
    const newBlocks = [];
    const { start, end } = getStartAndEnd(ctx);

    if (start.id === end.id) {
      const block = ctx.paper.findBlock(start.id);
      const t = new Text(block.text);
      const newText = t.splitText(end.offset);
      t.splitText(start.offset);
      const defaultSchema = ctx.schema.defaultSchema();
      const currentSchema = ctx.schema.find(block.type);

      const newBlock =
        currentSchema.isContinuation !== false
          ? ctx.schema.createBlock(currentSchema.type as Block['type'], {
              text: newText.wholeText,
              indent: block.indent,
            })
          : ctx.schema.createBlock(defaultSchema.type as Block['type'], {
              text: newText.wholeText,
              indent: block.indent,
            });

      const newBlocks = [...ctx.paper.blocks];
      for (let i = 0; i < newBlocks.length; i += 1) {
        if (newBlocks[i].id === block.id) {
          newBlocks[i].text = t.wholeText;
          newBlocks.splice(i + 1, 0, newBlock);
          break;
        }
      }
      ctx.paper.setBlocks(newBlocks);
    } else {
    }
    return ctx;
  },
  indent: (ctx: CommandContext): CommandContext => {
    const newBlocks = blockBetween(ctx, (block) => {
      block.indent = Math.min(block.indent + 1, 8);
      return block;
    });
    ctx.paper.setBlocks(newBlocks);
    return ctx;
  },
  outdent: (ctx: CommandContext): CommandContext => {
    const newBlocks = blockBetween(ctx, (block) => {
      block.indent = Math.max(block.indent - 1, 0);
      return block;
    });
    ctx.paper.setBlocks(newBlocks);
    return ctx;
  },
  updateText: (ctx: CommandContext, text: string): CommandContext => {
    if (ctx.cursor.isCollapsed) {
      ctx.paper.tr(() => {
        const newBlocks = [...ctx.paper.blocks];
        for (let i = 0; i < newBlocks.length; i += 1) {
          if (newBlocks[i].id === ctx.cursor.anchorId) {
            newBlocks[i].text = text;
          }
        }
        ctx.paper.setBlocks(newBlocks);
      });
    }
    return ctx;
  },
  takeAction: (ctx: CommandContext): CommandContext => {
    const newBlocks = blockBetween(ctx, (block) => {
      const schema = ctx.schema.find(block.type);
      if (schema && schema.action) {
        schema.action(ctx, block);
      }
      return block;
    });
    ctx.paper.setBlocks(newBlocks);
    return ctx;
  },
  moveTo: (ctx: CommandContext, targetId: string, toId: string): CommandContext => {
    ctx.paper.tr(() => {
      let targetIndex = 0;
      let toIndex = 0;

      for (let i = 0; i < ctx.paper.blocks.length; i += 1) {
        if (targetId === ctx.paper.blocks[i].id) {
          targetIndex = i;
        }

        if (toId === ctx.paper.blocks[i].id) {
          toIndex = i;
        }
      }

      const l = ctx.paper.findGroupedBlocks(targetId).length;
      const newBlocks = [...ctx.paper.blocks];
      const sort = newBlocks.splice(targetIndex, l);
      newBlocks.splice(toIndex < targetIndex ? toIndex : toIndex - l + 1, 0, ...sort);
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
};
