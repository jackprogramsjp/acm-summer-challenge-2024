import * as Runtime from '../backend/runtime';

export enum TokenKind {
  // Identifiers & Values
  Number,
  String,
  Identifier,
  Keyword,

  // Single Operators
  Plus,
  Minus,
  Star,
  Slash,
  Bang,
  Equal,
  Comma,
  LessThan,
  GreaterThan,
  Power,
  Semicolon,

  // Double operators
  EqualEqual,
  NotEqual,
  LessThanEqual,
  GreaterThanEqual,

  // Starting & Ending Characters
  Lparen,
  Rparen,
  Lsquare,
  Rsquare,

  // End-of-file
  Eof,
}

export const KEYWORDS: readonly string[] = Object.freeze(['let', 'and', 'or']);

export const OPERATOR_DEFINITIONS: Readonly<Record<string, TokenKind>> = Object.freeze({
  '+': TokenKind.Plus,
  '-': TokenKind.Minus,
  '*': TokenKind.Star,
  '/': TokenKind.Slash,
  '!': TokenKind.Bang,
  '=': TokenKind.Equal,
  ',': TokenKind.Comma,
  '<': TokenKind.LessThan,
  '>': TokenKind.GreaterThan,
  '^': TokenKind.Power,
  ';': TokenKind.Semicolon,

  '==': TokenKind.EqualEqual,
  '!=': TokenKind.NotEqual,
  '<=': TokenKind.LessThanEqual,
  '>=': TokenKind.GreaterThanEqual,

  '(': TokenKind.Lparen,
  ')': TokenKind.Rparen,
  '[': TokenKind.Lsquare,
  ']': TokenKind.Rsquare,
});

export interface Token {
  kind: TokenKind;
  value?: string;
  startPos: Position;
  endPos: Position;
}

export function token(kind: TokenKind, value?: string, startPos?: Position, endPos?: Position): Token {
  if (startPos === undefined) {
    return { kind, value, startPos: defaultPosition(), endPos: defaultPosition() };
    // throw new Error('Just a temporary solution but this is guaranteed to not happen.');
  }

  const result: Token = {
    kind,
    value,
    startPos: structuredClone(startPos),
    endPos: advancePosition(structuredClone(startPos)),
  };

  if (endPos !== undefined) {
    result.endPos = structuredClone(endPos);
  }

  return result;
}

export function tokenMatch(lhs: Token | undefined | null, rhsKind: TokenKind, rhsValue?: string) {
  return lhs != null && lhs.kind === rhsKind && (rhsValue !== undefined ? lhs.value === rhsValue : true);
}

export interface Position {
  filename: string;
  source: string;
  index: number;
  lineno: number;
  column: number;
}

export function defaultPosition() {
  return position('', '', 0, 0, 0);
}

export function position(filename: string, source: string, index: number, lineno: number, column: number): Position {
  return { filename, source, index, lineno, column };
}

export function advancePosition(position: Position, character?: string): Position {
  position.index++;
  position.column++;

  if (character === '\n') {
    position.lineno++;
    position.column = 0;
  }

  return position;
}

function getSpecificTextFromPosition(text: string, startPos: Position, endPos: Position) {
  let res = '';

  let startIndex = Math.max(0, text.lastIndexOf('\n', startPos.index));
  let endIndex = text.indexOf('\n', startIndex + 1);
  endIndex = endIndex < 0 ? text.length : endIndex;

  const newlineCount = endPos.lineno - startPos.lineno + 1;

  for (let i = 0; i < newlineCount; i++) {
    const specificLine = text.slice(startIndex, endIndex);
    const endColumn = i === newlineCount - 1 ? endPos.column : specificLine.length - 1;
    const startColumn = i === 0 ? startPos.column : 0;

    res += specificLine + '\n' + ' '.repeat(startColumn) + '^'.repeat(endColumn - startColumn);

    startIndex = endIndex;
    endIndex = text.indexOf('\n', startIndex + 1);
    endIndex = endIndex < 0 ? text.length : endIndex;
  }

  return res.replaceAll('\t', '');
}

export class BaseError {
  constructor(
    protected _startPos: Position,
    protected _endPos: Position,
    protected _errorName: string,
    protected _details: string,
  ) {}

  public toString = (): string => {
    let result = `File '${this._startPos.filename}', line ${this._startPos.lineno + 1}`;
    result += `\n\nError name: ${this._errorName}\nDetails: ${this._details}`;
    result += `\n\n${getSpecificTextFromPosition(this._startPos.source, this._startPos, this._endPos)}`;
    return result;
  };
}

export class IllegalCharacterError extends BaseError {
  constructor(startPos: Position, endPos: Position, details: string) {
    super(startPos, endPos, 'Illegal character', details);
  }
}

export class IllegalSyntaxError extends BaseError {
  constructor(startPos: Position, endPos: Position, details: string) {
    super(startPos, endPos, 'Illegal syntax', details);
  }
}

export class InvalidSyntaxError extends BaseError {
  constructor(startPos: Position, endPos: Position, details: string) {
    super(startPos, endPos, 'Invalid syntax', details);
  }
}

export class RuntimeError extends BaseError {
  constructor(
    startPos: Position,
    endPos: Position,
    details: string,
    private context: Runtime.Context,
  ) {
    super(startPos, endPos, 'Runtime error', details);
  }

  private traceback() {
    let res = '';
    let position: Position | undefined = this._startPos;
    let context: Runtime.Context | undefined = this.context;

    while (context !== undefined && position !== undefined) {
      res = `\tFile '${position.filename}' -> line ${position.lineno + 1} -> ${context.name}\n\n` + res;
      position = context.parentPos;
      context = context.parent;
    }

    return `traceback on:\n${res}`;
  }

  public toString = (): string => {
    let result = this.traceback();
    try {
      result += `File '${this._startPos.filename}', line ${this._startPos.lineno + 1}`;
      result += `\n\nError name: ${this._errorName}\nDetails: ${this._details}`;
      result += `\n\n${getSpecificTextFromPosition(this._startPos.source, this._startPos, this._endPos)}`;
    } catch (e) {
    }
    return result;
  };
}
