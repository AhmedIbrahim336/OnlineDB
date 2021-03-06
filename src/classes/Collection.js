const fs = require('fs');
const Save = require('./Save');
const limit = require('../helpers/limit');
const { skip } = require('../helpers/skip');
const { v4 } = require('uuid');
const {
  getDataJson,
  isDocExist,
  docNotFoundError,
  throwError,
  writeData,
} = require('../utils/utils');
const { applyFilter } = require('../helpers/applyFilter');
const { checkApplyRelation } = require('../relation');
const { applySelection } = require('../helpers');
const { applyUpdates } = require('../helpers/applyUpdates');

module.exports = class Collection {
  constructor(colName, dbName, schema) {
    this.colName = colName;
    this.dbName = dbName;
    this.collectionPath = `./OnlineDB/${this.dbName}/${this.colName}.onlinedb.db`;
    this.schema = schema;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  _updatedAt() {
    this.updatedAt = new Date();
  }

  count() {
    const data = getDataJson(this.collectionPath);
    return data.length;
  }

  insertOne(data) {
    const collectionPath = this.collectionPath;
    if (!isDocExist(collectionPath)) docNotFoundError();
    const collection = getDataJson(collectionPath);

    if (!data.id) {
      data.id = v4();
    }
    // if there is any schema -> run validation
    if (this.schema) {
      this.schema.validateDataAganistSchema(data, this.dbName, this.colName);
    }
    data.createdAt = new Date();
    collection.push(data);
    writeData(collection, collectionPath);

    this._updatedAt();

    return data;
  }

  insertMany(dataArr) {
    if (!isDocExist(this.collectionPath)) docNotFoundError();
    if (!(dataArr instanceof Array))
      throw new Error(' insertMany only accept array of items');

    for (let item of dataArr) {
      this.insertOne(item);
    }
  }

  // Find all the items related to one document
  find(filter) {
    // check if the doc exist
    if (!isDocExist(this.collectionPath)) docNotFoundError();

    // read the file
    let data = getDataJson(this.collectionPath);

    // apply filters
    data = applyFilter(filter, data);
    if (filter && filter.skip) data = skip(data, filter.skip);

    if (filter && filter.limit) data = limit(filter.limit, data);
    // check for selection
    if (typeof filter.select !== 'undefined') {
      data = applySelection(filter.select, data);
    }

    // populate data
    data = checkApplyRelation(filter, this.dbName, this.schema, data);

    return data;
  }

  // find one document by id
  // Return null if isn't exist
  findOneById(id) {
    if (!id) throwError('Expected an ID to find the document');
    const documents = getDataJson(this.collectionPath);

    const document = documents.find(item => item.id === id);

    return document;
  }

  //   find one document
  findOne(filter) {
    if (!(filter instanceof Object)) throwError('Expected object');
    const collection = getDataJson(this.collectionPath);
    // apply filters
    let data = applyFilter(filter, collection);
    // check for selection
    if (typeof filter.select !== 'undefined') {
      data = applySelection(filter.select, data);
    }

    // populate data
    data = checkApplyRelation(filter, this.dbName, this.schema, data);

    return data[0];
  }
  // Find one document and update it
  // @return the updated document
  updateOneById(id, fieldsToUpdate) {
    if (!id) throwError(' "id" is required to update a document '.bgRed);
    if (!(fieldsToUpdate instanceof Object))
      throwError('Expected fileds to be object'.bgRed);

    const documents = getDataJson(this.collectionPath);

    const documentIdx = documents.findIndex(document => document.id === id);
    if (documentIdx === -1) throwError('Document Not Found');

    let currentDocument = documents[documentIdx];
    // apply your updates
    currentDocument = applyUpdates(
      [currentDocument],
      this.schema.schema,
      fieldsToUpdate
    );
    currentDocument.updatedAt = new Date();
    writeData(documents, this.collectionPath);
  }

  updateOne(filter, fieldsToUpdate) {
    if (!(filter instanceof Object))
      throwError('Expected filter to be an object');
    if (!(fieldsToUpdate instanceof Object))
      throwError('Expected updates to be an object');

    const collection = getDataJson(this.collectionPath);

    // apply filters
    let data = applyFilter(filter, collection);
    if (data.length === 0) throwError('Document not found');

    // apply your updates
    data = applyUpdates([data[0]], this.schema.schema, fieldsToUpdate);
    // update updateAt  field
    data[0].updatedAt = new Date();

    writeData(collection, this.collectionPath);
    // updated at
    this._updatedAt();
    return data[0];
  }

  updateMany(filter, fieldsToUpdate) {
    if (!(filter instanceof Object))
      throwError('Expected filter to be an object'.bgRed);
    if (!(fieldsToUpdate instanceof Object))
      throwError('Expected fieldsToUpdate to be an object'.bgRed);
    // get all data
    const collection = getDataJson(this.collectionPath);
    // apply filters
    let data = applyFilter(filter, collection);
    // apply your updates
    data = applyUpdates(data, this.schema.schema, fieldsToUpdate);
    // replace the old document by the new ones
    writeData(collection, this.collectionPath);

    // updated at
    this._updatedAt();
  }

  // Delete one by id
  deleteOneById(id) {
    if (!id) throwError('Expected id');
    if (typeof id != 'string') throwError('id should be type of string');
    let documents = getDataJson(this.collectionPath);

    // check if the document exist
    const idx = documents.findIndex(document => document.id === id);
    if (idx === -1) throwError("Document dont' found ");

    // delete the document
    documents = documents.filter(document => document.id !== id);

    // updated at
    this._updatedAt();

    writeData(documents, this.collectionPath);
  }
  // Delete many documents with given filter
  deleteMany(filter) {
    if (!(filter instanceof Object))
      throwError('Filter should be type of object');
    const collection = getDataJson(this.collectionPath);
    // apply filters
    let documentsToDelete = applyFilter(filter, collection);
    let newCollection = [];

    for (let document of collection) {
      // check if it is in the deleted documents
      const idx = documentsToDelete.findIndex(doc => doc.id == document.id);
      // push it if it's not exist
      if (idx === -1) {
        newCollection.push(document);
      }
    }
    // updated at
    this._updatedAt();
    writeData(newCollection, this.collectionPath);
  }

  // Delete many documents with given filter
  deleteOne(filter) {
    if (!(filter instanceof Object))
      throwError('Filter should be type of object');

    // get all data
    const collection = getDataJson(this.collectionPath);
    // apply filters
    let data = applyFilter(filter, collection);
    if (data.length === 0) throwError('Document not found '.bgRed);
    // Remove the document
    const documentToDelete = data[0];
    const docIdx = collection.findIndex(doc => doc.id == documentToDelete.id);
    collection.splice(docIdx, 1);

    writeData(collection, this.collectionPath);
    // updated at
    this._updatedAt();
    return documentToDelete;
  }
};
