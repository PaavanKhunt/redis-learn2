import express from 'express';
import axios from 'axios';
import { createClient } from 'redis';
import { rootHandler, helloHandler } from './handlers';

const redisClient = createClient();

redisClient.connect();

const app = express();
const port = process.env.PORT || 8080;

app.get('/', rootHandler);
app.get('/hello/:name', helloHandler);

app.get('/photos', async (req, res) => {
  const response = await redisClient.get('photos');
  const photos = response ? JSON.parse(response) : null;

  if (!!photos.length) {
    console.log('Found in cache', photos);

    return res.json(JSON.parse(response));
  } else {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos`
    );
    await redisClient.set('photos', JSON.stringify(data));
    res.json(data);
  }
});

app.get('/photos/:id', async (req, res) => {
  const response = await redisClient.get(`photos/${req.params.id}`);

  const { id } = req.params;
  const photo = response ? JSON.parse(response) : null;
  if (photo.id === req.params.id) {
    console.log('Found in cache', photo);

    return res.json(JSON.parse(response));
  } else {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${id}`
    );
    await redisClient.set(`photos/${req.params.id}`, JSON.stringify(data));
    res.json(data);
  }
});

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
