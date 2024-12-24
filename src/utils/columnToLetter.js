/**
 * Converts a column number to its corresponding Excel-style column letter
 * @param {number} columnNumber - The column number (1-based index)
 * @returns {string} The column letter representation
 */
function columnToLetter(columnNumber) {
  let letter = '';
  while (columnNumber > 0) {
    columnNumber--;
    letter = String.fromCharCode(65 + (columnNumber % 26)) + letter;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return letter;
}

module.exports = columnToLetter;
