import * as Ast from '../frontend/ast';
import * as Runtime from './runtime';
import * as Value from './value';
import { defaultPosition, RuntimeError, TokenKind, tokenMatch } from '../frontend/utils';

function visit(context: Runtime.Context, node: Ast.Statement) {
  return VISITS[node.kind](node, context);
}

const VISITS: Readonly<Record<Ast.NodeKind, (node: Ast.Statement, context: Runtime.Context) => Value.Value>> =
  Object.freeze({
    Program: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.Program;
      node.body.forEach((statement) => visit(context, statement));
      return Value.NumberValue.Null;
    },
    Identifier: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.Identifier;
      const identifier = node.identifier.value!;
      const value = context.symbolTable.get(identifier);

      if (value === undefined) {
        throw new RuntimeError(node.startPos, node.endPos, `${identifier} is not defined`, context);
      }

      return value.clone().setContext(context).setPosition(node.startPos, node.endPos);
    },
    BinaryExpression: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.BinaryExpression;
      const lhs = visit(context, node.left);
      const rhs = visit(context, node.right);

      switch (node.op.kind) {
        case TokenKind.Plus:
          return lhs.add(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.Minus:
          return lhs.sub(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.Star:
          return lhs.mul(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.Slash:
          return lhs.div(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.Power:
          return lhs.pow(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.EqualEqual:
          return lhs.eq(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.NotEqual:
          return lhs.ne(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.LessThan:
          return lhs.lt(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.LessThanEqual:
          return lhs.lte(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.GreaterThan:
          return lhs.gt(rhs).setPosition(node.startPos, node.endPos);
        case TokenKind.GreaterThanEqual:
          return lhs.gte(rhs).setPosition(node.startPos, node.endPos);
        default:
          if (tokenMatch(node.op, TokenKind.Keyword, 'and')) {
            return lhs.and(rhs).setPosition(node.startPos, node.endPos);
          } else if (tokenMatch(node.op, TokenKind.Keyword, 'or')) {
            return lhs.or(rhs).setPosition(node.startPos, node.endPos);
          }
      }

      throw new RuntimeError(node.startPos, node.endPos, `binary expression nonexistent on operator`, context);
    },
    UnaryExpression: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.UnaryExpression;
      let num = visit(context, node);

      if (!(num instanceof Value.NumberValue)) {
        throw new RuntimeError(node.startPos, node.endPos, `unary expression must be on number`, context);
      }

      if (node.op.kind === TokenKind.Minus) {
        num = num.mul(new Value.NumberValue(-1, defaultPosition(), defaultPosition(), Runtime.defaultContext()));
      } else if (node.op.kind === TokenKind.Bang) {
        num = num.not();
      }

      return num.setPosition(node.startPos, node.endPos);
    },
    ListExpression: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.ListExpression;
      return new Value.ListValue(
        node.elementNodes.map((elementNode) => visit(context, elementNode)),
        node.startPos,
        node.endPos,
        context,
      );
    },
    CallExpression: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.CallExpression;
      let calleeValue = visit(context, node.callee);
      calleeValue = calleeValue.clone().setPosition(node.startPos, node.endPos);

      const args: Value.Value[] = node.args.map((arg) => visit(context, arg));

      const resultValue = calleeValue.execute(args);

      return resultValue.clone().setPosition(node.startPos, node.endPos).setContext(context);
    },
    AssignExpression: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.AssignExpression;
      const identifier = node.identifier.value!;
      const value = visit(context, node.value);

      context.symbolTable.set(identifier, value);
      return value;
    },
    StringLiteral: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.StringLiteral;
      return new Value.StringValue(node.value.value!, node.startPos, node.endPos, context);
    },
    NumberLiteral: (n: Ast.Statement, context: Runtime.Context) => {
      const node = n as Ast.NumberLiteral;
      return new Value.NumberValue(parseFloat(node.value.value!), node.startPos, node.endPos, context);
    },
  });

const interpret = visit;

export default interpret;
