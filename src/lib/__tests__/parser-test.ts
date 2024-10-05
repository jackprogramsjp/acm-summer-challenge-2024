import Parser from '../frontend/parser';
import {
  identifier,
  callExpression,
  numberLiteral,
  Statements,
  stringLiteral,
  Program,
  assignExpression,
  listExpression,
  binaryExpression,
  Statement,
} from '../frontend/ast';
import { Token, token, TokenKind, defaultPosition } from '../frontend/utils';

const FILENAME = 'testingfile';

declare global {
  namespace jest {
    interface Matchers<R> {
      toAstEqual(expected: Statements): R;
    }
  }
}

expect.extend({
  toAstEqual(received: Statements, expected: Statements) {
    const deepEqualIgnoringPos = (obj1: any, obj2: any): boolean => {
      if (obj1 === obj2) return true;

      if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
      }

      const keys1 = Object.keys(obj1).filter((key) => key !== 'startPos' && key !== 'endPos');
      const keys2 = Object.keys(obj2).filter((key) => key !== 'startPos' && key !== 'endPos');

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (!keys2.includes(key)) {
          return false;
        }
        if (!deepEqualIgnoringPos(obj1[key], obj2[key])) {
          return false;
        }
      }

      return true;
    };

    const pass = received.every((statement, index) => {
      return deepEqualIgnoringPos(statement, expected[index]);
    });

    if (pass) {
      return {
        message: () => `Expected AST not to match`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected AST to match, but they don't`,
        pass: false,
      };
    }
  },
});

// function throwIfErrorFromAst(ast: ReturnType<typeof Parser.prototype.parse>): asserts ast is Program {
//   if (!Array.isArray(ast)) return;
//   throw new Error(convertBaseErrorToString(...ast));
// }

it(`generates correct ast 1`, () => {
  const ast = new Parser(FILENAME, `send(10, 'Hello there', RedBlock);`).parse();

  expect(ast.body).toAstEqual([
    callExpression(identifier(token(TokenKind.Identifier, 'send')), [
      numberLiteral(token(TokenKind.Number, '10')),
      stringLiteral(token(TokenKind.String, 'Hello there')),
      identifier(token(TokenKind.Identifier, 'RedBlock')),
    ]),
  ]);
});

it(`generates correct ast 2`, () => {
  const ast = new Parser(
    FILENAME,
    `
    ; ; ;
    let x = [2, 5, 'hello'];
    print(x);
    ;;;
  `,
  ).parse();

  expect(ast.body).toAstEqual([
    assignExpression(
      token(TokenKind.Identifier, 'x'),
      listExpression(
        [
          numberLiteral(token(TokenKind.Number, '2')),
          numberLiteral(token(TokenKind.Number, '5')),
          stringLiteral(token(TokenKind.String, 'hello')),
        ],
        defaultPosition(),
        defaultPosition(),
      ),
    ),
    callExpression(identifier(token(TokenKind.Identifier, 'print')), [identifier(token(TokenKind.Identifier, 'x'))]),
  ]);
});
