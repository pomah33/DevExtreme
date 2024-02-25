/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-classes-per-file */
/* eslint-disable spellcheck/spell-checker */
import type { Callback } from '@js/core/utils/callbacks';
import Callbacks from '@js/core/utils/callbacks';
import { extend } from '@js/core/utils/extend';
import { isDeferred, isDefined, isPromise } from '@js/core/utils/type';

class PromiseDeferred {
  constructor(
    private readonly _deferred: DeferredCls,
  ) {}

  done(handler) {
    return this._handler('resolve', handler);
  }

  fail(handler) {
    return this._handler('reject', handler);
  }

  progress(handler) {
    return this._handler('notify', handler);
  }

  always(handler) {
    return this.done(handler).fail(handler);
  }

  catch(handler) {
    return this.then(null, handler);
  }

  _handler(methodName, handler) {
    if (!handler) return this;

    const callbacks = this._deferred[`${methodName}Callbacks`];
    if (callbacks.fired()) {
      handler.apply(this._deferred[`${methodName}Context`], this._deferred[`${methodName}Args`]);
    } else {
      callbacks.add((context, args) => {
        handler.apply(context, args);
      });
    }
    return this;
  }

  state() {
    return this._deferred._state;
  }

  promise(args) {
    return args ? extend(args, this._deferred._promise) : this._deferred._promise;
  }

  then(resolve, reject) {
    const result = new DeferredObj();

    ['done', 'fail'].forEach((method) => {
      const callback = method === 'done' ? resolve : reject;

      this[method](function () {
        if (!callback) {
          // @ts-expect-error
          result[method === 'done' ? 'resolve' : 'reject'].apply(this, arguments);
          return;
        }

        const callbackResult = callback && callback.apply(this, arguments);
        if (isDeferred(callbackResult)) {
          callbackResult.done(result.resolve).fail(result.reject);
        } else if (isPromise(callbackResult)) {
          callbackResult.then(result.resolve, result.reject);
        } else {
          // @ts-expect-error
          result.resolve.apply(this, isDefined(callbackResult) ? [callbackResult] : arguments);
        }
      });
    });

    return result.promise();
  }
}

class DeferredCls {
  _state: 'pending' | 'resolved' | 'rejected';

  _deferred: DeferredCls;

  _promise: PromiseDeferred;

  resolveCallbacks: Callback;

  rejectCallbacks: Callback;

  notifyCallbacks: Callback;

  constructor() {
    // NOTE: we need this because
    // sometimes PromiseDeferred's _handler method is called with Deferred's context
    this._deferred = this;

    this._state = 'pending';
    this._promise = new PromiseDeferred(this);

    this.resolveCallbacks = Callbacks();
    this.rejectCallbacks = Callbacks();
    this.notifyCallbacks = Callbacks();
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
    this.notify = this.notify.bind(this);
  }

  resolve() {
    return this.resolveWith(this._promise, arguments);
  }

  reject() {
    return this.rejectWith(this._promise, arguments);
  }

  notify() {
    return this.notifyWith(this._promise, arguments);
  }

  done(handler) {
    return this._promise.done.call(this, handler);
  }

  fail(handler) {
    return this._promise.fail.call(this, handler);
  }

  progress(handler) {
    return this._promise.progress.call(this, handler);
  }

  always(handler) {
    return this._promise.always.call(this, handler);
  }

  catch(handler) {
    return this._promise.catch.call(this, handler);
  }

  then(resolve, reject) {
    return this._promise.then.call(this, resolve, reject);
  }

  state() {
    return this._promise.state.call(this);
  }

  promise(args?) {
    return this._promise.promise.call(this, args);
  }

  _handler(methodName, handler) {
    return this._promise._handler.call(this, methodName, handler);
  }

  _methodWith(methodName, state, context, args) {
    const callbacks = this[`${methodName}Callbacks`];

    if (this.state() === 'pending') {
      this[`${methodName}Args`] = args;
      this[`${methodName}Context`] = context;
      if (state) this._state = state;
      callbacks.fire(context, args);
    }

    return this;
  }

  resolveWith(context, args) {
    return this._methodWith('resolve', 'resolved', context, args);
  }

  rejectWith(context, args) {
    return this._methodWith('reject', 'rejected', context, args);
  }

  notifyWith(context, args) {
    return this._methodWith('notify', undefined, context, args);
  }
}

let DeferredObj = DeferredCls;

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

let whenFunc = function () {
  if (arguments.length === 1) {
    return fromPromise(arguments[0]);
  }

  const values: any[] = [].slice.call(arguments);
  const contexts: any[] = [];
  let resolvedCount = 0;
  const deferred = new DeferredObj();

  const updateState = function (i) {
    return function (value) {
      contexts[i] = this;
      values[i] = arguments.length > 1 ? [].slice.call(arguments) : value;
      resolvedCount += 1;
      if (resolvedCount === values.length) {
        deferred.resolveWith(contexts, values);
      }
    };
  };

  for (let i = 0; i < values.length; i += 1) {
    if (isDeferred(values[i])) {
      values[i].promise()
        .done(updateState(i))
        .fail(deferred.reject);
    } else {
      resolvedCount += 1;
    }
  }

  if (resolvedCount === values.length) {
    deferred.resolveWith(contexts, values);
  }

  return deferred.promise();
};

export function setStrategy(value) {
  DeferredObj = value.Deferred;
  whenFunc = value.when;
}

export function Deferred() {
  return new DeferredObj();
}

export function when() {
  // @ts-expect-error
  return whenFunc.apply(this, arguments);
}
