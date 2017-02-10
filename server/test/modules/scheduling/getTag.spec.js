'use strict';

let assert = require('assert');
let tagHelper = require('./helpers/tags');

let getTag = require('modules/scheduling/getTag');

describe('Getting tags from tagged objects', () => {
  describe('getTag function', () => {
    it('should exist', () => {
      assert.ok(getTag);
    });

    describe('incorrect arguments', () => {
      it('should return null with no arguments', () => {
        let result = getTag();
        assert.strictEqual(result, null);
      });

      it('should return null with 1 argument', () => {
        let result = getTag(tagHelper.createTaggedObject());
        assert.strictEqual(result, null);
      });

      it('should return null when given an invalid tagged item', () => {
        let result = getTag(tagHelper.createInvalidtaggedObject());
        assert.strictEqual(result, null);
      });
    });

    describe('missing tags', () => {
      it('should return null when the requested tag does not exist', () => {
        let result = getTag(tagHelper.createTaggedObject(), 'goose');
        assert.strictEqual(result, null);
      });
    });

    describe('correct arguments', () => {
      it('should return the requested tag', () => {
        let result = getTag(tagHelper.createTaggedObject(), 'I have got the key');
        assert.equal(result, 'I have got the secret');
      });

      it('should return the first matching value it finds by the key', () => {
        let o = tagHelper.createTaggedObject();
        tagHelper.addTag(o, 'mouse', 'mickey');
        tagHelper.addTag(o, 'mouse', 'minnie');

        let result = getTag(o, 'mouse');

        assert.equal(result, 'mickey');
      });
    });
  });
});
