import { Position } from '../frontend/utils';
import Value from './value';

export class SymbolTable {
  private symbols = new Map<string, Value>();

  constructor(private parent?: SymbolTable) {}

  set(key: string, value: Value) {
    this.symbols.set(key, value);
  }

  get(key: string): Value | undefined {
    const value = this.symbols.get(key);

    if (value === undefined && this.parent !== undefined) {
      return this.parent.get(key);
    }

    return value;
  }

  // delete(key: string) {
  //   return this.symbols.delete(key);
  // }
}

export interface Context {
  name: string;
  symbolTable: SymbolTable;
  parent?: Context;
  parentPos?: Position;
}

export function context(name_: string, symbolTable: SymbolTable, parent?: Context, parentPos?: Position): Context {
  return { name: name_, parent, parentPos, symbolTable };
}

export function defaultContext() {
  return context('', new SymbolTable());
}
