const { checkArrayType, checkObjectType } = require('../types/types');
const { throwError } = require('../utils/utils');
const {
  checkForPremitiveValues,
  isObjectType,
  checkForCriteriaObject,
  isRequired,
} = require('../types/typesUtils');

const { lengthCheck } = require('../helpers/lengthCheck');
module.exports = class Schema {
  constructor(schemaFields) {
    this.schema = schemaFields;
  }

  validateDataAganistSchema(data) {
    for (let schemaField in this.schema) {
      const schemaFieldValue = this.schema[schemaField];
      const dataFieldValue = data[schemaField];

      if (schemaFieldValue instanceof Array) {
        checkArrayType(dataFieldValue, schemaField, schemaFieldValue);
      } else if (isObjectType(schemaFieldValue)) {
        // there this thow coditions one -> item of object
        checkObjectType(schemaFieldValue, dataFieldValue, schemaField);
      } else if (checkForCriteriaObject(schemaFieldValue)) {
        // this called the criteria object.
        // Example meta : { type: String, requried: true }

        // check for maxLength and minLength properties
        if (
          typeof schemaFieldValue.maxLength !== 'undefined' ||
          typeof schemaFieldValue.minLength !== 'undefined'
        ) {
          lengthCheck(schemaFieldValue, dataFieldValue, schemaField);
        }
        // need to pass the exist check if it's not required
        // if the field exist and its requried so need to validate
        // what if its exsit and not required need to check its type
        // throw an error if it's required and not exist
        if (typeof schemaFieldValue.default !== 'undefined') {
          if (
            checkForPremitiveValues(
              schemaFieldValue.type,
              schemaFieldValue.default
            )
          )
            throwError(
              ` default value for the feild "${schemaField}" expected to be of type "${typeof schemaFieldValue.type()}" but get type of "${typeof schemaFieldValue.default}" `
            );
        }
        if (
          isRequired(schemaFieldValue) &&
          typeof dataFieldValue === 'undefined'
        ) {
          if (typeof schemaFieldValue.default === 'undefined') {
            throwError(`${schemaField} field is required`);
          } else {
            data[schemaField] = schemaFieldValue.default;
          }
        }

        if (
          isRequired(schemaFieldValue) &&
          checkForPremitiveValues(schemaFieldValue.type, dataFieldValue) &&
          typeof dataFieldValue !== 'undefined' &&
          typeof schemaFieldValue.default !== 'undefined'
        ) {
          throwError(
            ` Field "${schemaField}" expected type of ${typeof schemaFieldValue.type()} but get type of ${typeof dataFieldValue} `
          );
        }

        if (
          isRequired(schemaFieldValue) &&
          checkForPremitiveValues(schemaFieldValue.type, dataFieldValue) &&
          typeof schemaFieldValue.default === 'undefined'
        ) {
          throwError(
            ` Field "${schemaField}" expected type of ${typeof schemaFieldValue.type()} but get type of ${typeof dataFieldValue} `
          );
        }
        if (
          typeof dataFieldValue !== 'undefined' &&
          !isRequired(schemaFieldValue) &&
          checkForPremitiveValues(schemaFieldValue.type, dataFieldValue)
        ) {
          throwError(
            ` Field "${schemaField}" expected type of ${typeof schemaFieldValue.type()} but get type of ${typeof dataFieldValue} `
          );
        }
      } else if (checkForPremitiveValues(schemaFieldValue, dataFieldValue)) {
        throwError(
          ` Field "${schemaField}" expected type of ${typeof schemaFieldValue()} but get type of ${typeof dataFieldValue} `
        );
      }
    }
  }
};
