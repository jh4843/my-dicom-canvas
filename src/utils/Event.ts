import type { IEventInfo, eEventType } from "@/types/Event";

export const augmentCallbackEvent = (callback: Function, source: object): Function => {
  return function (event: IEventInfo) {
    event.src = source;
    callback(event);
  };
};

export class ListenerHandler {
  private _listeners: Array<Array<Function>>;

  constructor() {
    this._listeners = [];
  }

  add(type: eEventType, callback: Function) {
    if (typeof this._listeners[type] === "undefined") {
      this._listeners[type] = [];
    }

    this._listeners[type].push(callback);
  }

  remove(type: eEventType, callback: Function) {
    // check if the type is present
    if (typeof this._listeners[type] === "undefined") {
      return;
    }
    // remove from listeners array
    for (let i = 0; i < this._listeners[type].length; ++i) {
      if (this._listeners[type][i] === callback) {
        this._listeners[type].splice(i, 1);
      }
    }
  }

  fireEvent(event: IEventInfo) {
    // check if they are listeners for the event type
    if (this._listeners[event.type] === undefined) {
      return;
    }
    // fire events from a copy of the listeners array
    // to avoid interference from possible add/remove
    const stack = this._listeners[event.type].slice();
    for (let i = 0; i < stack.length; ++i) {
      stack[i](event);
    }
  }
}
