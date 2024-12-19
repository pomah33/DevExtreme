import type { Format } from '@js/common';
import type { ColumnBase } from '@js/common/grids';

import type { DataObject, Key } from '../data_controller/types';

type InheritedColumnProps =
  | 'alignment'
  | 'dataType'
  | 'visible'
  | 'visibleIndex'
  | 'allowReordering'
  | 'trueText'
  | 'falseText'
  | 'caption';

export type Column = Pick<Required<ColumnBase>, InheritedColumnProps> & {
  dataField?: string;

  name: string;

  calculateCellValue: (this: Column, data: DataObject) => unknown;

  calculateDisplayValue: (this: Column, data: DataObject) => unknown;

  format?: Format;

  customizeText?: (this: Column, info: {
    value: unknown;
    valueText: string;
  }) => string;

  editorTemplate?: unknown;

  fieldTemplate?: unknown;
};

export type VisibleColumn = Column & { visible: true };

export interface Cell {
  value: unknown;

  displayValue: unknown;

  text: string;

  column: Column;
}

export interface DataRow {
  cells: Cell[];

  key: Key;

  data: DataObject;
}
