class XMLSyntaxError extends Error {

  constructor(actual, expected, column, fileName, lineNumber, ...params) {
    super(
      `XML syntax error at line ${lineNumber}, column ${column} of ${fileName}: expecting ${expected}, but encountered '${actual}'`,
      fileName,
      lineNumber,
      ...params);

      this.actual = actual;
      this.expected = expected;
      this.column = column;
  }

}

module.exports = XMLSyntaxError;
