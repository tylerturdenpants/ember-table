import Controller from '@ember/controller';
import TreeNode from '../utils/tree-node';
import LinkedListTree from '../utils/linked-list-tree';
import { computed } from '@ember/object';
import EmberObject from '@ember/object';
import { A as emberA } from '@ember/array';
import { isNone } from '@ember/utils';

const COLUMN_COUNT = 13;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default Controller.extend({
  showTable: true,
  showPanel: false,
  rowToModify: 0,

  getRow(title) {
    let row = EmberObject.create({
      'id': title
    });
    for (let j = 0; j < COLUMN_COUNT; j++) {
      row.set(ALPHABET[j], ALPHABET[j]);
    }
    return row;
  },

  rows: computed(function() {
    let topRow = new TreeNode(null, this.getRow('Top Row'));
    for (let i = 0; i < 10; i++) {
      let header = new TreeNode(topRow, this.getRow(`Header ${i}`));
      for (let j = 0; j < 10; j++) {
        let group = new TreeNode(header, this.getRow(`Group ${j}`));
        for (let k = 0; k < 10; k++) {
          group.addChild(new TreeNode(group, this.getRow(`Leaf ${k}`)));
        }

        header.addChild(group);
      }

      topRow.addChild(header);
    }

    let root = new TreeNode(null, null);
    root.addChild(topRow);

    return new LinkedListTree(root);
  }),

  columns: computed(function() {
    let arr = emberA();
    let columnWidth = 180;

    arr.pushObject({
      columnName: 'Column id',
      footerName: 'Column id',
      valuePath: 'id',
      width: columnWidth,
      cellComponent: 'tree-table-grouping-cell'
    });

    for (let j = 0; j < COLUMN_COUNT; j++) {
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

  rowNum: computed('rowToModify', function() {
    let rowNum = parseInt(this.get('rowToModify'));
    return isNaN(rowNum) ? null : rowNum;
  }),

  actions: {
    onCellClicked(cell) {
      if (cell.get('columnIndex') !== 0) {
        cell.set('wasClicked', true);
      }
    },
    addRow() {
      let rowNum = this.get('rowNum');
      if (isNone(rowNum)) {
        return;
      }
      let tree = this.get('rows');
      let rowVal = this.getRow(`New Leaf at ${rowNum}`);
      tree.add(rowVal, tree.objectAt(rowNum));
    },
    removeRow() {
      let rowNum = this.get('rowNum');
      if (isNone(rowNum)) {
        return;
      }
      let tree = this.get('rows');
      let row = tree.objectAt(rowNum);
      if (!row) {
        return;
      }
      tree.remove(row);
    }
  }
});
