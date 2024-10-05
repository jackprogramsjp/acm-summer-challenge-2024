import { tokenize } from '../frontend/scanner';
import { IllegalCharacterError, Token, token, TokenKind } from '../frontend/utils';

const FILENAME = 'testingfile';

declare global {
  namespace jest {
    interface Matchers<R> {
      toTokenEqual(expected: Token[]): R;
    }
  }
}

expect.extend({
  toTokenEqual(received: Token[], expected: Token[]) {
    const pass = received.every((token, index) => {
      return token.kind === expected[index].kind && token.value === expected[index].value;
    });

    if (pass) {
      return {
        message: () => `Expected tokens not to match`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected tokens to match, but they don't`,
        pass: false,
      };
    }
  },
});

it(`generates correct token list 1`, () => {
  const tokens = Array.from(tokenize(FILENAME, 'send 10, "Hello there", RedBlock;'));

  expect(tokens).toTokenEqual([
    token(TokenKind.Keyword, 'send'),
    token(TokenKind.Number, '10'),
    token(TokenKind.Comma),
    token(TokenKind.String, 'Hello there'),
    token(TokenKind.Comma),
    token(TokenKind.Identifier, 'RedBlock'),
    token(TokenKind.Semicolon),
  ]);
});

it(`generates correct token list 2`, () => {
  const tokens = Array.from(tokenize(FILENAME, 'x == 5'));

  expect(tokens).toTokenEqual([
    token(TokenKind.Identifier, 'x'),
    token(TokenKind.EqualEqual),
    token(TokenKind.Number, '5'),
  ]);
});

it(`generates correct error from scanner`, () => {
  // only error scanner can throw is Illegal character
  expect(() => {
    Array.from(tokenize(FILENAME, 'send α')); // α is an illegal character
  }).toThrow(IllegalCharacterError);
});
