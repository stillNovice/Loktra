import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import colors from 'colors';

import mainRoute from '../routes/mainRoute';

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

app.listen(PORT, () => {
  console.log(colors.green(`app started @ ${PORT}`));
});