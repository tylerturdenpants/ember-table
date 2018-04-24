import Controller from '@ember/controller';
import { computed } from '@ember/object';
import EmberObject from '@ember/object';
import { A as emberA } from '@ember/array';

const COLUMN_COUNT = 13;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateRow(title, colCount) {
  let row = EmberObject.create({
    id: title,
    children: []
  });
  for (let j = 0; j < colCount; j++) {
    row.set(ALPHABET[j], ALPHABET[j]);
  }
  return row;
}

export default Controller.extend({
  showTable: true,
  showPanel: false,
  columnCount: COLUMN_COUNT + 1,

  tree: computed('columnCount', function() {
    let colCount = this.get('columnCount');
    let tree = generateRow('Top Row', colCount);

    for (let i = 0; i < 3; i++) {
      let header = generateRow(`Header ${i}`, colCount);

      for (let j = 0; j < 3; j++) {
        let group = generateRow(`Group ${j}`, colCount);

        for (let k = 0; k < 3; k++) {
          group.children.push(generateRow(`Leaf ${k}`, colCount));
        }

        header.children.push(group);
      }

      tree.children.push(header);
    }

    return tree;
  }),

  columns: computed('columnCount', function() {
    let arr = emberA();
    let columnWidth = 180;

    arr.pushObject({
      columnName: 'Column id',
      footerName: 'Column id',
      valuePath: 'id',
      width: columnWidth,
      cellComponent: 'tree-table-grouping-cell'
    });

    for (let j = 0; j < this.get('columnCount'); j++) {
      arr.pushObject({
        columnName: `Col ${ALPHABET[j % 26]}`,
        footerName: `Col ${ALPHABET[j % 26]}`,
        valuePath: ALPHABET[j % 26],
        width: columnWidth,
        isResizable: true,
        isReorderable: true
      });
    }

    return arr;
  }),

  footerRows: computed(function() {
    let footerRows = emberA();
    let row = { id: 'Column Id' };
    for (let j = 0; j < COLUMN_COUNT; j++) {
      row[ALPHABET[j % 26]] = ALPHABET[j % 26];
    }
    footerRows.pushObject(row);
    return footerRows;
  }),

  actions: {
    onCellClicked(cell) {
      if (cell.get('columnIndex') !== 0) {
        cell.set('wasClicked', true);
      }
    },
    addColumn() {
      this.set('columnCount', this.get('columnCount') + 1);
    }
  }
});
