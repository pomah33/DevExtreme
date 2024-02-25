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

export let DeferredObj = DeferredCls;
export let whenFunc = whenImpl;

export function setStrategy(value: { Deferred: typeof DeferredCls; when: typeof whenImpl }): void {
  DeferredObj = value.Deferred;
  whenFunc = value.when;
}

export function Deferred(): DeferredCls {
  return new DeferredObj();
}

export function when() {
  // @ts-expect-error
  return whenFunc.apply(this, arguments);
}
