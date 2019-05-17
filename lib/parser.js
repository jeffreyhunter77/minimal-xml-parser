var Readable = require('stream').Readable
  , XMLSyntaxError = require('./xml-syntax-error')
;

// class StringStream extends Readable {
//
//   constructor(contents) {
//     super();
//
//     this.push(contents);
//     this.push(null);
//   }
//
//   _read() {
//   }
//
// }

const XML_ENTITIES = Object.freeze({
  '&quot;': '"',
  '&apos;': "'",
  '&amp;' : '&',
  '&lt;'  : '<',
  '&gt;'  : '>'
});

class Parser {

  constructor(source, doc, sourceName) {
    this._in = source;
    this._curr = null;
    this._pos = 0;
    this._lineNo = 1;
    this._doc = doc;
    this._source = sourceName;
  }

  parse() {
    this._element();

    return [this._elem];
  }

  _element() {
    if (this._peekNext('</'))
      return false;

    if (! this._isNext('<'))
      return false;

    if (! this._name())
      this._error(this._peekNextChar(), 'element name');

    let elem = this._doc.createElement(this._curr);
    this._elem = elem;

    if (this._attributes()) {
      this._attrs.forEach((attr) => elem.setAttribute(attr[0], attr[1]));
    }

    this._space();

    if (this._isNext('/>'))
      return true;

    if (! this._isNext('>'))
      this._error(this._peekNextChar(), "'>'");

    if (this._content()) {
      this._contents.forEach((node) => elem.appendChild(node));
    }

    if (! this._endTag(elem.tagName))
      this._error(this._peekNextChar(), `'/>' or </${elem.tagName}>`);

    this._elem = elem;

    return true;
  }

  _name() {
    let nameRE = /^[:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}][\-.0-9:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0300-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]*/u;

    return this._isNext(nameRE);
  }

  _space() {
    let spaceRE = /^[ \n\r\t]+/

    if (this._isNext(spaceRE)) {
      this._lineNo += this._lineCount(this._curr);
      return true;
    } else {
      return false;
    }
  }

  _attributes() {

    this._attrs = [];

    while (this._attribute()) {
      this._attrs.push(this._attr);
    }

    return this._attrs.length > 0;
  }

  _attribute() {

    if (! this._space())
      return false;

    if (! this._name())
      return false;

    let name = this._curr;

    if (! this._eq())
      this._error(this._peekNextChar(), "'='");

    if (! this._attValue())
      this._error(this._peekNextChar(), 'quoted attribute value');

    this._attr = [name, this._curr];

    return true;
  }

  _eq() {
    this._space();

    if (! this._isNext('='))
      return false;

    this._space();

    return true;
  }

  _attValue() {

    if (this._isNext('"')) {

      if (! this._isNext(/^[^<"]*/))
        this._error(this._peekNextChar(), 'attribute value');

      let value = this._curr;

      if (! this._isNext('"'))
        this._error(this._peekNextChar(), "'\"'");

      this._curr = this._expandReferences(value);
      return true;

    } else if (this._isNext("'")) {

      if (! this._isNext(/^[^<']*/))
        this._error(this._peekNextChar(), 'attribute value');

      let value = this._curr;

      if (! this._isNext("'"))
        this._error(this._peekNextChar(), "\"'\"");

      this._curr = this._expandReferences(value);
      return true;

    }

    return false;
  }

  _endTag(name) {
    if (! this._isNext('</'))
      return false;

    if (! this._name())
      this._error(this._peekNextChar(), "element name");

    if (this._curr !== name)
      this._error(this._curr, `'${name}'`);

    this._space();

    if (! this._isNext('>'))
      this._error(this._peekNextChar(), "'>'");

    return true;
  }

  _content() {
    let contents = [];

    while (this._contentItem()) {
      if (this._item)
        contents.push(this._item);
    }

    this._contents = contents;

    return this._contents.length > 0;
  }

  _contentItem() {
    if (this._charData()) {
      this._item = this._text;
      return true;
    }

    if (this._cdataSection()) {
      this._item = false; // no op
      return true;
    }

    if (this._pi()) {
      this._item = false; // no op
      return true;
    }

    if (this._comment()) {
      this._item = false; // no op
      return true;
    }

    if (this._element()) {
      this._item = this._elem;
      return true;
    }

    return false;
  }

  _charData() {
    if (! this._isNext(/^[^<]+/))
      return false;

    this._lineNo += this._lineCount(this._curr);

    this._text = this._doc.createTextNode(
      this._normalizeLineEndings(
        this._expandReferences(this._curr)
      )
    );

    return true;
  }

  _cdataSection() {
    if (! this._isNext('<![CDATA['))
      return false;

    this._isNext(/^(?:[^\]]|](?!]>))*/);

    this._lineNo += this._lineCount(this._curr);

    if (! this._isNext(']]>'))
      this._error(this._peekNextChar(), ']]>');
  }

  _pi() {
    if (! this._isNext('<?'))
      return false;

    this._isNext(/^(?:[^?]|\?(?!>))*/);

    this._lineNo += this._lineCount(this._curr);

    if (! this._isNext('?>'))
      this._error(this._peekNextChar(), '?>');
  }

  _comment() {
    if (! this._isNext('<!--'))
      return false;

    this._isNext(/^(?:[^-]|-[^-])*/);

    this._lineNo += this._lineCount(this._curr);

    if (! this._isNext('-->'))
      this._error(this._peekNextChar(), '-->');
  }

  _normalizeLineEndings(str) {
    return String(str).replace(/(?:\r\n|\n|\r)/g, "\n");
  }

  _lineCount(str) {
    return String(str).split(/(?:\r\n|\n|\r)/).length - 1;
  }

  _isNext(expected) {
    if (expected instanceof RegExp) {

      let match = expected.exec(this._in.substr(this._pos));

      if (match) {
        this._curr = match[0];
        this._pos += this._curr.length;
        return true;
      }

    } else {

      let next = this._in.substr(this._pos, expected.length);

      if (next === expected) {
        this._curr = next;
        this._pos += this._curr.length;
        return true;
      }

    }

    return false
  }

  _peekNext(expected) {
    return this._in.substr(this._pos, expected.length) === expected;
  }

  _expandReferences(value) {
    return this._expandCharReferences(
      this._expandEntities(value)
    );
  }

  _expandEntities(value) {
    let entityRE = /(&amp;|&qpos;|&gt;|&lt;|&quot;)/g

    return value.replace(entityRE, (char) => XML_ENTITIES[char]);
  }

  _expandCharReferences(value) {
    let refRE = /&#x([0-9a-fA-F]+);|&#([0-9]+);/g

    return value.replace(refRE, (ref, hexVal, decVal) => {
      if (hexVal !== undefined)
        return String.fromCodePoint(parseInt(hexVal, 16));
      else
        return String.fromCodePoint(parseInt(decVal, 10));
    });
  }

  _error(actual, expected) {
    throw new XMLSyntaxError(
      actual,
      expected,
      this._column(),
      this._source || '<INPUT>',
      this._lineNo
    );
  }

  _column() {
    let lineStart = /[\r\n][^\r\n]*$/.exec(this._in.substr(0, this._pos));

    if (lineStart)
      return lineStart[0].length;
    else
      return this._pos + 1;
  }

  _peekNextChar() {
    if (this._pos >= this._in.length)
      return 'end of input';
    else
      return this._in.charAt(this._pos);
  }
}

module.exports = Parser;
