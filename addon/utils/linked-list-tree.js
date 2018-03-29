import EmberObject, { set } from '@ember/object';
import { isEmpty } from '@ember/utils';

import TreeNode from './tree-node';

export default class LinkedListTree extends EmberObject {
  pointerNode = null;
  pointerIndex = -1;

  /**
   * When a node is collapsed, this map stores list of previous nodes for the node next to the
   * collapsed node. This is used to retrieve correct previous node upon node expansion.
   */
  _previousNodes = null;
  _root = null;

  constructor(root) {
    super();

    root.updateNext(null);
    root.updateNodeCountAndIndex(-1);
    root.updateDepth(-1);

    this.pointerIndex = 0;
    // Root is a virtual node and will not be used for display
    if (root.children.length > 0) {
      this.pointerNode = root.children[0];
    }

    this.set('length', root.nodeCount - 1);

    this._previousNodes = new WeakMap();
    this._root = root;
  }

  objectAt(index) {
    let direction = this.pointerIndex < index ? 1 : -1;
    while (index !== this.pointerIndex) {
      this.pointerNode = this.pointerNode.nextWithDirection(direction);
      this.pointerIndex += direction;
    }

    return this.pointerNode;
  }

  _updateParentNodeCount(node, delta) {
    node = node.parent;
    while (node !== null) {
      node.nodeCountDelta += delta;
      node = node.parent;
    }
    this.set('length', this.get('length') + delta);
  }

  /**
   * Moves pointer to a particular row. We know which direction to move to by comparing absolute
   * index of pointerNode and the row node. Note that these indexes are indexes of rows when the
   * tree is fully expanded and it always show the correct relative position between 2 rows.
   */
  _movePointerToRow(row) {
    let direction = this.pointerNode.index < row.index ? 1 : -1;
    while (row.index !== this.pointerNode.index) {
      this.pointerNode = this.pointerNode.nextWithDirection(direction);
      this.pointerIndex += direction;
    }
  }

  /**
   * Recount after a leaf node was inserted or deleted
   * @param startNode the node to start the updates
   * @param direction either +1 if added or -1 if removed
   */
  _recountAfterUpdate(startNode, direction) {
    let node = startNode;
    while (node) {
      node.nodeCount += direction;
      if (node.nodeCountDelta < 0) {
        node.nodeCountDelta -= direction;
      }
      node = node.parent;
    }
    if (startNode.nodeCountDelta === 0) {
      // if i'm not in a collapsed part of the tree, i need to adjust length
      this.set('length', this.get('length') + direction);
    }
  }

  /**
   * Create a new TreeNode and append it to the children of `toParent`
   */
  add(rowValue, toParent) {
    let row = new TreeNode(toParent, rowValue);
    row.nodeCount = 1;

    // no siblings
    if (isEmpty(toParent.children)) {
      row.previous = toParent;
    // existing siblings
    } else {
      row.previous = toParent.children[toParent.children.length - 1];
      row.previous.nextOnCollapse = row;
    }
    let originalNext = row.previous.originalNext;
    row.previous.next = row;
    row.previous.originalNext = row;

    if (originalNext.previous === row.previous) {
      originalNext.previous = row;
    } else {
      let previousNodes = this._previousNodes[originalNext];
      if (previousNodes) {
        let idx = previousNodes.indexOf(row.previous);
        if (idx >= 0) {
          previousNodes.splice(idx, 1, row);
        }
      }
    }

    row.originalNext = originalNext;
    row.nextOnCollapse = originalNext;
    row.next = originalNext;

    toParent.children.push(row);

    // update depth
    row.depth = row.parent.depth + 1;

    // recount nodes / deltas
    this._recountAfterUpdate(row.parent, 1);

    // reset indices
    let node;
    row.index = row.previous.index - 1;
    node = row.originalNext;
    while (node) {
      node.index++;
      node = node.originalNext;
    }

    // reset pointer
    if (this.pointerNode === row) {
      this.pointerNode = this._root.children[0];
      this.pointerIndex = 0;
    }

    this.notifyPropertyChange('[]');
  }

  remove(row) {
    // for now, you can only remove leaf nodes
    if (!isEmpty(row.children)) {
      throw Error('can only remove leaf nodes');
    }

    // find all the possible pointers to me and fix them

    let parent = row.parent;
    let previous = row.previous;
    let next = row.next;
    // i have no previous siblings
    if (row.previous === parent) {
      // parent's pointers to me
      parent.originalNext = next;
      if (parent.next === row) {
        parent.next = next;
      }
    // i have a previous sibling
    } else {
      previous.next = next;
      previous.originalNext = next;
      previous.nextOnCollapse = next;
    }

    // i have no next siblings
    if (next.parent !== parent) {
      // previousNode in another part of the tree
      let originalNext = row.originalNext;
      if (originalNext.previous === row) {
        originalNext.previous = previous;
      } else {
        let previousNodes = this._previousNodes[originalNext];
        if (previousNodes) {
          let idx = previousNodes.indexOf(row);
          if (idx >= 0) {
            previousNodes.splice(idx, 1, previous);
          }
        }
      }
    // i have a next sibling
    } else {
      next.previous = previous;
    }

    parent.children.splice(parent.children.indexOf(row), 1);

    // recount nodes / deltas
    let node = row.parent;
    while (node) {
      node.nodeCount--;
      if (node.nodeCountDelta < 0) {
        node.nodeCountDelta++;
      }
      node = node.parent;
    }
    if (row.parent.nodeCountDelta === 0) {
      // if i'm not in a collapsed part of the tree, i need to adjust length
      this.set('length', this.get('length') - 1);
    }

    // reset indices
    node = row.originalNext;
    while (node) {
      node.index--;
      node = node.originalNext;
    }

    // reset pointer
    if (this.pointerNode === row) {
      this.pointerNode = this._root.children[0];
      this.pointerIndex = 0;
    }

    this.notifyPropertyChange('[]');
  }

  collapse(row) {
    // Now update pointerNode to the selected node.
    this._movePointerToRow(row);

    // Update next & previous link.
    let newNextNode = row.nextOnCollapse;
    row.next = newNextNode;
    if (newNextNode !== null) {
      // The newNextNode could have some previous nodes before. Push the collapsed row to the
      // previous node list.
      let previousNodes = this._previousNodes.get(newNextNode);
      if (previousNodes === undefined) {
        previousNodes = [];
        this._previousNodes.set(newNextNode, previousNodes);
      }
      previousNodes.push(newNextNode.previous);

      newNextNode.previous = row;
    }

    set(row, 'collapse', true);
    this._updateParentNodeCount(row, 1 - (row.nodeCount + row.nodeCountDelta));
    this.notifyPropertyChange('[]');
  }

  expand(row) {
    // Now update pointerNode to the selected node.
    this._movePointerToRow(row);

    // Update next & previous link.
    let newNextNode = row.next;
    if (newNextNode !== null) {
      let previousNodes = this._previousNodes.get(newNextNode);
      newNextNode.previous = previousNodes.pop();

      if (previousNodes.length === 0) {
        this._previousNodes.delete(newNextNode);
      }
    }
    row.next = row.originalNext;

    set(row, 'collapse', false);
    this._updateParentNodeCount(row, (row.nodeCount + row.nodeCountDelta) - 1);
    this.notifyPropertyChange('[]');
  }
}
