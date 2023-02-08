export interface IQueue<T> {
  enQueue(item: T): void;
  deQueue(): T | undefined;
  size(): number;
}

class Queue<T> implements IQueue<T> {
  private _storage: T[] = [];

  constructor(private capacity: number = Infinity) {}

  enQueue(item: T): void {
    if (this.size() === this.capacity) {
      throw Error("Queue has reached max capacity, you cannot add more items");
    }
    this._storage.push(item);
  }
  deQueue(): T | undefined {
    return this._storage.shift();
  }
  size(): number {
    return this._storage.length;
  }
  empty(): void {
    this._storage = [];
  }
}

export default Queue;
