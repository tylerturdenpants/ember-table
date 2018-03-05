export default class EventQueue {
  q = [];

  add(ev) {
    this.q.push(ev);
  };

  call() {
    let { q } = this;
    for (let i = 0, j = q.length; i < j; i++) {
        q[i].call();
    }
  };

  remove(ev) {
    let { q } = this;
    var newQueue = [];
    for(let i = 0, j = q.length; i < j; i++) {
        if(q[i] !== ev) newQueue.push(q[i]);
    }
    q = newQueue;
  }

  length() {
    return q.length;
  }
}
