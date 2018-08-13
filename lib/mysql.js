'use strict';

const mysql       = require('mysql');
const connection  = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'carrytest',
    database : 'carry'
});

connection.connect(err => {
    if (err) throw err;

    const tableDef = 'CREATE TABLE orders (id INT(100) NOT NULL AUTO_INCREMENT, ' +
        'name VARCHAR(255), ' +
        'lastname VARCHAR(255), ' +
        'phone VARCHAR(255), ' +
        'delivery_address VARCHAR(255), ' +
        'city VARCHAR(255), ' +
        'zip VARCHAR(255), ' +
        'details VARCHAR(255), ' +
        'PRIMARY KEY(id))';

    connection.query(tableDef, (err, result) => {
        if (err) throw err;

        console.log(result);
    });
});