const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});
const app = require('./app');

const dataBase = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose.connect(dataBase).then(()=>{
    console.log('Database connected!');
});

const port = process.env.PORT || 4000;

const server = app.listen(port, ()=>{
    console.log(`App running on port ${port}`);
});



