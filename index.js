const express = require('express');
const router = require('./router');
const morgan = require('morgan');
const app = express();
const port = 3000;

app.use(morgan('tiny'))
app.use(router);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));