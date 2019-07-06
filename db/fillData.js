const { promisify } = require('util');
const mysql = require('mysql');
const locations = require('../data/location.json');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'D19881987l?',
    database: 'selina'
});

const beginTransaction = promisify(connection.beginTransaction).bind(connection);
const query = promisify(connection.query).bind(connection);
const commit = promisify(connection.commit).bind(connection);
const rollback = promisify(connection.rollback).bind(connection);
const connect = promisify(connection.connect).bind(connection);


const createRoomData = () => {
    const types = ['Dorm', 'Private', 'Deluxe'];
    const ret = [];
    for (let i = 1; i <= locations.length; i++) {
        for (let j = 0; j < 3; j++) {
            for (let x = 0; x < 10; x++) {
                ret.push([types[j], i])
            }
        }
    }
    return ret;
}

const fillData = async () => {
    await connect();
    await beginTransaction();
    try {
        await query('INSERT INTO location (country, city) VALUES ?', [locations.map(location => Object.values(location))]);
        await query('INSERT INTO room (type, location_id) VALUES ?', [createRoomData()]);
        await commit();
    } catch (error) {
        await rollback();
        throw error;
    } finally {
        connection.end();
    }
};

fillData().then(() => console.log('succuss')).catch(console.error);