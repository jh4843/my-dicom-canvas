import Queue from "@/components/DataContainer/Queue";
import * as MyType from "@/types";

export enum eWrokTaskType {
  work_task_type_invalid = 0,
  work_task_type_decode_image,
}

export type tMssageDecode = MyType.iInputImageData;

export class ThreadPool {
  private _poolSize: number;
  //
  private _taskQueue: Queue<WorkerTask>;
  private _freeThreads: Array<WorkerThread>;
  private _runningThreads: Array<WorkerThread>;

  constructor(poolSize: number) {
    this._taskQueue = new Queue<WorkerTask>();
    this._taskQueue.empty();
    this._freeThreads = [];
    this._runningThreads = [];
    this._poolSize = poolSize;

    for (let i = 0; i < poolSize; ++i) {
      this._freeThreads.push(new WorkerThread(this));
    }
  }

  /**
   * Add a worker task to the queue.
   * Will be run when a thread is made available.
   *
   * @param {object} workerTask The task to add to the queue.
   */
  addWorkerTask(workerTask: WorkerTask) {
    // send work start if first task
    if (this._freeThreads.length === this._poolSize) {
      this.onworkstart({ type: MyType.eEventType.event_type_thread_work_start });
    }
    // launch task or queue
    if (this._freeThreads.length > 0) {
      // get the first free worker thread
      const workerThread = this._freeThreads.shift();

      if (workerThread != undefined) {
        // add the thread to the runnning list
        this._runningThreads.push(workerThread);
        // run the input task
        workerThread.run(workerTask);
      }
    } else {
      // no free thread, add task to queue
      this._taskQueue.enQueue(workerTask);
    }
  }

  /**
   * Abort all threads.
   */
  abort() {
    // stop all threads
    stop();
    // callback
    this.onabort({ type: MyType.eEventType.event_type_thread_work_abort });
    this.onworkend({ type: MyType.eEventType.event_type_thread_work_end });
  }

  /**
   * Handle a task end.
   *
   * @param {object} workerThread The thread to free.
   */
  onTaskEnd(workerThread: WorkerThread) {
    // launch next task in queue or finish
    if (this._taskQueue.size() > 0) {
      // get waiting task
      const workerTask = this._taskQueue.deQueue();
      if (workerTask != undefined) {
        // use input thread to run the waiting task
        workerThread.run(workerTask);
      }
    } else {
      // stop the worker
      workerThread.stop();
      // no task to run, add to free list
      this._freeThreads.push(workerThread);
      // remove from running list
      for (let i = 0; i < this._runningThreads.length; ++i) {
        if (this._runningThreads[i].getId() === workerThread.getId()) {
          this._runningThreads.splice(i, 1);
        }
      }
      // the work is done when the queue is back to its initial size
      if (this._freeThreads.length === this._poolSize) {
        this.onwork({ type: MyType.eEventType.event_type_thread_work });
        this.onworkend({ type: MyType.eEventType.event_type_thread_work_end });
      }
    }
  }

  /**
   * Handle an error message from a worker.
   *
   * @param {object} event The error event.
   */
  handleWorkerError(event: MyType.iEventInfo) {
    // stop all threads
    stop();
    // callback
    this.onerror({ error: event });
    this.onworkend({ type: MyType.eEventType.event_type_thread_work_end });
  }

  // private ----------------------------------------------------------------

  /**
   * Stop the pool: stop all running threads.
   *
   * @private
   */
  stop() {
    // clear tasks
    this._taskQueue.empty();
    // cancel running workers
    for (let i = 0; i < this._runningThreads.length; ++i) {
      this._runningThreads[i].stop();
    }
    this._runningThreads = [];
  }

  onworkstart(event: MyType.iEventInfo) {}
  onworkitem(event: MyType.iEventInfo) {}
  onwork(event: MyType.iEventInfo) {}
  onworkend(event: MyType.iEventInfo) {}
  onerror(event: MyType.iEventInfo) {}
  onabort(event: MyType.iEventInfo) {}
}

export class WorkerThread {
  private _parentPool: ThreadPool;
  private _id: string;
  private _runningTask: WorkerTask | null;
  private _worker: Worker | null;

  constructor(parentPool: ThreadPool) {
    this._parentPool = parentPool;
    this._id = Math.random().toString(36).substring(2, 15);
    this._runningTask = null;
    this._worker = null;
  }

  getId() {
    return this._id;
  }

  run(workerTask: WorkerTask) {
    this._runningTask = workerTask;

    if (this._worker == null) {
      this._worker = new Worker(this._runningTask.script);
      if (this._worker != undefined) {
        this._worker.onmessage = this.onmessage;
        this._worker.onerror = this.onerror;
      }
    }
  }

  stop() {
    // stop the worker
    this._worker?.terminate();
  }

  onmessage(event: any) {
    if (this._runningTask != undefined) {
      // augment event
      event.itemNumber = this._runningTask.info.itemNumber;
      event.numberOfItems = this._runningTask.info.numberOfItems;
      event.dataIndex = this._runningTask.info.dataIndex;
    }

    // send event
    this._parentPool.onworkitem(event);
    // tell the parent pool the task is done
    this._parentPool.onTaskEnd(this);
  }

  /**
   * Error event handler.
   *
   * @param {object} event The error event.
   * @private
   */
  onerror(event: any) {
    if (this._runningTask != undefined) {
      // augment event
      event.itemNumber = this._runningTask.info.itemNumber;
      event.numberOfItems = this._runningTask.info.numberOfItems;
      event.dataIndex = this._runningTask.info.dataIndex;
    }

    // pass to parent
    this._parentPool.handleWorkerError(event);
    // stop the worker and free the thread
    self.stop();
  }
}

export class WorkerTask {
  private _script: string;
  private _message: tMssageDecode;
  private _info: MyType.iEventInfo;

  constructor(script: string, message: tMssageDecode, info: MyType.iEventInfo) {
    this._script = script;
    this._message = message;
    this._info = info;
  }

  get script() {
    return this._script;
  }

  get message() {
    return this._message;
  }

  get info() {
    return this._info;
  }
}
