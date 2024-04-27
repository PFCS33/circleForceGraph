function reactiveAssign(source, target) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

// function isEqualObject(obj1, obj2) {
//   let res = true;
//   for (const key in source) {
//     if (source.hasOwnProperty(key)) {
//       if (target.hasOwnProperty(key)) {
//         if(  target[key].equalsT == source[key])

//       } else {
//         res = false;
//         break;
//       }
//     }
//   }
//   return res;
// }

export { reactiveAssign };
