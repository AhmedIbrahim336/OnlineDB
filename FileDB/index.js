const fs = require('fs');
const path = require('path');

module.exports = class FileDB {
  constructor(dbName) {
    this.dbName = dbName;
    this._init();
  }

  _init() {
    if (!this.dbName) throw new Error('DB name is required');
    if (!fs.existsSync(`./${this.dbName}`)) fs.mkdirSync(`./${this.dbName}`);
  }

  createCollection(docName) {
    if (!docName) throw new Error('Document name is required');
    const docFile = `./${this.dbName}/${docName}.json`;

    if (!fs.existsSync(docFile)) fs.writeFileSync(docFile, JSON.stringify([]));

    return new Document(docName, this.dbName);
  }
};

class Document {
  constructor(docName, dbName) {
    this.docName = docName;
    this.dbName = dbName;
    this.docPath = `./${this.dbName}/${this.docName}.json`;
  }

  insertOne(data) {
    const docPath = this.docPath;
    if (!this._isDocExist(docPath)) this._docNotFoundError();
    const allDocs = fs.readFileSync(docPath);
    const jsonData = JSON.parse(allDocs);
    jsonData.push(data);
    fs.writeFileSync(docPath, JSON.stringify(jsonData));
  }

  insertMany(dataArr) {
    if (!this._isDocExist(this.docPath)) thsi._docNotFoundError();
    if (!(dataArr instanceof Array))
      throw new Error('Method only accept array of items');

    for (let item of dataArr) {
      this.insertOne(item);
    }
  }

  // Find all the items related to one document
  find() {
    // check if the doc exist
    if (!this._isDocExist()) this._docNotFoundError();

    // read the file
    const data = this._getDataJson();

    return data;
  }

  // find one document by id
  // Return null if isn't exist
  findOneById(id) {
    if (!id) throw new Error('Expected an ID to find the document');
    const documents = this._getDataJson();

    const document = documents.find(item => item.id === id);

    return document;
  }

  //   find one document
  findOne(citeria) {
    if (!(citeria instanceof Object)) throw new Error('Expected object');
    const documents = this._getDataJson();
    const keys = Object.keys(citeria);
    // @todo add an utild to do this for all citerias
    const document = documents.find(
      document => document[keys[0]] === citeria[keys[0]]
    );

    return document;
  }
  // Find one document and update it
  // @return the updated document
  updateOneById(id, fields) {
    if (!id) this._throwError('Expected id for updating ');
    if (!(fields instanceof Object))
      this._throwError('Expected fileds to be object');

    const documents = this._getDataJson();

    const documentIdx = documents.findIndex(document => document.id === id);
    if (documentIdx === -1) this._throwError('Document Not Found');

    for (let field in fields) {
      documents[documentIdx][field] = fields[field];
    }

    
  }

  // Utils
  _isDocExist() {
    return fs.existsSync(this.docPath);
  }

  _docNotFoundError() {
    throw new Error("Document doesn't exist");
  }

  _throwError(message) {
    throw new Error(message);
  }

  _getDataJson() {
    const allDocs = fs.readFileSync(this.docPath);
    return JSON.parse(allDocs);
  }
}
