const { getConnection, query } = require('../db/conn');
const locations = require('../data/location.json');
const types = ['Dorm', 'Private', 'Deluxe'];
const ROOM_TYPE_COUNT = 10;

const createRoomData = () => {
    const ret = [];
    for (let i = 1; i <= locations.length; i++) {
        for (let j = 0; j < types.length; j++) {
            for (let x = 0; x < 10; x++) {
                ret.push([types[j], i]);
            }
        }
    }
    return ret;
}

exports.truncateLocationRoomBooking = async () => {
    const conn = getConnection();
    await conn.connect();
    await conn.beginTransaction();
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS=0');
        await conn.query('TRUNCATE TABLE location');
        await conn.query('TRUNCATE TABLE room');
        await conn.query('TRUNCATE TABLE booking');
        await conn.query('SET FOREIGN_KEY_CHECKS=1');
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.end();
    }
}
exports.truncateBooking = async () => {
    return await query('TRUNCATE TABLE booking');
}

exports.fillDataLocationRoom = async () => {
    const conn = getConnection();
    await conn.connect();
    await conn.beginTransaction();
    try {
        await conn.query('INSERT INTO location (country, city) VALUES ?', [locations.map(location => Object.values(location))]);
        await conn.query('INSERT INTO room (type, location_id) VALUES ?', [createRoomData()]);
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.end();
    }
};

exports.insertBooking = async ({ start, end, room_id }) => {
    await query('INSERT INTO booking (start, end, room_id) VALUES (?,?,?)', [start, end, room_id]);
}

exports.insertBookingBulk = async (values) => {
    const data = values.map(({ start, end, room_id }) => ([start, end, room_id]))
    await query('INSERT INTO booking (start, end, room_id) VALUES ?', [data]);
}

exports.ROOM_TYPE_COUNT = ROOM_TYPE_COUNT;