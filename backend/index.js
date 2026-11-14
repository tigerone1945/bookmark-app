const app = require('./app');
const { dbPromise } = require('./db');

const PORT = process.env.PORT || 3000;

// DBの初期化が完了してからリクエストを受け付ける
dbPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
