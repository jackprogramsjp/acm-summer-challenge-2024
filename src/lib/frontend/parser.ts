import { BaseError, IllegalSyntaxError, InvalidSyntaxError, token, Token, TokenKind, tokenMatch } from './utils';
import { tokenize } from './scanner';
import {
  assignExpression,
  binaryExpression,
  CallExpression,
  callExpression,
  Expression,
  identifier,
  ListExpression,
  listExpression,
  numberLiteral,
  Program,
  program,
  Statement,
  Statements,
  stringLiteral,
  unaryExpression,
} from './ast';

// NOTE: https://stackoverflow.com/questions/42238984/uncaught-typeerror-this-method-is-not-a-function-node-js-class-export

function expected(...expects: [string, ...string[]]): string {
  return `Expected ${expects.join(', ')}`;
}

function quote(...values: [string, ...string[]]) {
  let result = `'${values.shift()!}'`;

  for (const value of values) {
    result += `, '${value}'`;
  }

  return result;
}

export default class Parser {
  private readonly iterator: ReturnType<typeof tokenize> = null!;
  private current: Token = null!;

  constructor(filename: string, text: string) {
    this.iterator = tokenize(filename, text);
    this.advance();
  }

  private advance() {
    const { value, done } = this.iterator.next();
    this.current = !done ? value : token(TokenKind.Eof);
  }

  private currentIsEof() {
    return this.current.kind === TokenKind.Eof;
  }

  private binaryOp(
    callback: () => Expression,
    ops: [TokenKind, ...TokenKind[]] | [[TokenKind, string], ...[TokenKind, string][]],
    optionalCallback?: () => Expression,
  ): Expression {
    if (optionalCallback === undefined) {
      optionalCallback = callback;
    }

    let lhs = callback();

    while (
      ops.some((op) =>
        Array.isArray(op)
          ? JSON.stringify(op) === JSON.stringify([this.current.kind, this.current.value ?? ''])
          : op === this.current.kind,
      )
    ) {
      const op = this.current;
      this.advance();
      const rhs = optionalCallback();
      lhs = binaryExpression(lhs, op, rhs);
    }

    return lhs;
  }

  public parse(): Program {
    const statements = this.statements();

    return program(statements);
  }

  private statements(): Statements {
    const statements: Statements = [];

    while (!this.currentIsEof()) {
      if ((this.current.kind as TokenKind) === TokenKind.Semicolon) {
        this.advance();
        continue;
      }

      const statement = this.statement();
      const startPos = structuredClone(statement.startPos);
      const endPos = structuredClone(statement.endPos);

      statements.push(statement);

      if ((this.current.kind as TokenKind) === TokenKind.Semicolon) {
        this.advance();
      } else {
        throw new InvalidSyntaxError(startPos, endPos, expected('statement to end with semicolon'));
      }
    }

    // if (this.current.kind === TokenKind.Rbrace)
    //   this.advance();

    return statements;
  }

  private statement(): Statement {
    const startPos = structuredClone(this.current.startPos);

    // if (tokenMatch(this.current, TokenKind.Keyword, 'return')) {
    //   this.advance();
    //   return returnStatement(this.expr(), startPos, structuredClone(this.current.startPos));
    // }

    const expr = this.expr();

    if (this.currentIsEof()) {
      throw new InvalidSyntaxError(
        this.current.startPos,
        this.current.endPos,
        expected('identifier', 'number', quote('return', 'let', '+', '-', '[', '(', '!')),
      );
    }

    return expr;
  }

  private expr(): Expression {
    if (tokenMatch(this.current, TokenKind.Keyword, 'let')) {
      this.advance();

      if (this.current.kind !== TokenKind.Identifier) {
        throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected('identifier'));
      }

      const identifier = structuredClone(this.current);
      this.advance();

      if ((this.current.kind as TokenKind) !== TokenKind.Equal) {
        throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected(quote('=')));
      }

      this.advance();
      return assignExpression(identifier, this.expr());
    }

    const result = this.binaryOp(this.comparison.bind(this), [
      [TokenKind.Keyword, 'and'],
      [TokenKind.Keyword, 'or'],
    ]);

    if (this.currentIsEof()) {
      throw new InvalidSyntaxError(
        this.current.startPos,
        this.current.endPos,
        expected('identifier', 'number', quote('let', '+', '-', '[', '!', '(')),
      );
    }

    return result;
  }

  private factor(): Expression {
    const token = this.current;

    if ([TokenKind.Plus, TokenKind.Minus].includes(token.kind)) {
      this.advance();
      return unaryExpression(token, this.factor());
    }

    return this.power();
  }

  private comparison(): Expression {
    if (tokenMatch(this.current, TokenKind.Bang)) {
      const operator = structuredClone(this.current);
      this.advance();
      return unaryExpression(operator, this.comparison());
    }

    const node = this.binaryOp(this.arithmetic.bind(this), [
      TokenKind.EqualEqual,
      TokenKind.NotEqual,
      TokenKind.LessThan,
      TokenKind.LessThanEqual,
      TokenKind.GreaterThan,
      TokenKind.GreaterThanEqual,
    ]);

    if (this.currentIsEof()) {
      throw new InvalidSyntaxError(
        this.current.startPos,
        this.current.endPos,
        expected('identifier', 'number', quote('!', '+', '-', '[', '(')),
      );
    }

    return node;
  }

  private arithmetic(): Expression {
    return this.binaryOp(this.term.bind(this), [TokenKind.Plus, TokenKind.Minus]);
  }

  private term(): Expression {
    // Multiply & Divide
    return this.binaryOp(this.factor.bind(this), [TokenKind.Star, TokenKind.Slash]);
  }

  private power(): Expression {
    return this.binaryOp(this.call.bind(this), [TokenKind.Power], this.factor.bind(this));
  }

  private listExpr(): Expression {
    const elementNodes: ListExpression['elementNodes'] = [];
    const startPos = structuredClone(this.current.startPos);

    if (this.current.kind !== TokenKind.Lsquare) {
      throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected(quote('[')));
    }

    this.advance();

    if ((this.current.kind as TokenKind) !== TokenKind.Rsquare) {
      const firstExpr = this.expr();
      if (this.currentIsEof()) {
        throw new InvalidSyntaxError(
          this.current.startPos,
          this.current.endPos,
          expected(quote('let'), 'number', 'identifier', quote('[', ']', '(', '+', '-', '!')),
        );
      }
      elementNodes.push(firstExpr);

      while ((this.current.kind as TokenKind) === TokenKind.Comma) {
        this.advance();
        elementNodes.push(this.expr());
      }

      if ((this.current.kind as TokenKind) !== TokenKind.Rsquare) {
        throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected(quote(']', ',')));
      }

      this.advance();
    } else {
      this.advance();
    }

    return listExpression(elementNodes, startPos, structuredClone(this.current.endPos));
  }

  private call(): Expression {
    const atom = this.atom();

    if (this.current.kind !== TokenKind.Lparen) {
      return atom;
    }

    const args: CallExpression['args'] = [];

    this.advance();

    if ((this.current.kind as TokenKind) !== TokenKind.Rparen) {
      args.push(this.expr());

      while ((this.current.kind as TokenKind) === TokenKind.Comma) {
        this.advance();
        args.push(this.expr());
      }

      if ((this.current.kind as TokenKind) !== TokenKind.Rparen) {
        throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected(quote(')', ',')));
      }

      this.advance();
    } else {
      this.advance();
    }

    return callExpression(atom, args);
  }

  private atom(): Expression {
    const token = structuredClone(this.current);

    switch (token.kind) {
      case TokenKind.Number:
        this.advance();
        return numberLiteral(token);
      case TokenKind.String:
        this.advance();
        return stringLiteral(token);
      case TokenKind.Identifier:
        this.advance();
        return identifier(token);
      case TokenKind.Lparen: {
        this.advance();
        const res = this.expr();

        if (this.current.kind === TokenKind.Rparen) {
          this.advance();
          return res;
        } else {
          throw new InvalidSyntaxError(this.current.startPos, this.current.endPos, expected(quote(')')));
        }
      }
      case TokenKind.Lsquare:
        return this.listExpr();
    }

    throw new IllegalSyntaxError(
      token.startPos,
      token.endPos,
      expected('number', 'identifier', 'string', quote('(', '[')),
    );
  }
}
