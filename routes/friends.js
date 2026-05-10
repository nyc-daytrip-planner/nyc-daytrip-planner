import { Router } from 'express'
const router = Router();
import friendData from '../data/friends.js'

router.get('/', async (req, res) => {
  // GET all friends
  try {
    const userId = req.session.user._id
    const friendsList = await friendData.getFriends(userId)
    const pending = await friendData.getPendingReq(userId)
    res.render('friends', { title: 'Friends', friendsList, pending })
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
});

router.post('/request/:userId', async (req, res) => {
  // POST send friend request
  try {
    const reqId = req.session.user._id
    const recId = req.params.userId
    await friendData.sendFriendReq(reqId, recId)
    res.redirect('/friends')
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
});

router.post('/accept/:reqId', async (req, res) => {
  // POST accept a friend request
  try {
    const recId = req.session.user._id
    const reqId = req.params.reqId
    await friendData.acceptFriendReq(reqId, recId)
    res.redirect('/friends')
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
});

router.post('/decline/:reqId', async (req, res) => {
  // POST decline a friend request
  try {
    const recId = req.session.user._id
    const reqId = req.params.reqId
    await friendData.declineFriendReq(reqId, recId)
    res.redirect('/friends')
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
});

export default router;