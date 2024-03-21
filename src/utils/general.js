function reactiveAssign(source, target) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

export { reactiveAssign };
