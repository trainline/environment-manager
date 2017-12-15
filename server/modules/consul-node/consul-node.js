'use strict';

class ConsulNode {
  constructor(jsonRepresentation = {}) {
    this.json = jsonRepresentation;
  }

  getServiceVersion() {
    return this.json.ServiceTags.find(st => st.split(':')[0].toLowerCase() === 'version');
  }

  getJson() {
    return this.json;
  }
}

module.exports = {
  ConsulNode
};
