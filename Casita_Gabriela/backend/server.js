import express from 'express';
import { PrismaClient } from './generated/prisma/client.js'; 
const app = express()
const port = 6969
const prisma = new PrismaClient();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})