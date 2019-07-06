const express = require('express');
const { getLocations, getAvailableRooms, book } = require('./db/db');
const app = express();
const port = 3000;

app.get('/api/locations', async (req, res) => {
    try {
        const result = await getLocations();
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/api/availability', async (req, res) => {
    try {
        const { location_id, start, end } = req.query;
        const result = await getAvailableRooms(location_id, start, end);
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/api/book', async (req, res) => {
    try {
        const { location_id, start, end, type } = req.query;
        if (!locationId && !start && !end && !type) {
            // need to handle
            return;
        }
        const result = await book(location_id, start, end, type);
        res.send(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));