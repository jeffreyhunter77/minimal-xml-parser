require('./setup');

var index = require('../index')
  , Parser = require('../lib/parser')
  , XMLSyntaxError = require('../lib/xml-syntax-error')
;

describe('index', () => {

  it('exports Parser', function() {
    expect(index).to.equal(Parser);
  });

  it('exports XMLSyntaxError as a property of Parser', function() {
    expect(index.XMLSyntaxError).to.equal(XMLSyntaxError);
  });

});
