const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.error(err.name, err.message);
  console.error('UNHANDLED EXCEPTION! Shutting down...');
  process.exit(1);
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

const options = {
  useNewUrlParser: true,
};

mongoose.connect(DB, options).then((con) => {
  console.info('DB connection successful!');
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.info(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.error(err.name, err.message);
  console.error('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.info('Process terminated!');
  });
});
