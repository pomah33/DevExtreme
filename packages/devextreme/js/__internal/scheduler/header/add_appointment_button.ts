import messageLocalization from '@js/localization/message';
import type { Properties as ButtonProperties } from '@js/ui/button';
import type { Item } from '@js/ui/toolbar';

export interface Properties {
  onClick: () => void;

  defaultProps: Partial<Item>;
}

export function getAddAppointmentButton(props: Properties): Item {
  return {
    widget: 'dxButton',
    showText: 'inMenu',
    location: 'after',
    locateInMenu: 'auto',
    ...props.defaultProps,
    options: {
      icon: 'add',
      text: messageLocalization.format('dxScheduler-addAppointment'),
      onClick: props.onClick,
      ...props.defaultProps.options,
    } satisfies ButtonProperties,
  };
}
