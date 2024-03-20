/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/no-cycle */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-mutable-exports */
import { DeferredCls, whenImpl } from './implementation';

let DeferredObj = DeferredCls;
let whenFunc = whenImpl;

export type {
  DeferredCls as DeferredObj,
};

export function setStrategy(value: { Deferred: typeof DeferredCls; when: typeof whenImpl }): void {
  DeferredObj = value.Deferred;
  whenFunc = value.when;
}

export function Deferred<T = void, TArgs extends any[] = []>(): DeferredCls<T, TArgs> {
  return new DeferredObj();
}

export function when(...args: any[]) {
  // @ts-expect-error
  return whenFunc.apply(this, arguments);
}
