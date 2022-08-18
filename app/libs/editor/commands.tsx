import { Schema, Block } from './schema';
import { EditorState } from './EditorState';

export type CommandContext = {
  block: Block;
  schema: Schema;
  state: EditorState;
};

export const commands = {
  updateText: (ctx: CommandContext, text: string): CommandContext => {
    ctx.state.tr(() => {
      const newBlocks = [...ctx.state.blocks];
      for (let i = 0; i < newBlocks.length; i += 1) {
        if (newBlocks[i].id === ctx.block.id) {
          newBlocks[i].text = text;
        }
      }
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
  indent: (ctx: CommandContext): CommandContext => {
    ctx.state.tr(() => {
      const newBlocks = ctx.state.blocks.map((b) => {
        if (b.id === ctx.block.id) {
          b.indent = Math.min(b.indent + 1, 8);
        }
        return {
          ...b,
        };
      });
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
  outdent: (ctx: CommandContext): CommandContext => {
    ctx.state.tr(() => {
      const newBlocks = ctx.state.blocks.map((b) => {
        if (b.id === ctx.block.id) {
          b.indent = Math.max(b.indent - 1, 0);
        }
        return {
          ...b,
        };
      });
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
  turnInto: (ctx: CommandContext, blockType: Block['type'], block: Partial<Block> = {}): CommandContext => {
    ctx.state.tr(() => {
      const newBlocks = ctx.state.blocks.map((b: Block) => {
        if (ctx.block.id === b.id) {
          return ctx.schema.createBlock(blockType, { ...b, ...block } as Partial<Block>);
        }
        return {
          ...b,
        };
      });
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
  splitBlock: (ctx: CommandContext, s: number, e: number): CommandContext => {
    ctx.state.tr(() => {
      if (ctx.block.text !== null) {
        const t = new Text(ctx.block.text);
        const newText = t.splitText(e);
        t.splitText(s);

        const defaultSchema = ctx.schema.defaultSchema();
        const currentSchema = ctx.schema.find(ctx.block.type);

        const newBlock =
          currentSchema.isContinuation !== false
            ? ctx.schema.createBlock(currentSchema.type as Block['type'], {
                text: newText.wholeText,
                indent: ctx.block.indent,
              })
            : ctx.schema.createBlock(defaultSchema.type as Block['type'], {
                text: newText.wholeText,
                indent: ctx.block.indent,
              });
        const newBlocks = [...ctx.state.blocks];
        for (let i = 0; i < ctx.state.blocks.length; i += 1) {
          if (newBlocks[i].id === ctx.block.id) {
            newBlocks[i].text = t.wholeText;
            newBlocks.splice(i + 1, 0, newBlock);
            break;
          }
        }
        ctx.state.setBlocks(newBlocks);
      } else {
        const defaultSchema = ctx.schema.defaultSchema();
        if (defaultSchema) {
          const newBlock = ctx.schema.createBlock(defaultSchema.type as Block['type'], {
            text: '',
            indent: ctx.block.indent,
          });
          const newBlocks = [...ctx.state.blocks];
          for (let i = 0; i < ctx.state.blocks.length; i += 1) {
            if (newBlocks[i].id === ctx.block.id) {
              newBlocks.splice(i + 1, 0, newBlock);
              break;
            }
          }
          ctx.state.setBlocks(newBlocks);
        }
      }
    });
    return ctx;
  },
  combineBlock: (ctx: CommandContext): CommandContext => {
    ctx.state.tr(() => {
      const newBlocks = [...ctx.state.blocks]
        .map((b, i) => {
          if (ctx.state.blocks[i + 1] && ctx.block.id === ctx.state.blocks[i + 1].id) {
            return {
              ...b,
              text: b.text + ctx.state.blocks[i + 1].text,
            };
          } else if (ctx.block.id === b.id) {
            return null;
          }
          return { ...b };
        })
        .filter((b) => !!b);
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
  moveTo: (ctx: CommandContext, targetId: string, toId: string) => {
    ctx.state.tr(() => {
      let targetIndex = 0;
      let toIndex = 0;

      for (let i = 0; i < ctx.state.blocks.length; i += 1) {
        if (targetId === ctx.state.blocks[i].id) {
          targetIndex = i;
        }

        if (toId === ctx.state.blocks[i].id) {
          toIndex = i;
        }
      }

      const l = ctx.state.findGroupedBlocks(targetId).length;
      const newBlocks = [...ctx.state.blocks];
      const sort = newBlocks.splice(targetIndex, l);
      newBlocks.splice(toIndex < targetIndex ? toIndex : toIndex - l + 1, 0, ...sort);
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },

  paste: (ctx: CommandContext, text: string): CommandContext => {
    ctx.state.tr(() => {
      const blockTexts = text.split('\n');
      const defaultSchema = ctx.schema.defaultSchema();
      const currentSchema = ctx.schema.find(ctx.block.type);

      let start = 0;
      if (ctx.block.text !== null) {
        start = 1;
        for (let i = 0; i < ctx.state.blocks.length; i += 1) {
          const block = ctx.state.blocks[i];
          if (block.id === ctx.block.id) {
            block.text = block.text + blockTexts[0].trim();
          }
        }
      }

      const blocks = [];
      for (let i = start; i < blockTexts.length; i += 1) {
        const blockText = blockTexts[i];
        const newBlock =
          currentSchema.isContinuation !== false
            ? ctx.schema.createBlock(currentSchema.type as Block['type'], {
                text: blockText.trim(),
                indent: ctx.block.indent,
              })
            : ctx.schema.createBlock(defaultSchema.type as Block['type'], {
                text: blockText.trim(),
                indent: ctx.block.indent,
              });

        const value = newBlock.text || '';
        const result = ctx.schema.execInputRule(value);
        if (result) {
          // TODO ctxがblockに依存しててinputRuleベースで正しく変換できない
          commands.updateText(ctx, result.text);
          commands.turnInto(ctx, result.schema.type as Block['type'], { attrs: result.attrs as any });
        } else {
          commands.updateText(ctx, value);
        }
        blocks.push(newBlock);
      }

      const newBlocks = [...ctx.state.blocks];
      for (let i = 0; i < ctx.state.blocks.length; i += 1) {
        if (newBlocks[i].id === ctx.block.id) {
          newBlocks.splice(i + 1, 0, ...blocks);
          break;
        }
      }
      ctx.state.setBlocks(newBlocks);
    });
    return ctx;
  },
};
