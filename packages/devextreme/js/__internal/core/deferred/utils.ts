/* eslint-disable func-names */
/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { isDeferred, isPromise } from '@js/core/utils/type';

import { DeferredObj } from './strategy';

export function fromPromise(promise, context?) {
  if (isDeferred(promise)) {
    return promise;
  } if (isPromise(promise)) {
    const d = new DeferredObj();
    promise.then(function () {
      // @ts-expect-error
      d.resolveWith.apply(d, [context].concat([[].slice.call(arguments)]));
    }, function () {
      // @ts-expect-error
      d.rejectWith.apply(d, [context].concat([[].slice.call(arguments)]));
    });
    return d;
  }

  return new DeferredObj().resolveWith(context, [promise]);
}
