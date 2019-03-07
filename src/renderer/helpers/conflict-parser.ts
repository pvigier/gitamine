export class ConflictHunk {
  start: number;
  ancestors: number[];
  separator: number;
  end: number;

  constructor() {
    this.start = -1;
    this.ancestors = [];
    this.separator = -1;
    this.end = -1;
  }
}

enum TokenType {
  Start,
  Ancestor,
  Separator,
  End,
  Other
}

interface Token {
  type: TokenType;
  index: number;
}

function tokenizeLines(lines: string[]) {
  return lines.map((line, i) => {
    if (line.startsWith('<<<<<<<')) {
      return {type: TokenType.Start, index: i + 1};
    } else if (line.startsWith('|||||||')) {
      return {type: TokenType.Ancestor, index: i + 1};
    } else if (line.startsWith('=======')) {
      return {type: TokenType.Separator, index: i + 1};
    } else if (line.startsWith('>>>>>>>')) {
      return {type: TokenType.End, index: i + 1};
    } else {
      return {type: TokenType.Other, index: i + 1};
    }
  });
}

function parseConflictHunks(tokens: Token[]) {
  function consumeHunk() {
    const hunk = new ConflictHunk();
    hunk.start = tokens[i].index;
    ++i;
    while (i < tokens.length && tokens[i].type === TokenType.Ancestor) {
      hunk.ancestors.push(tokens[i].index);
      ++i;
    }
    if (i + 1 < tokens.length && 
      tokens[i].type === TokenType.Separator &&
      tokens[i + 1].type === TokenType.End) {
      hunk.separator = tokens[i].index;
      hunk.end = tokens[i + 1].index;
      hunks.push(hunk);
      i += 2;
    }
  }

  const hunks: ConflictHunk[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === TokenType.Start) {
      consumeHunk();
    } else {
      ++i;
    }
  }
  return hunks;
}

export function findConflictHunks(file: string) {
  const lines = file.split('\n');
  const tokens = tokenizeLines(lines).filter((token) => token.type !== TokenType.Other);
  return parseConflictHunks(tokens);
}