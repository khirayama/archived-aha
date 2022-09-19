export const debounce = function (fn, interval = 0) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, interval);
  };
};
