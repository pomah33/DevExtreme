/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable no-void */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import '@js/events/click';
import '@js/events/core/emitter.feedback';
import '@js/events/hover';

import Action from '@js/core/action';
import devices from '@js/core/devices';
import $ from '@js/core/renderer';
import { deferRender } from '@js/core/utils/common';
import { extend } from '@js/core/utils/extend';
import { each } from '@js/core/utils/iterator';
import { isDefined, isPlainObject } from '@js/core/utils/type';
import { compare as compareVersions } from '@js/core/utils/version';
import {
  active, focus, hover, keyboard,
} from '@js/events/short';
import { focusable as focusableSelector } from '@js/ui/widget/selectors';
import type WidgetPublic from '@js/ui/widget/ui.widget';
import type { WidgetOptions } from '@js/ui/widget/ui.widget';

import DOMComponent from './dom_component';

function setAttribute(name, value, target) {
  name = name === 'role' || name === 'id' ? name : `aria-${name}`;
  value = isDefined(value) ? value.toString() : null;

  target.attr(name, value);
}

class Widget<TProperties extends WidgetOptions<unknown>> extends DOMComponent<TProperties> implements WidgetPublic<TProperties> {
  private readonly _feedbackHideTimeout = 400;

  private readonly _feedbackShowTimeout = 30;

  private _contentReadyAction: any;

  private readonly _activeStateUnit: any;

  private _keyboardListenerId: any;

  private _isReady: any;

  static getOptionsFromContainer({ name, fullName, value }) {
    let options = {};

    if (name === fullName) {
      options = value;
    } else {
      const option = fullName.split('.').pop();

      options[option] = value;
    }

    return options;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _supportedKeys(event?) {
    return {};
  }

  _getDefaultOptions() {
    return extend(super._getDefaultOptions(), {
      hoveredElement: null,
      isActive: false,

      disabled: false,

      visible: true,

      hint: undefined,

      activeStateEnabled: false,

      onContentReady: null,

      hoverStateEnabled: false,

      focusStateEnabled: false,

      tabIndex: 0,

      accessKey: undefined,

      onFocusIn: null,

      onFocusOut: null,
      onKeyboardHandled: null,
      ignoreParentReadOnly: false,
      useResizeObserver: true,
    });
  }

  _defaultOptionsRules() {
    return super._defaultOptionsRules().concat([{
      device() {
        const device = devices.real();
        const { platform } = device;
        const { version } = device;
        return platform === 'ios' && compareVersions(version, '13.3') <= 0;
      },
      options: {
        useResizeObserver: false,
      },
    }]);
  }

  _init() {
    super._init();
    this._initContentReadyAction();
  }

  _innerWidgetOptionChanged(innerWidget, args) {
    const options = Widget.getOptionsFromContainer(args);
    innerWidget && innerWidget.option(options);
    this._options.cache(args.name, options);
  }

  _bindInnerWidgetOptions(innerWidget, optionsContainer) {
    const syncOptions = () => this._options.silent(optionsContainer, extend({}, innerWidget.option()));

    syncOptions();
    innerWidget.on('optionChanged', syncOptions);
  }

  _getAriaTarget() {
    return this._focusTarget();
  }

  _initContentReadyAction() {
    this._contentReadyAction = this._createActionByOption('onContentReady', {
      excludeValidators: ['disabled', 'readOnly'],
    });
  }

  _initMarkup() {
    const { disabled, visible } = this.option();

    this.$element().addClass('dx-widget');

    this._toggleDisabledState(disabled);
    this._toggleVisibility(visible);
    this._renderHint();
    this._isFocusable() && this._renderFocusTarget();

    super._initMarkup();
  }

  _render() {
    super._render();

    this._renderContent();
    this._renderFocusState();
    this._attachFeedbackEvents();
    this._attachHoverEvents();
    this._toggleIndependentState();
  }

  _renderHint() {
    const { hint } = this.option();

    this.$element().attr('title', hint || null);
  }

  _renderContent() {
    deferRender(() => (!this._disposed ? this._renderContentImpl() : void 0))
      // @ts-expect-error
      .done(() => (!this._disposed ? this._fireContentReadyAction() : void 0));
  }

  _renderContentImpl() {}

  _fireContentReadyAction() {
    return deferRender(() => this._contentReadyAction());
  }

  _dispose() {
    this._contentReadyAction = null;
    this._detachKeyboardEvents();

    super._dispose();
  }

  _resetActiveState() {
    this._toggleActiveState(this._eventBindingTarget(), false);
  }

  _clean() {
    this._cleanFocusState();
    this._resetActiveState();
    super._clean();
    this.$element().empty();
  }

  _toggleVisibility(visible) {
    this.$element().toggleClass('dx-state-invisible', !visible);
  }

  _renderFocusState() {
    this._attachKeyboardEvents();

    if (this._isFocusable()) {
      this._renderFocusTarget();
      this._attachFocusEvents();
      this._renderAccessKey();
    }
  }

  _renderAccessKey() {
    const $el = this._focusTarget();
    const { accessKey } = this.option();

    $el.attr('accesskey', accessKey);
  }

  _isFocusable() {
    const { focusStateEnabled, disabled } = this.option();

    return focusStateEnabled && !disabled;
  }

  _eventBindingTarget() {
    return this.$element();
  }

  _focusTarget() {
    return this._getActiveElement();
  }

  _isFocusTarget(element) {
    const focusTargets = $(this._focusTarget()).toArray();
    return focusTargets.includes(element);
  }

  _findActiveTarget($element) {
    return $element.find(this._activeStateUnit).not('.dx-state-disabled');
  }

  _getActiveElement() {
    const activeElement = this._eventBindingTarget();

    if (this._activeStateUnit) {
      return this._findActiveTarget(activeElement);
    }

    return activeElement;
  }

  _renderFocusTarget() {
    const { tabIndex } = this.option();

    this._focusTarget().attr('tabIndex', tabIndex);
  }

  _keyboardEventBindingTarget() {
    return this._eventBindingTarget();
  }

  _refreshFocusEvent() {
    this._detachFocusEvents();
    this._attachFocusEvents();
  }

  _focusEventTarget() {
    return this._focusTarget();
  }

  _focusInHandler(event) {
    if (!event.isDefaultPrevented()) {
      this._createActionByOption('onFocusIn', {
        beforeExecute: () => this._updateFocusState(event, true),
        excludeValidators: ['readOnly'],
      })({ event });
    }
  }

  _focusOutHandler(event) {
    if (!event.isDefaultPrevented()) {
      this._createActionByOption('onFocusOut', {
        beforeExecute: () => this._updateFocusState(event, false),
        excludeValidators: ['readOnly', 'disabled'],
      })({ event });
    }
  }

  _updateFocusState({ target }, isFocused) {
    if (this._isFocusTarget(target)) {
      this._toggleFocusClass(isFocused, $(target));
    }
  }

  _toggleFocusClass(isFocused, $element?) {
    const $focusTarget = $element && $element.length ? $element : this._focusTarget();

    $focusTarget.toggleClass('dx-state-focused', isFocused);
  }

  _hasFocusClass(element?) {
    const $focusTarget = $(element || this._focusTarget());

    return $focusTarget.hasClass('dx-state-focused');
  }

  _isFocused() {
    return this._hasFocusClass();
  }

  _getKeyboardListeners(): any[] {
    return [];
  }

  _attachKeyboardEvents() {
    this._detachKeyboardEvents();

    const { focusStateEnabled, onKeyboardHandled } = this.option();
    const hasChildListeners = this._getKeyboardListeners().length;
    const hasKeyboardEventHandler = !!onKeyboardHandled;
    const shouldAttach = focusStateEnabled || hasChildListeners || hasKeyboardEventHandler;

    if (shouldAttach) {
      this._keyboardListenerId = keyboard.on(
        this._keyboardEventBindingTarget(),
        this._focusTarget(),
        (opts) => this._keyboardHandler(opts),
      );
    }
  }

  _keyboardHandler(options, onlyChildProcessing?) {
    if (!onlyChildProcessing) {
      const { originalEvent, keyName, which } = options;
      const keys = this._supportedKeys(originalEvent);
      const func = keys[keyName] || keys[which];

      if (func !== undefined) {
        const handler = func.bind(this);
        const result = handler(originalEvent, options);

        if (!result) {
          return false;
        }
      }
    }

    const keyboardListeners = this._getKeyboardListeners();
    const { onKeyboardHandled } = this.option();

    keyboardListeners.forEach((listener) => listener && listener._keyboardHandler(options));

    onKeyboardHandled && onKeyboardHandled(options);

    return true;
  }

  _refreshFocusState() {
    this._cleanFocusState();
    this._renderFocusState();
  }

  _cleanFocusState() {
    const $element = this._focusTarget();

    $element.removeAttr('tabIndex');
    this._toggleFocusClass(false);
    this._detachFocusEvents();
    this._detachKeyboardEvents();
  }

  _detachKeyboardEvents() {
    keyboard.off(this._keyboardListenerId);
    this._keyboardListenerId = null;
  }

  _attachHoverEvents() {
    const { hoverStateEnabled } = this.option();
    const selector = this._activeStateUnit;
    const namespace = 'UIFeedback';
    const $el = this._eventBindingTarget();

    hover.off($el, { selector, namespace });

    if (hoverStateEnabled) {
      hover.on($el, new Action(({ event, element }) => {
        this._hoverStartHandler(event);
        this.option('hoveredElement', $(element));
      }, { excludeValidators: ['readOnly'] }), (event) => {
        this.option('hoveredElement', null);
        this._hoverEndHandler(event);
      }, { selector, namespace });
    }
  }

  _attachFeedbackEvents() {
    const { activeStateEnabled } = this.option();
    const selector = this._activeStateUnit;
    const namespace = 'UIFeedback';
    const $el = this._eventBindingTarget();

    active.off($el, { namespace, selector });

    if (activeStateEnabled) {
      active.on(
        $el,
        new Action(({ event, element }) => this._toggleActiveState($(element), true, event)),
        new Action(
          ({ event, element }) => this._toggleActiveState($(element), false, event),
          { excludeValidators: ['disabled', 'readOnly'] },
        ),
        {
          showTimeout: this._feedbackShowTimeout,
          hideTimeout: this._feedbackHideTimeout,
          selector,
          namespace,
        },
      );
    }
  }

  _detachFocusEvents() {
    const $el = this._focusEventTarget();

    focus.off($el, { namespace: `${this.NAME}Focus` });
  }

  _attachFocusEvents() {
    const $el = this._focusEventTarget();

    focus.on(
      $el,
      (e) => this._focusInHandler(e),
      (e) => this._focusOutHandler(e),
      {
        namespace: `${this.NAME}Focus`,
        // @ts-expect-error
        isFocusable: (index, el) => $(el).is(focusableSelector),
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hoverStartHandler(event) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hoverEndHandler(event) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _toggleActiveState($element, value, event?) {
    this.option('isActive', value);
    $element.toggleClass('dx-state-active', value);
  }

  _updatedHover() {
    const hoveredElement = this._options.silent('hoveredElement');

    this._hover(hoveredElement, hoveredElement);
  }

  _findHoverTarget($el) {
    return $el && $el.closest(this._activeStateUnit || this._eventBindingTarget());
  }

  _hover($el, $previous) {
    const { hoverStateEnabled, disabled, isActive } = this.option();

    $previous = this._findHoverTarget($previous);
    $previous && $previous.toggleClass('dx-state-hover', false);

    if ($el && hoverStateEnabled && !disabled && !isActive) {
      const newHoveredElement = this._findHoverTarget($el);

      newHoveredElement && newHoveredElement.toggleClass('dx-state-hover', true);
    }
  }

  _toggleDisabledState(value) {
    this.$element().toggleClass('dx-state-disabled', Boolean(value));
    this.setAria('disabled', value || undefined);
  }

  _toggleIndependentState() {
    this.$element().toggleClass('dx-state-independent', this.option('ignoreParentReadOnly'));
  }

  _setWidgetOption(widgetName, args) {
    if (!this[widgetName]) {
      return;
    }

    if (isPlainObject(args[0])) {
      each(args[0], (option, value) => this._setWidgetOption(widgetName, [option, value]));

      return;
    }

    const optionName = args[0];
    let value = args[1];

    if (args.length === 1) {
      value = this.option(optionName);
    }

    const widgetOptionMap = this[`${widgetName}OptionMap`];

    this[widgetName].option(widgetOptionMap ? widgetOptionMap(optionName) : optionName, value);
  }

  _optionChanged(args) {
    const { name, value, previousValue } = args;

    switch (name) {
      case 'disabled':
        this._toggleDisabledState(value);
        this._updatedHover();
        this._refreshFocusState();
        break;
      case 'hint':
        this._renderHint();
        break;
      case 'ignoreParentReadOnly':
        this._toggleIndependentState();
        break;
      case 'activeStateEnabled':
        this._attachFeedbackEvents();
        break;
      case 'hoverStateEnabled':
        this._attachHoverEvents();
        this._updatedHover();
        break;
      case 'tabIndex':
      case 'focusStateEnabled':
        this._refreshFocusState();
        break;
      case 'onFocusIn':
      case 'onFocusOut':
      case 'useResizeObserver':
        break;
      case 'accessKey':
        this._renderAccessKey();
        break;
      case 'hoveredElement':
        this._hover(value, previousValue);
        break;
      case 'isActive':
        this._updatedHover();
        break;
      case 'visible':
        this._toggleVisibility(value);
        if (this._isVisibilityChangeSupported()) {
          // TODO hiding works wrong
          this._checkVisibilityChanged(value ? 'shown' : 'hiding');
        }
        break;
      case 'onKeyboardHandled':
        this._attachKeyboardEvents();
        break;
      case 'onContentReady':
        this._initContentReadyAction();
        break;
      default:
        super._optionChanged(args);
    }
  }

  _isVisible() {
    const { visible } = this.option();

    return super._isVisible() && visible;
  }

  beginUpdate() {
    this._ready(false);
    super.beginUpdate();
  }

  endUpdate() {
    super.endUpdate();

    if (this._initialized) {
      this._ready(true);
    }
  }

  _ready(value?) {
    if (arguments.length === 0) {
      return this._isReady;
    }

    this._isReady = value;
  }

  setAria(...args) {
    if (!isPlainObject(args[0])) {
      setAttribute(args[0], args[1], args[2] || this._getAriaTarget());
    } else {
      const target = args[1] || this._getAriaTarget();

      each(args[0], (name, value) => setAttribute(name, value, target));
    }
  }

  isReady() {
    return this._ready();
  }

  repaint() {
    this._refresh();
  }

  focus() {
    focus.trigger(this._focusTarget());
  }

  registerKeyHandler(key, handler) {
    const currentKeys = this._supportedKeys();

    this._supportedKeys = () => extend(currentKeys, { [key]: handler });
  }
}

export default Widget;
