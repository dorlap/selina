const express = require('express');
const router = express.Router();

const { getLocations, getAvailableRooms, bookRoom, getTopThreeLocations } = require('./db/db');
const { validateDate } = require('./validation');

router.get('/api/locations', async (req, res) => {
    try {
        const result = await getLocations(req.query);
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/api/top-locations', async (req, res) => {
    try {
        const result = await getTopThreeLocations();
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/api/availability', async (req, res) => {
    try {
        const { location_id, start, end } = req.query;
        const result = await getAvailableRooms(location_id, start, end);
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/api/booking', async (req, res) => {
    try {
        const { location_id, start, end, type } = req.params;
        if (!locationId && !start && !end && !type) {
            return { status: 400, message: 'Missing params' };
        }
        if (!validateDate(start, end)) {
            return { status: 400, message: 'Date validation failed' };
        }
        const result = await bookRoom(location_id, start, end, type);
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;