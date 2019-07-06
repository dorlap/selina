const { promisify } = require('util');
const mysql = require('mysql');

const getConnection = () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'D19881987l?',
        database: 'selina'
    });

    const beginTransaction = promisify(connection.beginTransaction).bind(connection);
    const commit = promisify(connection.commit).bind(connection);
    const rollback = promisify(connection.rollback).bind(connection);
    const query = promisify(connection.query).bind(connection);
    const connect = promisify(connection.connect).bind(connection);
    const end = connection.end.bind(connection);
    return { beginTransaction, commit, rollback, query, connect, end };
}

const query = async (sql, values) => {
    const conn = getConnection();
    await conn.connect();
    const ret = await conn.query(sql, values);
    conn.end();
    return ret;
}

exports.getLocations = async () => {
    return await query('SELECT id, country, city from location');
}

exports.getAvailableRooms = async (locationId, start, end) => {
    return await query(`SELECT type FROM room
    WHERE location_id = ? AND id NOT IN(
    SELECT room_id FROM booking
    WHERE ((start >= ? AND start < ?)
    OR (end > ? AND end <= ?))
    OR (start < ? AND end > ?))
    GROUP BY type;
    `, [locationId, start, end, start, end, start, end]);
}

exports.book = async (locationId, start, end, type) => {
    const conn = getConnection();
    await conn.connect();
    await conn.beginTransaction();
    try {
        let ret = await conn.query(`SELECT id FROM room
        WHERE location_id = ? AND id NOT IN(
        SELECT room_id FROM booking
        WHERE ((start >= ? AND start < ?)
        OR (end > ? AND end <= ?))
        OR (start < ? AND end > ?))
        AND type = ? FOR UPDATE;
        `, [locationId, start, end, start, end, start, end, type]);
        if (!ret.length) {
            await conn.rollback();
            return false;
        }
        const { id } = ret[0];
        ret = await conn.query(`INSERT INTO booking (start, end, room_id) VALUES (?,?,?)`, [start, end, id]);
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.end();
    }
    return true;
}