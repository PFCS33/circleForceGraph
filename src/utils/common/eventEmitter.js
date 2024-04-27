class EventEmitter {
  constructor() {
    this.eventListeners = {};
  }
  // register callback functions of certain event
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  // emit event, and call all callbacks to process
  emit(event, payload) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => callback(payload));
    }
  }
}
export default EventEmitter;
