import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index';

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', router);
app.listen(port, () => {
  console.log('Server running on port 5000');
});

export default app;
