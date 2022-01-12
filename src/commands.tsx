import { Schema, Block } from './schema';
import { Paper } from './model';

export type CommandContext = {
  block: Block;
  schema: Schema;
  paper: Paper;
  sel: Selection;
};

export const commands = {
  updateText: (ctx: CommandContext, text: string): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = [...ctx.paper.blocks];
      for (let i = 0; i < newBlocks.length; i += 1) {
        if (newBlocks[i].id === ctx.block.id) {
          newBlocks[i].text = text;
        }
      }
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  indent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = ctx.paper.blocks.map((b) => {
        if (b.id === ctx.block.id) {
          b.indent = Math.min(b.indent + 1, 8);
        }
        return {
          ...b,
        };
      });
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  outdent: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = ctx.paper.blocks.map((b) => {
        if (b.id === ctx.block.id) {
          b.indent = Math.max(b.indent - 1, 0);
        }
        return {
          ...b,
        };
      });
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  turnInto: (ctx: CommandContext, blockType: Block['type']): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = ctx.paper.blocks.map((b) => {
        if (ctx.block.id === b.id) {
          return ctx.schema.createBlock(blockType, b);
        }
        return {
          ...b,
        };
      });
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
  splitBlock: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      if (ctx.block.text !== null) {
        const t = new Text(ctx.block.text);
        const s = Math.min(ctx.sel.anchorOffset, ctx.sel.focusOffset);
        const e = Math.max(ctx.sel.anchorOffset, ctx.sel.focusOffset);
        const newText = t.splitText(e);
        t.splitText(s);

        const newBlock = ctx.schema.createBlock(ctx.block.type, {
          text: newText.wholeText,
          indent: ctx.block.indent,
        });
        const newBlocks = [...ctx.paper.blocks];
        for (let i = 0; i < ctx.paper.blocks.length; i += 1) {
          if (newBlocks[i].id === ctx.block.id) {
            newBlocks[i].text = t.wholeText;
            newBlocks.splice(i + 1, 0, newBlock);
            break;
          }
        }
        ctx.paper.setBlocks(newBlocks);
      } else {
        const defaultSchema = ctx.schema.defaultSchema();
        if (defaultSchema) {
          const newBlock = ctx.schema.createBlock(defaultSchema.type as Block['type'], {
            text: '',
            indent: ctx.block.indent,
          });
          const newBlocks = [...ctx.paper.blocks];
          for (let i = 0; i < ctx.paper.blocks.length; i += 1) {
            if (newBlocks[i].id === ctx.block.id) {
              newBlocks.splice(i + 1, 0, newBlock);
              break;
            }
          }
          ctx.paper.setBlocks(newBlocks);
        }
      }
    });
    return ctx;
  },
  combineBlock: (ctx: CommandContext): CommandContext => {
    ctx.paper.tr(() => {
      const newBlocks = [...ctx.paper.blocks]
        .map((b, i) => {
          if (ctx.paper.blocks[i + 1] && ctx.block.id === ctx.paper.blocks[i + 1].id) {
            return {
              ...b,
              text: b.text + ctx.paper.blocks[i + 1].text,
            };
          } else if (ctx.block.id === b.id) {
            return null;
          }
          return { ...b };
        })
        .filter((b) => !!b);
      ctx.paper.setBlocks(newBlocks);
    });
    return ctx;
  },
};
