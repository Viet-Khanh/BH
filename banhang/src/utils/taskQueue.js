// Runs async tasks strictly one after another (e.g. scans append lines in scan order).
export const createTaskQueue = () => {
  let tail = Promise.resolve();
  return {
    run(task) {
      const result = tail.then(() => task());
      tail = result.catch(() => {});
      return result;
    },
  };
};
