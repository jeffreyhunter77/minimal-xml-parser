require('../setup');

var Parser = require('../../lib/parser')
  , XMLSyntaxError = require('../../lib/xml-syntax-error')
  , Document = require('minimal-dom')
  , Node = require('minimal-dom').Node
;

describe(Parser, () => {

  prop('doc',    function() { return new Document(); }, MEMOIZE);
  prop('parser', function() { return new Parser(this.input, this.doc); }, MEMOIZE);

  describe('.parse()', () => {

    prop('result', function() { return this.parser.parse(); }, MEMOIZE);

    context('with an empty element tag', () => {

      prop('input', '<br />');

      it('returns a single result', function() {
        expect(this.result.length).to.equal(1);
      });

      it('returns a Node', function() {
        expect(this.result[0]).to.be.an.instanceOf(Node);
      });

      it('returns an element', function() {
        expect(this.result[0].nodeType).to.equal(Node.ELEMENT_NODE);
      });

      it("sets the element's tag name", function() {
        expect(this.result[0].tagName).to.equal('br');
      });

      it("does not assign any attributes", function() {
        expect(this.result[0].attributes.length).to.equal(0);
      });

      context('with attributes', () => {

        prop('input', '<input type="text"  name="foo" />');

        it('sets the correct number of attributes on the element', function() {
          expect(this.result[0].attributes.length).to.equal(2);
        });

        it('assigns each attribute with the specified value', function() {
          expect(this.result[0].getAttribute('type')).to.equal('text');
          expect(this.result[0].getAttribute('name')).to.equal('foo');
        });

      });

      context('with an attribute in single quotes', () => {

        prop('input', "<div id='abcd' />");

        it('parses the attribute', function() {
          expect(this.result[0].getAttribute('id')).to.equal('abcd');
        });

      });

      context('with optional space between the attribute name and value', () => {

        prop('input', '<div id = "abcd" />');

        it('parses the attribute', function() {
          expect(this.result[0].getAttribute('id')).to.equal('abcd');
        });

      });

      context('with an attribute containing an entity reference', () => {

        prop('input', '<div data-title="this &amp; that" />');

        it('expands the reference', function() {
          expect(this.result[0].getAttribute('data-title')).to.equal('this & that');
        });

      });

      context('with a missing or invalid element name', () => {

        prop('input', '<>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('with an invalid start tag', () => {

        prop('input', '<div <p>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('without an equal sign on an attribute', () => {

        prop('input', '<div class"shiny">');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('with an improperly formatted attribute value', () => {

        prop('input', '<div class=shiny>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('with an invalid character in quotes', () => {

        prop('input', '<div class="sh<iny">');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('with unterminated quotes', () => {

        prop('input', "<div class='shiny> <p>");

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

      context('with an unexpected end of input in double quotes', () => {

        prop('input', '<div class="');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

    });


    context('with an element tag that has no content', () => {

      prop('input', '<strong></strong>');

      it('returns a single result', function() {
        expect(this.result.length).to.equal(1);
      });

      it('returns an element', function() {
        expect(this.result[0].nodeType).to.equal(Node.ELEMENT_NODE);
      });

      it("sets the element's tag name", function() {
        expect(this.result[0].tagName).to.equal('strong');
      });

    });


    context('with an unterminated element tag', () => {

      prop('input', '<strong>');

      it('throws a syntax error', function() {
        expect(() => this.result).to.throw(XMLSyntaxError);
      });

    });

    context('with an element containing text content', () => {

      prop('input', '<strong>bold!</strong>');
      prop('child', function() { return this.result[0].firstChild; }, MEMOIZE);

      it('returns a single result', function() {
        expect(this.result.length).to.equal(1);
      });

      it('returns an element', function() {
        expect(this.result[0].nodeType).to.equal(Node.ELEMENT_NODE);
      });

      it('creates a single child on the element', function() {
        expect(this.result[0].childNodes.length).to.equal(1);
      });

      it('uses a text node for the child', function() {
        expect(this.child.nodeType).to.equal(Node.TEXT_NODE);
      });

      it('assigns the text content to the child', function() {
        expect(this.child.data).to.equal('bold!');
      });

      context('with content containing entity references', () => {

        prop('input', '<strong>bold &lt; smart</strong>');

        it('expands the entity references', function() {
          expect(this.child.data).to.equal('bold < smart');
        });

      });

      context('with content containing hexadecimal character references', () => {

        prop('input', '<div>6 &#xf7; 2 = 3</div>');

        it('expands the references', function() {
          expect(this.child.data).to.equal("6 \xf7 2 = 3");
        });

      });

      context('with content containing decimal character references', () => {

        prop('input', '<div>6 &#247; 2 = 3</div>');

        it('expands the references', function() {
          expect(this.child.data).to.equal("6 \xf7 2 = 3");
        });

      });

      context('with multi-line content', () => {

        prop('input', "<strong>bold\r\nbold\rbold\nbold</strong>");

        it('normalizes the line endings', function() {
          expect(this.child.data).to.equal("bold\nbold\nbold\nbold");
        });

      });

    });

    context('with an element containing another element', () => {

      prop('input', '<strong><br /></strong>');
      prop('child', function() { return this.result[0].firstChild; }, MEMOIZE);

      it('returns a single result', function() {
        expect(this.result.length).to.equal(1);
      });

      it('creates a single child on the element', function() {
        expect(this.result[0].childNodes.length).to.equal(1);
      });

      it('uses an element for the child', function() {
        expect(this.child.nodeType).to.equal(Node.ELEMENT_NODE);
      });

      it('sets the correct tag name on the child', function() {
        expect(this.child.tagName).to.equal('br');
      });

    });

    context('with an element containing a CDATA section', () => {

      prop('input', '<div><![CDATA[<markup />]]></div>');

      it('parses but discards the CDATA', function() {
        expect(this.result.length).to.equal(1);
        expect(this.result[0].childNodes.length).to.equal(0);
      });

      context('when the section spans multiple lines', () => {

        prop('input', "<div><![CDATA[\n\n<markup />\n\n  ]]></div>");

        it('correctly parses the entire section', function() {
          expect(() => this.result).to.not.throw();
        });

      });

      context('when the section is malformed', () => {

        prop('input', '<div><![CDATA[<markup />] ]></div>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

    });

    context('with an element containing a processing instruction', () => {

      prop('input', '<div><?custom-target info="foo" ?></div>');

      it('parses but discards the instruction', function() {
        expect(this.result.length).to.equal(1);
        expect(this.result[0].childNodes.length).to.equal(0);
      });

      context('when the instruction is malformed', () => {

        prop('input', '<div><?custom-target info="foo" ></div>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

    });

    context('with an element containing a comment', () => {

      prop('input', '<div><!-- some comment --></div>');

      it('parses but discards the comment', function() {
        expect(this.result.length).to.equal(1);
        expect(this.result[0].childNodes.length).to.equal(0);
      });

      context('when the comment is malformed', () => {

        prop('input', '<div><!-- uh oh ---></div>');

        it('throws a syntax error', function() {
          expect(() => this.result).to.throw(XMLSyntaxError);
        });

      });

    });

    context('with an element containing multiple types of content', () => {

      prop('input', '<div>Some <strong><em>strong</em></strong> words.</div>');

      it('returns all of the content', function() {
        expect(this.result.length).to.equal(1);

        expect(this.result[0].tagName).to.equal('div');
        expect(this.result[0].childNodes.length).to.equal(3);

        expect(this.result[0].childNodes[0].data).to.equal('Some ');

        expect(this.result[0].childNodes[1].tagName).to.equal('strong');
        expect(this.result[0].childNodes[1].firstChild.tagName).to.equal('em');
        expect(this.result[0].childNodes[1].firstChild.firstChild.data).to.equal('strong');

        expect(this.result[0].childNodes[2].data).to.equal(' words.');
      });

    });

  });

});
