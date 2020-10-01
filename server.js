const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('uncaught exception.App is shutting down...');
  process.exit(1);
});

require('dotenv').config();
console.log(process.env.NODE_ENV);
// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// const DB = process.env.DATABASE_LOCAL;

// const DB =
//   'mongodb+srv://myth:AsDf1234@natours.wgdse.mongodb.net/natours?retryWrites=true&w=majority';
mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(con => {
    console.log('DB connection succesfull');
  });
// .catch(err => {
//   console.log('DB connection failed');
// });

// const newTour = new Tour({
//   name: 'kaptai river',
//   price: 7000
// });

// newTour
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log(err);
//   });

const Port = process.env.PORT || 3000;

const server = app.listen(Port, () => {
  console.log(`server is listening at port ${Port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('unhandled rejection.App is shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
