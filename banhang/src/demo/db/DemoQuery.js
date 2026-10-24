// Chainable, thenable query like mongoose.Query. lean() is a no-op: results are plain objects.
export class DemoQuery {
  constructor(executor) {
    this.executor = executor;
    this.options = {};
  }

  sort(spec) {
    this.options.sort = spec;
    return this;
  }

  limit(count) {
    this.options.limit = Number(count) || 0;
    return this;
  }

  lean() {
    return this;
  }

  exec() {
    return Promise.resolve().then(() => this.executor(this.options));
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}
