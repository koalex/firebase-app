'use strict';

const mysql       = require('mysql');
const connection  = mysql.createConnection({
    host         : 'localhost',
    port         : 3306,
    database     : 'carry',
    user         : 'carry',
    password     : 'test123',
    charset      : 'utf8',
    debug        : false
});

connection.connect(err => {
    if (err) throw err;
    console.log('Database is connected.');
});

module.exports = connection;
