import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { click } from 'ember-native-dom-helpers';
import TablePage from 'ember-table/test-support/pages/ember-table';
import { A } from '@ember/array';
import RSVP from 'rsvp';

async function rafFinished() {
  return new RSVP.Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function tableData() {
  return {
    rows: [
      { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
      { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
      { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
    ],
    columns: [
      { name: 'A', valuePath: 'A', width: 180 },
      { name: 'B', valuePath: 'B', width: 180 },
      { name: 'C', valuePath: 'C', width: 180 },
      { name: 'D', valuePath: 'D', width: 180 },
    ],
    newColumn: { name: 'E', valuePath: 'E', width: 180 },
  };
}

function sumHeaderWidths(table) {
  return table.headers.map(h => h.width).reduce((sum, w) => sum + w, 0);
}

async function renderTable(context) {
  await context.render(hbs`
    <button id="add-column" {{action 'addColumn'}}>Add Column</button>
    <button id="remove-column" {{action 'removeColumn'}}>Remove Column</button>
    {{#ember-table data-test-ember-table=true as |t|}}
      {{#t.head
        widthConstraint='eq-container'
        columns=columns as |h|}}
        {{#h.row as |r|}}
        {{r.cell}}
        {{/h.row}}
      {{/t.head}}

      {{#t.body rows=rows as |b|}}
        {{#b.row as |r|}}
        {{#r.cell as |cellValue|}}
            {{cellValue}}
        {{/r.cell}}
        {{/b.row}}
      {{/t.body}}
    {{/ember-table}}
    `);

  await rafFinished();
}

async function testColumnRemovals(assert, table) {
  let originalWidth = table.width;
  let originalContainerWidth = table.containerWidth;

  let currentColumnCount = table.headers.length;
  assert.equal(currentColumnCount, 4, 'precond - 4 columns');
  assert.equal(sumHeaderWidths(table), originalWidth, 'precond - headers sum to table width');
  assert.equal(
    originalWidth,
    originalContainerWidth,
    'precond - table is as wide as its container'
  );

  while (currentColumnCount > 1) {
    await click('button#remove-column');
    assert.equal(
      table.headers.length,
      currentColumnCount - 1,
      `column count changes from ${currentColumnCount} -> ${currentColumnCount - 1}`
    );
    currentColumnCount -= 1;

    assert.equal(
      table.width,
      originalWidth,
      `table width is same after removal of column #${currentColumnCount}.`
    );
    assert.equal(
      table.containerWidth,
      originalContainerWidth,
      `new table container is same size as original container after removal of column #${currentColumnCount}.`
    );
    assert.equal(
      sumHeaderWidths(table),
      originalWidth,
      `headers sum to table width after removal of column #${currentColumnCount}`
    );
    assert.equal(
      table.width,
      table.containerWidth,
      `new table width is as wide as its container after removal of column #${currentColumnCount}.`
    );
  }
}

async function testColumnAddition(assert, table) {
  let originalWidth = table.width;
  let originalContainerWidth = table.containerWidth;

  let currentColumnCount = table.headers.length;
  assert.equal(currentColumnCount, 4, 'precond - 4 columns');
  assert.equal(sumHeaderWidths(table), originalWidth, 'precond - headers sum to table width');
  assert.equal(
    originalWidth,
    originalContainerWidth,
    'precond - table is as wide as its container'
  );

  await click('#add-column');
  assert.equal(table.headers.length, 5, 'column is added');
  assert.equal(sumHeaderWidths(table), originalWidth, 'headers sum to table width after adding');
  assert.equal(table.width, originalWidth, 'table width is unchanged');
  assert.equal(table.containerWidth, originalContainerWidth, 'table container width is unchanged');
}

moduleForComponent('ember-thead', '[Unit] ember-thead', { integration: true });

test('table resizes when columns are removed', async function(assert) {
  let data = tableData();
  this.set('rows', data.rows);
  this.set('columns', data.columns);
  this.on('removeColumn', function() {
    this.set('columns', this.get('columns').slice(0, -1));
  });

  await renderTable(this);
  await testColumnRemovals(assert, new TablePage());
});

test('table resizes when columns are removed via mutation', async function(assert) {
  let data = tableData();
  this.set('rows', data.rows);
  this.set('columns', A(data.columns));
  this.on('removeColumn', function() {
    this.get('columns').popObject();
  });

  await renderTable(this);
  await testColumnRemovals(assert, new TablePage());
});

test('table resizes when columns are added', async function(assert) {
  let data = tableData();
  this.set('rows', data.rows);
  this.set('columns', data.columns);
  this.on('addColumn', function() {
    this.set('columns', [...data.columns, data.newColumn]);
  });

  await renderTable(this);
  await testColumnAddition(assert, new TablePage());
});

test('table resizes when columns are added via mutation', async function(assert) {
  let data = tableData();
  this.set('rows', data.rows);
  this.set('columns', A(data.columns));
  this.on('addColumn', function() {
    this.get('columns').pushObject(data.newColumn);
  });

  await renderTable(this);
  await testColumnAddition(assert, new TablePage());
});
