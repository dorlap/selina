const { promisify } = require('util');
const mysql = require('mysql');
const process = require('process');

exports.getConnection = () => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || ''
    });

    const beginTransaction = promisify(connection.beginTransaction).bind(connection);
    const commit = promisify(connection.commit).bind(connection);
    const rollback = promisify(connection.rollback).bind(connection);
    const query = promisify(connection.query).bind(connection);
    const connect = promisify(connection.connect).bind(connection);
    const end = connection.end.bind(connection);
    return { beginTransaction, commit, rollback, query, connect, end };
}

exports.query = async (sql, values) => {
    const conn = exports.getConnection();
    await conn.connect();
    try {
        return await conn.query(sql, values);
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}