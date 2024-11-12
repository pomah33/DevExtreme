import Button from '../button';
import Navigator from './navigator';
import ViewSwitcher from './viewSwitcher';

const CLASS = {
  toolbar: 'dx-toolbar',
};

export default class Toolbar {
  readonly element: Selector;

  readonly navigator: Navigator;

  readonly viewSwitcher: ViewSwitcher;

  readonly addButton: Button;

  constructor(scheduler: Selector) {
    this.element = scheduler.find(`.${CLASS.toolbar}`);
    this.navigator = new Navigator(this.element);
    this.viewSwitcher = new ViewSwitcher(this.element);
    this.addButton = new Button(this.element.find(`.${Button.className}`).withAttribute('aria-label', 'Add new appointment'));
  }
}
