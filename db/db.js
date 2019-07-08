const { getConnection, query } = require('./conn');
const mysql = require('mysql');

/**
 * @param {Object} param - this is object param
 * @param {string} param.filter - this is property param
 * @param {'ASC'|'DESC'} param.order - this is property param
 * @returns {Promise<{id:number, country:string, city:string}[]>}
 */
exports.getLocations = async ({ filter, order }) => {
    let sql = 'SELECT id, country, city FROM location';
    if (filter) {
        sql = mysql.format(`${sql} WHERE country LIKE ?`, `%${filter}%`);
    }
    if (order) {
        order = order.toUpperCase();
        if (order === 'ASC' || order === 'DESC') {
            sql = `${sql} ORDER BY country ${order}, city ${order}`;
        }
    }

    return await query(sql);
}

/**
 * @returns {Promise<{id:number, country:string, city:string}[]>}
 */
exports.getTopThreeLocations = async () => {
    return await query(`SELECT location.id, country, city 
    FROM (
        SELECT count(*) AS counter, location_id FROM booking 
        JOIN room ON booking.room_id = room.id
        GROUP BY location_id
        ORDER BY counter DESC
        LIMIT 3) AS top_location
    JOIN location ON location.id = top_location.location_id;`);
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

exports.bookRoom = async (locationId, start, end, type) => {
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