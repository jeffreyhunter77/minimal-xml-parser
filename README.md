# minimal-xml-parser

This is a simple XML parser. It does no validation beyond requiring the input to be well-formed.

It produces its output as a DOM Document Fragment. The user is required to supply the DOM implementation. Any implementation that conforms to [DOM (Core) Level 1](https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html) may be used. [minimal-dom](https://github.com/jeffreyhunter77/minimal-dom) is one such implementation.

## Installation

Using npm:

```
npm install minimal-xml-parser
```

## Example Usage

```javascript
const Parser = require('minimal-xml-parser');
const Document = require('minimal-dom');

const xml = '<example><greeting>Hello, world!</greeting></example>'

let fragment = new Parser(xml, new Document()).parse();

console.log(String(fragment.firstChild.firstChild));

// outputs:
// <greeting>Hello, world!</greeting>
```

## API

This module exports one class as its default:

 * [Parser](#api_parser)

<a name="api_parser"></a>
### Parser

The parser class provides the following methods:

 * [constructor](#api_parser_constructor)
 * [parse](#api_parser_parse)

It also provides the following property on the class:

 * [XMLSyntaxError](#api_parser_xmlsyntaxerror)

<a name="api_parser_constructor"></a>
### new Parser(source, doc[, sourceName])

**Parameters**

  * `source`: **String** The XML document or fragment to parse
  * `doc`: **Document** An instance of a DOM Document that will be used to create the parser output.
  * `sourceName`: **String** (Optional) The name of the source (such as a file name) to use in any errors produced by the parser. Defaults to `"<INPUT>"`.

**Return Value**

A new `Parser` instance.

**Description**

Creates a new instance of `Parser`. The document is not actually parsed until `parse` is called.

<a name="api_parser_parse"></a>
### parser.parse()

**Parameters**

None.

**Return Value**

A `DocumentFragment` containing the parsed content.

**Description**

Parses the XML source supplied to the constructor. It creates a new `DocumentFragment` using the `Document` supplied to the constructor and adds all encountered elements and their content to that fragment. If any errors are encountered, this method throws an [`XMLSyntaxError`](#api_xml_syntaxerror).

<a name="api_parser_xmlsyntaxerror"></a>
### Parser.XMLSyntaxError

The `XMLSyntaxError` property of the `Parser` class provides a reference to the [`XMLSyntaxError`](#api_xmlsyntaxerror) class:

```javascript
const XMLSyntaxError = require('minimal-xml-parser').XMLSyntaxError;

try {
  callSomeRoutineThatParsesXML();
} catch (e) {
  if (e instanceof XMLSyntaxError)
    // error due to a parsing failure
  else
    // some other error
}
```

<a name="api_xmlsyntaxerror"></a>
### XMLSyntaxError

`XMLSyntaxError` is an `Error` class, instances of which are thrown when the parser encounters an error. Its message contains a full description of the error. It also provides the following properties:

 * `sourceName`: **String** The name of the source that produced the error.
 * `line`: **Number** The line number where the error occurred
 * `column`: **Number** The offset in characters on the line where the error occurred.
 * `expected`: **String** A token or description of what was expected next for valid XML.
 * `actual`: **String** The value that was encountered.
