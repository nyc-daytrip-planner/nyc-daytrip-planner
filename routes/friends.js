import { Router } from 'express'
const router = Router();
import friendData from '../data/friends.js'

router.get('/', (req, res) => {
  // GET all friends
});

router.post('/request/:userId', (req, res) => {
  // POST send friend request
});

router.post('/accept/:friendshipId', (req, res) => {
  // POST accept a friend request
});