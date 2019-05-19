let Parser = require('./lib/parser');
let XMLSyntaxError = require('./lib/xml-syntax-error');

Parser.XMLSyntaxError = XMLSyntaxError;

module.exports = Parser;
