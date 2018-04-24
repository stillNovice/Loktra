import express from 'express';
import mongoose from 'mongoose';
import request from 'request-promise';
import bodyParser from 'body-parser';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import colors from 'colors';

import config from '../config/config';

import mainRoute from '../routes/mainRoute';

const mongo_url = config.mongo_url;
const db_name = config.db_name;

// connect database
mongoose.connect(mongo_url + db_name, function(err) {
  if(err) {
    throw err;
  }
  console.log(colors.green(`connected to ${db_name} database`));
});

const PORT = process.env.PORT | 9100;
const app = express();

// setup morgan logger
app.use(morgan('dev'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());
app.use(cookieParser());

// setup static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', mainRoute);

let server = app.listen(PORT, () => {
  console.log(colors.green(`app started @ ${PORT}`));
});

// set server time out because recursive request take some time to process.
server.setTimeout(1000 * 60 * 10);
