
function randDiceString(min, max) {
  // get a random integer in the range, inclusive.
  // randInt(1,6) might return 1,2,3,4,5,6
  min = Math.ceil(min)
  max = Math.floor(max)
  return '' + (Math.floor(Math.random() * (max - min + 1)) + min)
}


