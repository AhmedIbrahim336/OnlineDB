const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


function initDB(dbName) {
  if (!dbName) throwError('DB name is required'.bgRed);
  // check if the main `OnlineDB` file exist
  if (!fs.existsSync('./OnlineDB')) fs.mkdirSync('./OnlineDB');
  // all files and folders should be lowercase
  let validDBName = dbName.toLowerCase();
  // check if the exist
  if (!fs.existsSync(`./OnlineDB/${validDBName}`))
    fs.mkdirSync(`./OnlineDB/${validDBName}`);
}
function isDocExist(collectionPath) {
  return fs.existsSync(collectionPath);
}

function docNotFoundError() {
  throw new Error("Document doesn't exist");
}

function throwError(message) {
  throw new Error(message);
}

function getDataJson(collectionPath) {
  const allDocs = fs.readFileSync(collectionPath);
  return JSON.parse(allDocs);
}

function writeData(data, collectionPath) {
  if (!data) this._throwError("Data isn't exist ");
  fs.writeFileSync(collectionPath, JSON.stringify(data));
}

// ['age']
function checkSeclect(selectArray) {
  let isSelect = !selectArray[0].startsWith('-') ? true : false;
  let currentState = isSelect;

  for (let field of selectArray) {
    if (
      (isSelect && field.startsWith('-')) ||
      (!isSelect && !field.startsWith('-'))
    )
      throwError('"Select" can only select on remove value  '.red);
  }
}

function getRelatedCollection(dbName, collectionName) {
  const PATH = `./OnlineDB/${dbName}/${collectionName}.onlinedb.db`;

  if (!fs.existsSync(PATH)) {
    throwError(` "${collectionName}" Doesn't exist on your database `.bgRed);
  }

  return getDataJson(PATH);
}

function printDB() {
  const database = fs.readdirSync('./OnlineDB');
  console.log(database);
  process.exit(0);
}

function printCollections() {
  if (!process.argv[3])
    return console.log('showCol should have a database name after it '.bgBlue);

  // database name
  const db = process.argv[3];
  // check if the db exist
  const PATH = `./OnlineDB/${db}`;
  if (!fs.existsSync(PATH))
    return console.log(` "${db}" database Doesn't exist `.bgBlue);
  const files = fs.readdirSync(PATH);
  let collections = [];

  for (let file of files) {
    collections.push(file.split('.')[0]);
  }
  console.log(collections);
  process.exit(0);
}

function dropDB() {
  if (!process.argv[3])
    return console.log(
      ` You should provide the database name to drop it `.bgBlue
    );
  // check if it exist
  const db = process.argv[3];
  const PATH = `./OnlineDB/${db}`;
  if (!fs.existsSync(PATH))
    return console.log(` "${db}" Doesn't exist `.bgBlue);

  // remove it
  rl.question(
    'Are You Sure ( this operation is permanent )?[y/n] ',
    function (answer) {
      if (answer.toLocaleLowerCase() === 'y') {
        fs.rmdirSync(PATH, { recursive: true });
        console.log(`"${db}" Database deleted`.bgCyan);
      }
      rl.close();
    }
  );

  rl.on('close', function () {
    console.log('BYE BYE !!!'.bgCyan);
    process.exit(0);
  });
}

function removeCollection() {
  if (!process.argv[3] || !process.argv[4]) {
    console.log(
      'Missing argument -> remove <database name> <collection name> '.bold
    );
    process.exit(0);
  }

  const dbName = process.argv[3];
  const collectionName = process.argv[4];

  // check if the db exist
  if (!fs.existsSync(`./OnlineDB/${dbName}`)) {
    console.log(`"${dbName}" isn't exist`);
    process.exit(0);
  }
  // check if the collection exist
  const PATH = `./OnlineDB/${dbName}/${collectionName}`;

  if (!fs.existsSync(PATH)) {
    console.log(
      ` "${collectionName}" doesn't exist on the "${dbName}" database `.bgBlue
    );
    process.exit(0);
  }

  // confirm
  // remove it
  rl.question(
    'Are You Sure ( this operation is permanent )?[y/n] ',
    function (answer) {
      if (answer.toLocaleLowerCase() === 'y') {
        // delete the document
        fs.rmdirSync(PATH, { recursive: true });
        console.log(`"${collectionName}" collection deleted`.bgCyan);
      }
      rl.close();
    }
  );

  rl.on('close', function () {
    console.log('BYE BYE !!!'.bgCyan);
    process.exit(0);
  });
}

function clearDB() {
  const PATH = './OnlineDB';
  // check if there is any dbs
  if (!fs.existsSync(PATH)) {
    console.log(`You don't have any databases yet.`.bgCyan);
    process.exit(0);
  }
  // confirm
  rl.question(
    'Are You Sure ( this operation is permanent )?[y/n] ',
    function (answer) {
      if (answer.toLocaleLowerCase() === 'y') {
        // delete
        fs.rmdirSync(PATH, { recursive: true });
        console.log(`All databases are delted now`.bgCyan);
      }
      rl.close();
    }
  );
}

function checkForArrayExactMatch(first, second) {
  if (first.length !== second.length) return false;

  for (let i = 0; i < first.length; i++) {
    if (first[i] !== second[i]) {
      return false;
    }
  }

  return true;
}
function checkForArrayAnyMatch(first, second) {
  for (let secondItem of second) {
    for (let firstItem of first) {
      if (firstItem === secondItem) return true;
    }
  }
  return false;
}

function checkForArrayOpertors(query) {
  const ARRAY_OPERATORS = ['$add', '$pop', '$replace', '$remove'];
  if (!(query instanceof Object) || Object.keys(query).length === 0)
    throwError(
      ` To update and array. You must provide an object with one of array operators ${JSON.stringify(
        ARRAY_OPERATORS
      )} `.bgRed
    );
  const arraySet = new Set(ARRAY_OPERATORS);

  if (Object.keys(query).length > 1)
    throwError(`To query an array you should pass one operator`.bgRed);

  for (let param in query) {
    if (!arraySet.has(param))
      throwError(
        `Invalid array operator (${param}). Should be one of these ${JSON.stringify(
          ARRAY_OPERATORS
        )}`.bgRed
      );

    if (!(query[param] instanceof Array) && param !== '$pop')
      throwError(
        ` ${param} operator should have type Array but get type ${typeof query[
          param
        ]}`.bgRed
      );
  }
}

module.exports = {
  isDocExist,
  docNotFoundError,
  throwError,
  getDataJson,
  writeData,
  initDB,
  checkSeclect,
  getRelatedCollection,
  printDB,
  printCollections,
  dropDB,
  removeCollection,
  clearDB,
  checkForArrayExactMatch,
  checkForArrayAnyMatch,
  checkForArrayOpertors,
};
