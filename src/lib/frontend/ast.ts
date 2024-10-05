import { advancePosition, Position, Token } from './utils';

export type NodeKind =
  | 'Program'
  | 'Identifier'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'ListExpression'
  | 'CallExpression'
  | 'AssignExpression'
  | 'NumberLiteral'
  | 'StringLiteral';

export interface Statement {
  kind: NodeKind;
  startPos: Position;
  endPos: Position;
}

export type Statements = Statement[];

export interface Program extends Statement {
  kind: 'Program';
  body: Statements;
}

export function program(body: Program['body']): Program {
  return { kind: 'Program', body, startPos: body[0].startPos, endPos: body[body.length - 1].endPos };
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
  kind: 'BinaryExpression';
  left: Expression;
  right: Expression;
  op: Token; // operator
}

export function binaryExpression(left: Expression, opToken: Token, right: Expression): BinaryExpression {
  return { kind: 'BinaryExpression', left, right, op: opToken, startPos: left.startPos, endPos: right.endPos };
}

export interface UnaryExpression extends Expression {
  kind: 'UnaryExpression';
  op: Token; // operator
  expr: Expression;
}

export function unaryExpression(opToken: Token, expr: Expression): UnaryExpression {
  return { kind: 'UnaryExpression', op: opToken, expr, startPos: opToken.startPos, endPos: expr.endPos };
}

export interface ListExpression extends Expression {
  kind: 'ListExpression';
  elementNodes: Expression[];
}

export function listExpression(
  elementNodes: ListExpression['elementNodes'],
  startPos: Position,
  endPos: Position,
): ListExpression {
  return { kind: 'ListExpression', elementNodes, startPos, endPos };
}

export interface CallExpression extends Expression {
  kind: 'CallExpression';
  callee: Expression;
  args: Expression[];
}

export function callExpression(callee: CallExpression['callee'], args: CallExpression['args']): CallExpression {
  const startPos = callee.startPos;
  const endPos = arguments.length > 0 ? arguments[arguments.length - 1].endPos : callee.endPos;

  return { kind: 'CallExpression', callee, args, startPos, endPos };
}

export interface AssignExpression extends Expression {
  kind: 'AssignExpression';
  identifier: Token;
  value: Expression;
}

export function assignExpression(
  identifier: AssignExpression['identifier'],
  value: AssignExpression['value'],
): AssignExpression {
  return { kind: 'AssignExpression', identifier, value, startPos: identifier.startPos, endPos: value.endPos };
}

export interface Identifier extends Expression {
  kind: 'Identifier';
  identifier: Token;
}

export function identifier(identifierToken: Token): Identifier {
  identifierToken = structuredClone(identifierToken);
  return {
    kind: 'Identifier',
    identifier: identifierToken,
    startPos: identifierToken.startPos,
    endPos: identifierToken.endPos,
  };
}

export interface NumberLiteral extends Expression {
  kind: 'NumberLiteral';
  value: Token;
}

export function numberLiteral(token: Token): NumberLiteral {
  token = structuredClone(token);
  return { kind: 'NumberLiteral', value: token, startPos: token.startPos, endPos: token.endPos };
}

export interface StringLiteral extends Expression {
  kind: 'StringLiteral';
  value: Token;
}

export function stringLiteral(token: Token): StringLiteral {
  token = structuredClone(token);
  return { kind: 'StringLiteral', value: token, startPos: token.startPos, endPos: token.endPos };
}
