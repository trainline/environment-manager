'use strict';

function createTaggedObject() {
  return { Tags: [{ Key: 'I have got the key', Value: 'I have got the secret' }] };
}

function addTag(object, key, value) {
  object.Tags.push({ Key: key, Value: value });
}

function createInvalidtaggedObject() {
  let o = createTaggedObject();
  delete o.Tags[0].Key;
  return o;
}

module.exports = {
  createTaggedObject,
  createInvalidtaggedObject,
  addTag
};
