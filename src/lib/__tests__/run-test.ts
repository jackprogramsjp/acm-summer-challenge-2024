import run from '../runner';

it(`check runtime output`, () => {
  try {
    run(`let x = [2, 3]; print(x); append(x, 5); print(x);`);
  } catch (e) {
    console.error(`${e}`);
  }
});
