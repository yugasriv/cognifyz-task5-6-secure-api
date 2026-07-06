// Task 8.2: Background task / job queue processing
//
// A lightweight in-memory task queue. Requests don't wait for slow work
// (like "generating a report") — they get a job ID immediately (202 Accepted)
// and the actual work happens asynchronously in the background.
//
// NOTE: This uses an in-memory queue for portability (no Redis server
// required to run the project). In a production deployment, this same
// interface (enqueue/getStatus) could be backed by Bull + Redis or
// AWS SQS without changing any calling code.

const { randomUUID } = require('crypto');

class JobQueue {
  constructor() {
    this.jobs = new Map(); // jobId -> job record
    this.queue = [];
    this.processing = false;
  }

  enqueue(type, payload, handler) {
    const id = randomUUID();
    const job = {
      id,
      type,
      payload,
      status: 'pending', // pending -> processing -> completed | failed
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.jobs.set(id, job);
    this.queue.push({ id, handler });
    this._processNext();
    return id;
  }

  getStatus(id) {
    return this.jobs.get(id) || null;
  }

  async _processNext() {
    if (this.processing) return; // only one worker for simplicity
    const next = this.queue.shift();
    if (!next) return;

    this.processing = true;
    const job = this.jobs.get(next.id);
    job.status = 'processing';

    try {
      const result = await next.handler(job.payload);
      job.status = 'completed';
      job.result = result;
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
    } finally {
      job.completedAt = new Date().toISOString();
      this.processing = false;
      this._processNext(); // pick up next queued job, if any
    }
  }
}

module.exports = new JobQueue(); // singleton queue shared across the app
