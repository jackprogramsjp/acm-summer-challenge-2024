import { Position, RuntimeError, defaultPosition } from '../frontend/utils';
import * as Runtime from './runtime';
import * as globalScene from '../globalScene.ts';
import * as THREE from 'three';
import { scene } from '../globalScene.ts';

export interface ValueContext {
  name: string;
}

export abstract class Value {
  protected constructor(
    public startPos: Position,
    public endPos: Position,
    public context: Runtime.Context,
  ) {}

  public setPosition(startPos: Position, endPos: Position) {
    this.startPos = startPos;
    this.endPos = endPos;
    return this;
  }

  public setContext(context: Runtime.Context) {
    this.context = context;
    return this;
  }

  add(other: Value): Value {
    throw this.illegal(other);
  }
  sub(other: Value): Value {
    throw this.illegal(other);
  }
  mul(other: Value): Value {
    throw this.illegal(other);
  }
  div(other: Value): Value {
    throw this.illegal(other);
  }
  pow(other: Value): Value {
    throw this.illegal(other);
  }
  not(other: Value): Value {
    throw this.illegal(other);
  }
  eq(other: Value): Value {
    throw this.illegal(other);
  }
  ne(other: Value): Value {
    throw this.illegal(other);
  }
  lt(other: Value): Value {
    throw this.illegal(other);
  }
  lte(other: Value): Value {
    throw this.illegal(other);
  }
  gt(other: Value): Value {
    throw this.illegal(other);
  }
  gte(other: Value): Value {
    throw this.illegal(other);
  }
  and(other: Value): Value {
    throw this.illegal(other);
  }
  or(other: Value): Value {
    throw this.illegal(other);
  }
  execute(args: Value[]): Value {
    throw this.illegal();
  }

  abstract clone(): Value;
  abstract toString(): string;

  protected illegal(other?: Value) {
    if (other === undefined) other = this;

    return new RuntimeError(this.startPos, other.endPos, 'operation done is illegal', this.context);
  }
}

export class NumberValue extends Value {
  public static Null = new NumberValue(0, defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static False = new NumberValue(0, defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static True = new NumberValue(1, defaultPosition(), defaultPosition(), Runtime.defaultContext());

  constructor(
    public value: number,
    startPos: Position,
    endPos: Position,
    context: Runtime.Context,
  ) {
    super(startPos, endPos, context);
  }

  private throwIfNotNumber(other: Value): asserts other is NumberValue {
    if (!(other instanceof NumberValue)) throw this.illegal(other);
  }

  add(other: Value): Value {
    this.throwIfNotNumber(other);
    return new NumberValue(this.value + other.value, defaultPosition(), defaultPosition(), this.context);
  }

  sub(other: Value): Value {
    this.throwIfNotNumber(other);
    return new NumberValue(this.value - other.value, defaultPosition(), defaultPosition(), this.context);
  }
  mul(other: Value): Value {
    this.throwIfNotNumber(other);
    return new NumberValue(this.value * other.value, defaultPosition(), defaultPosition(), this.context);
  }

  div(other: Value): Value {
    this.throwIfNotNumber(other);

    if (other.value === 0) {
      throw new RuntimeError(other.startPos, other.endPos, 'Dividing by zero is illegal', this.context);
    }

    return new NumberValue(this.value / other.value, defaultPosition(), defaultPosition(), this.context);
  }

  pow(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(Math.pow(this.value, other.value), defaultPosition(), defaultPosition(), this.context);
  }

  not(): Value {
    return new NumberValue(this.value === 0 ? 1 : 0, defaultPosition(), defaultPosition(), this.context);
  }

  eq(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value === other.value), defaultPosition(), defaultPosition(), this.context);
  }
  ne(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value !== other.value), defaultPosition(), defaultPosition(), this.context);
  }
  lt(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value < other.value), defaultPosition(), defaultPosition(), this.context);
  }
  lte(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value <= other.value), defaultPosition(), defaultPosition(), this.context);
  }
  gt(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value > other.value), defaultPosition(), defaultPosition(), this.context);
  }
  gte(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value >= other.value), defaultPosition(), defaultPosition(), this.context);
  }
  and(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value && other.value), defaultPosition(), defaultPosition(), this.context);
  }
  or(other: Value): Value {
    this.throwIfNotNumber(other);

    return new NumberValue(+(this.value || other.value), defaultPosition(), defaultPosition(), this.context);
  }

  public clone() {
    const clone = new NumberValue(this.value, this.startPos, this.endPos, this.context);
    return clone;
  }

  public toString = () => this.value.toString();
}

export class StringValue extends Value {
  constructor(
    public value: string,
    startPos: Position,
    endPos: Position,
    context: Runtime.Context,
  ) {
    super(startPos, endPos, context);
  }

  private throwIfNotString(other: Value): asserts other is StringValue {
    if (!(other instanceof StringValue)) throw this.illegal(other);
  }

  private throwIfNotNumber(other: Value): asserts other is NumberValue {
    if (!(other instanceof NumberValue)) throw this.illegal(other);
  }

  add(other: Value): Value {
    this.throwIfNotString(other);

    return new StringValue(this.value + other.value, defaultPosition(), defaultPosition(), this.context);
  }

  mul(other: Value): Value {
    this.throwIfNotNumber(other);

    return new StringValue(this.value.repeat(other.value), defaultPosition(), defaultPosition(), this.context);
  }

  public clone() {
    return new StringValue(this.value, this.startPos, this.endPos, this.context);
  }

  public toString = () => this.value;
}

export class ListValue extends Value {
  constructor(
    public value: Array<Value>,
    startPos: Position,
    endPos: Position,
    context: Runtime.Context,
  ) {
    super(startPos, endPos, context);
  }

  private throwIfNotNumber(other: Value): asserts other is NumberValue {
    if (!(other instanceof NumberValue)) throw this.illegal(other);
  }

  add(other: Value): Value {
    if (!(other instanceof ListValue)) {
      throw new RuntimeError(other.startPos, other.endPos, 'To concatenate, must add a list', this.context);
    }

    const clonedList = this.clone() as ListValue;
    clonedList.value.push(...other.value);

    return clonedList;
  }

  clone() {
    const clone = new ListValue(this.value, this.startPos, this.endPos, this.context);
    return clone;
  }

  toString() {
    return `[${this.value.join(', ')}]`;
  }
}

export class BuiltinFunction extends Value {
  public static Print = new BuiltinFunction('print', defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static Get = new BuiltinFunction('get', defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static Append = new BuiltinFunction('append', defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static SetBackgroundColor = new BuiltinFunction('setBackgroundColor', defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static Block = new BuiltinFunction('block', defaultPosition(), defaultPosition(), Runtime.defaultContext());
  public static Pyramid = new BuiltinFunction('pyramid', defaultPosition(), defaultPosition(), Runtime.defaultContext());

  constructor(
    private name: string,
    startPos: Position,
    endPos: Position,
    context: Runtime.Context,
  ) {
    super(startPos, endPos, context);
  }

  private executions: { [name: string]: [string[], (context: Runtime.Context) => Value] } = {
    print: [
      ['value'],
      (context: Runtime.Context) => {
        console.log(context.symbolTable.get('value')!.toString());
        return NumberValue.Null;
      },
    ],
    get: [
      ['list', 'index'],
      (context: Runtime.Context) => {
        const list = context.symbolTable.get('list')!;

        if (!(list instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 must be list', context);
        }

        const index = context.symbolTable.get('index')!;

        if (!(index instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 must be number', context);
        }

        try {
          return list.value[index.value];
        } catch (e) {
          throw new RuntimeError(this.startPos, this.endPos, `Failed to index: ${e}`, context);
        }
      },
    ],
    append: [
      ['list', 'value'],
      (context: Runtime.Context) => {
        const list = context.symbolTable.get('list')!;

        if (!(list instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 must be list', context);
        }

        try {
          const clonedList = list.clone();
          clonedList.value.push(context.symbolTable.get('value')!);
          return clonedList;
        } catch (e) {
          throw new RuntimeError(this.startPos, this.endPos, `Failed to index: ${e}`, context);
        }
      },
    ],
    setBackgroundColor: [
      ['color'],
      (context: Runtime.Context) => {
        const color = context.symbolTable.get('color')!;

        if (!(color instanceof StringValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 must be string', context);
        }

        try {
          globalScene.scene.background = new THREE.Color(color.value);
          return NumberValue.Null;
        } catch (e) {
          throw new RuntimeError(this.startPos, this.endPos, `Failed to set background color: ${e}`, context);
        }
      },
    ],
    block: [
      ['listWidthHeightDepth', 'listXYZ', 'color'],
      (context: Runtime.Context) => {
        const listWidthHeightDepth = context.symbolTable.get('listWidthHeightDepth')!;
        const listXYZ = context.symbolTable.get('listXYZ')!;

        if (!(listWidthHeightDepth instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 must be a list', context);
        }

        if (!(listXYZ instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 must be a list', context);
        }

        const [ width, height, depth ] = listWidthHeightDepth.value;

        if (!(width instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 0 must be number', context);
        }

        if (!(height instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 1 must be number', context);
        }

        if (!(depth instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 2 must be number', context);
        }

        const [ x, y, z ] = listXYZ.value;

        if (!(x instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 0 must be number', context);
        }

        if (!(y instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 1 must be number', context);
        }

        if (!(z instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 2 must be number', context);
        }

        const color = context.symbolTable.get('color')!;

        if (!(color instanceof StringValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #4 must be string', context);
        }

        try {
          const geometry = new THREE.BoxGeometry(width.value, height.value, depth.value);
          const material = new THREE.MeshBasicMaterial( { color: color.value } );
          const block = new THREE.Mesh(geometry, material);
          block.position.set(x.value, y.value, z.value);

          globalScene.scene.add(block);

          return NumberValue.Null;
        } catch (e) {
          throw new RuntimeError(this.startPos, this.endPos, `Failed to create block: ${e}`, context);
        }
      },
    ],
    pyramid: [
      ['listRadiusHeightRadialSegments', 'listXYZ', 'color'],
      (context: Runtime.Context) => {
        const listRadiusHeightRadialSegments = context.symbolTable.get('listRadiusHeightRadialSegments')!;
        const listXYZ = context.symbolTable.get('listXYZ')!;

        if (!(listRadiusHeightRadialSegments instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 must be a list', context);
        }

        if (!(listXYZ instanceof ListValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 must be a list', context);
        }

        const [ radius, height, radialSegments ] = listRadiusHeightRadialSegments.value;

        if (!(radius instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 0 must be number', context);
        }

        if (!(height instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 1 must be number', context);
        }

        if (!(radialSegments instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #1 index 2 must be number', context);
        }

        const [ x, y, z ] = listXYZ.value;

        if (!(x instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 0 must be number', context);
        }

        if (!(y instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 1 must be number', context);
        }

        if (!(z instanceof NumberValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #2 index 2 must be number', context);
        }

        const color = context.symbolTable.get('color')!;

        if (!(color instanceof StringValue)) {
          throw new RuntimeError(this.startPos, this.endPos, 'Argument #4 must be string', context);
        }

        try {
          const geometry = new THREE.ConeGeometry(radius.value, height.value, radialSegments.value);
          const material = new THREE.MeshBasicMaterial( { color: color.value } );
          const pyramid = new THREE.Mesh(geometry, material);
          pyramid.position.set(x.value, y.value, z.value);

          globalScene.scene.add(pyramid);

          return NumberValue.Null;
        } catch (e) {
          throw new RuntimeError(this.startPos, this.endPos, `Failed to create pyramid: ${e}`, context);
        }
      },
    ],
  };

  private cloneContext() {
    const parentContext = this.context;
    const context = Runtime.context(this.name, parentContext.symbolTable, parentContext, this.startPos);

    return context;
  }

  execute(args: Value[]): Value {
    const context = this.cloneContext();
    const [argIdentifiers, func] = this.executions[this.name];

    if (args.length < argIdentifiers.length) {
      throw new RuntimeError(this.startPos, this.endPos, `not enough arguments passed into ${this}`, this.context);
    }

    if (args.length > argIdentifiers.length) {
      throw new RuntimeError(this.startPos, this.endPos, `too many arguments passed into ${this}`, this.context);
    }

    for (let i = 0; i < args.length; i++) {
      const argIdentifier = argIdentifiers[i];
      const argValue = args[i];
      argValue.setContext(context);
      context.symbolTable.set(argIdentifier, argValue);
    }

    return func(context);
  }

  clone() {
    return new BuiltinFunction(this.name, this.startPos, this.endPos, this.context);
  }

  toString() {
    return `[function ${this.name}]`;
  }
}

export default Value;
