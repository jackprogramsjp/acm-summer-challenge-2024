import {
  advancePosition,
  IllegalCharacterError,
  KEYWORDS,
  OPERATOR_DEFINITIONS,
  Position,
  position,
  token,
  TokenKind,
} from './utils';

function isDigit(c: string) {
  return c >= '0' && c <= '9';
}

function isNumber(c: string) {
  return isDigit(c) || c === '.';
}

function isAlpha(c: string) {
  return /^[a-zA-Z]$/.test(c);
}

function isAlphanum(c: string) {
  return /^[a-zA-Z0-9]$/.test(c);
}

function isUnderscore(c: string) {
  return c === '_';
}

function isIdentifierWithDigits(c: string) {
  return isUnderscore(c) || isAlphanum(c);
}

function isIdentifier(c: string) {
  return isUnderscore(c) || isAlpha(c);
}

function isQuote(c: string) {
  return c === '"' || c === "'";
}

function canSkip(c: string) {
  return /^\s$/.test(c);
}

function isComment(c: string) {
  return c === '#';
}

export function* tokenize(filename: string, text: string) {
  const iterator = text[Symbol.iterator]();
  let result = iterator.next();
  let done = result.done,
    value = result.value;
  let pos: Position = position(filename, text, -1, 0, -1);
  pos = advancePosition(pos);

  const advance = () => {
    pos = advancePosition(pos, value);
    result = iterator.next();
    done = result.done;
    value = result.value;
  };

  const getNumber = () => {
    let dotCount = 0;
    let numberStr = value;
    const startPos = structuredClone(pos);
    advance();

    while (!done && isNumber(value)) {
      if (value === '.') {
        if (++dotCount > 1) {
          break;
        }
      }

      numberStr += value;
      advance();
    }

    if (numberStr.startsWith('.')) {
      numberStr = '0' + numberStr;
    }

    if (numberStr.endsWith('.')) {
      numberStr += '0';
    }

    return token(TokenKind.Number, numberStr, startPos, pos);
  };

  const getIdentifier = () => {
    let idStr = '';
    const startPos = structuredClone(pos);

    while (!done && isIdentifierWithDigits(value)) {
      idStr += value;
      advance();
    }

    return token(KEYWORDS.includes(idStr) ? TokenKind.Keyword : TokenKind.Identifier, idStr, startPos, pos);
  };

  const getString = () => {
    let str = '';
    const startPos = structuredClone(pos);
    let escape = false;
    advance();

    const escapeCharacters: Readonly<Record<string, string>> = Object.freeze({
      t: '\t',
      n: '\n',
    });

    while (!done && (!isQuote(value) || escape)) {
      if (escape) {
        str += value in escapeCharacters ? escapeCharacters[value] : value;
      } else {
        if (value === '\\') {
          escape = true;
        } else {
          str += value;
        }
      }
      advance();
      escape = false;
    }

    advance();

    return token(TokenKind.String, str, startPos, pos);
  };

  const skipComment = () => {
    advance();
    while (!done && value !== '\n') advance();
    advance();
  };

  while (!done) {
    if (canSkip(value)) {
      advance();
    } else if (isComment(value)) {
      skipComment();
    } else if (Object.keys(OPERATOR_DEFINITIONS).includes(value)) {
      const character = value;
      advance();

      if (!done) {
        const twoCharacters = character + value;
        if (Object.keys(OPERATOR_DEFINITIONS).includes(twoCharacters)) {
          advance();
          yield token(OPERATOR_DEFINITIONS[twoCharacters], undefined, pos);
        } else {
          yield token(OPERATOR_DEFINITIONS[character], undefined, pos);
        }
      } else {
        yield token(OPERATOR_DEFINITIONS[character], undefined, pos);
      }
    } else if (isNumber(value)) {
      yield getNumber();
    } else if (isIdentifier(value)) {
      yield getIdentifier();
    } else if (isQuote(value)) {
      yield getString();
    } else {
      const startPos = structuredClone(pos);
      const oldCharacter = value;
      advance();
      throw new IllegalCharacterError(startPos, pos, `'${oldCharacter}'`);
    }
  }
}
