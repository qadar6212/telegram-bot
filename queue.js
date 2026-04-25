// =============================================
// QUEUE.JS - Download queue management
// Waxay maamusheysaa downloads si tartiib ah
// =============================================

class DownloadQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency; // Max downloads at same time
    this.running = 0;
    this.queue = [];
  }

  // Add task to queue
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  // Process next in queue
  process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;

      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.process(); // Check for next
        });
    }
  }

  // Queue length
  get size() {
    return this.queue.length;
  }

  // Position in queue
  getPosition() {
    return this.queue.length + this.running;
  }
}

// Single global queue instance
const queue = new DownloadQueue(2);

module.exports = queue;
