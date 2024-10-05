import * as Runtime from './backend/runtime';
import * as Value from './backend/value';
import Parser from './frontend/parser';
import interpret from './backend/interpreter';
import { Scene } from 'three';

export default function run(text: string, filename: string = '<stdin>') {
  const symbolTable = new Runtime.SymbolTable();
  symbolTable.set('null', Value.NumberValue.Null);
  symbolTable.set('true', Value.NumberValue.True);
  symbolTable.set('false', Value.NumberValue.False);
  symbolTable.set('print', Value.BuiltinFunction.Print);
  symbolTable.set('get', Value.BuiltinFunction.Get);
  symbolTable.set('append', Value.BuiltinFunction.Append);
  symbolTable.set('setBackgroundColor', Value.BuiltinFunction.SetBackgroundColor);
  symbolTable.set('block', Value.BuiltinFunction.Block);
  symbolTable.set('pyramid', Value.BuiltinFunction.Pyramid);

  const parser = new Parser(filename, text);
  const ast = parser.parse();

  const context = Runtime.context('{ program }', symbolTable);

  interpret(context, ast);
}
