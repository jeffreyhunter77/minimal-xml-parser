require('../setup');

const XMLSyntaxError = require('../../lib/xml-syntax-error');

describe(XMLSyntaxError, () => {

  prop('actualValue',   '*');
  prop('expectedValue', '<');
  prop('colNumber',     100);
  prop('fileName',      'example.xml');
  prop('lineNumber',    3);

  prop('error', function() {
    return new XMLSyntaxError(
      this.actualValue,
      this.expectedValue,
      this.colNumber,
      this.fileName,
      this.lineNumber);
  });

  describe('.actual', () => {
    it('contains the encountered value', function() {
      expect(this.error.actual).to.equal(this.actualValue);
    });
  });

  describe('.column', () => {
    it('contains the offset where the error occurred', function() {
      expect(this.error.column).to.equal(this.colNumber);
    });
  });

  describe('.expected', () => {
    it('contains the expected value or description', function() {
      expect(this.error.expected).to.equal(this.expectedValue);
    });
  });

  describe('.line', () => {
    it('contains the line number where the error occurred', function() {
      expect(this.error.line).to.equal(this.lineNumber);
    });
  });

  describe('.sourceName', () => {
    it('contains the name of the source', function() {
      expect(this.error.sourceName).to.equal(this.fileName);
    });
  });

});
