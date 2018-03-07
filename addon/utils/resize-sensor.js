import EventQueue from './event-queue';
import { scheduler, Token } from 'ember-raf-scheduler';

export default class ResizeSensor2 {
  constructor(element, callback) {
    this.forEachElement(element, (elem) => {
      this.attachResizeEvent(elem, callback);
    });

    this.token = new Token();
  }

  /**
   * @param {HTMLElement} element
   * @param {String}      prop
   * @returns {String|Number}
   */
  getComputedStyle(element, prop) {
      if (element.currentStyle) {
          return element.currentStyle[prop];
      } else if (window.getComputedStyle) {
          return window.getComputedStyle(element, null).getPropertyValue(prop);
      } else {
          return element.style[prop];
      }
  }

  /**
   *
   * @param {HTMLElement} element
   * @param {Function}    resized
   */
  attachResizeEvent(element, resized) {
      if (!element.resizedAttached) {
          element.resizedAttached = new EventQueue();
          element.resizedAttached.add(resized);
      } else if (element.resizedAttached) {
          element.resizedAttached.add(resized);
          return;
      }

      element.resizeSensor = document.createElement('tr');
      element.resizeSensor.className = 'resize-sensor';
      let style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
      let styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

      element.resizeSensor.style.cssText = style;
      element.resizeSensor.innerHTML =
          '<th class="resize-sensor-expand" style="' + style + '">' +
              '<div style="' + styleChild + '"></div>' +
          '</th>' +
          '<th class="resize-sensor-shrink" style="' + style + '">' +
              '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
          '</th>';
      element.appendChild(element.resizeSensor);

      if (getComputedStyle(element, 'position') == 'static') {
          element.style.position = 'relative';
      }

      let expand = element.resizeSensor.childNodes[0];
      let expandChild = expand.childNodes[0];
      let shrink = element.resizeSensor.childNodes[1];
      let dirty, newWidth, newHeight;
      let lastWidth = element.offsetWidth;
      let lastHeight = element.offsetHeight;

      let reset = function() {
        expandChild.style.width = '100000px';
        expandChild.style.height = '100000px';

        expand.scrollLeft = 100000;
        expand.scrollTop = 100000;

        shrink.scrollLeft = 100000;
        shrink.scrollTop = 100000;
      };

      reset();

      let onResized = () => {
        if (!dirty) return;

        lastWidth = newWidth;
        lastHeight = newHeight;

        if (element.resizedAttached) {
            element.resizedAttached.call();
        }
      };

      let onScroll = () => {
        newWidth = element.offsetWidth;
        newHeight = element.offsetHeight;
        dirty = newWidth != lastWidth || newHeight != lastHeight;

        if (dirty) {
          scheduler.schedule('sync', () => {
            onResized();
          }, this.token);
        }

        reset();
      };

      let addEvent = function(el, name, cb) {
        if (el.attachEvent) {
            el.attachEvent('on' + name, cb);
        } else {
            el.addEventListener(name, cb);
        }
      };

      addEvent(expand, 'scroll', onScroll);
      addEvent(shrink, 'scroll', onScroll);
  }

  forEachElement(elements, callback){
    let elementsType = Object.prototype.toString.call(elements);
    let isCollectionTyped = ('[object Array]' === elementsType
      || ('[object NodeList]' === elementsType)
      || ('[object HTMLCollection]' === elementsType)
      || ('[object Object]' === elementsType)
      || ('undefined' !== typeof jQuery && elements instanceof jQuery) //jquery
      || ('undefined' !== typeof Elements && elements instanceof Elements) //mootools
    );
    let i = 0, j = elements.length;
    if (isCollectionTyped) {
      for (; i < j; i++) {
        callback(elements[i]);
      }
    } else {
      callback(elements);
    }
  }

  detach(ev) {
    forEachElement(element, function(elem){
        if(elem.resizedAttached && typeof ev == "function"){
            elem.resizedAttached.remove(ev);
            if(elem.resizedAttached.length()) return;
        }
        if (elem.resizeSensor) {
            if (elem.contains(elem.resizeSensor)) {
                elem.removeChild(elem.resizeSensor);
            }
            delete elem.resizeSensor;
            delete elem.resizedAttached;
        }
    });
  };
};
