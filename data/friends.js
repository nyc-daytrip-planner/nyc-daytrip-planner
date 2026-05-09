import { friends, users, plans } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkId } from "../helpers.js";

const exportedMethods = {
  async sendFriendReq(reqId, recId) {
    // sending friend requests to friends
    reqId = checkId(reqId)
    recId = checkId(recId)

    if (reqId === recId) throw { status: 400, message: 'Cannot send friend request to yourself' }

    const friendCollection = await friends()

    const existing = await friendCollection.findOne({
      $or: [
        { reqId: new ObjectId(reqId), recId: new ObjectId(recId) },
        { reqId: new ObjectId(recId), recId: new ObjectId(reqId) }
      ]
    })
    if (existing) throw { status: 400, message: 'Friend request already exists' }

    const newRequest = {
      reqId: new ObjectId(reqId),
      recId: new ObjectId(recId),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await friendCollection.insertOne(newRequest)
    if (!result.acknowledged) throw { status: 500, message: 'Could not send friend request' }

    return { ...newRequest, _id: result.insertedId }
  },

  async acceptFriendReq(friendId) {
    // accepting received friend request
    friendId = checkId(friendId)

    const friendCollection = await friends()
    const result = await friendCollection.updateOne(
      { _id: new ObjectId(friendId), status: 'pending' },
      {
        $set: {
          status: 'accepted',
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) throw { status: 404, message: 'Friend request not found or already accepted' }

    return { friendId, status: 'accepted' }
  },

  async declineFriendReq(friendId) {
    // POST decline friend req
    friendId = checkId(friendId)

    const friendCollection = await friends()
    const result = await friendCollection.updateOne(
      { _id: new ObjectId(friendId), status: 'pending' },
      {
        $set: {
          status: 'declined',
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) throw { status: 404, message: 'Friend request not found or already declined' }

    return { friendId, status: 'declined' }
  },

  async getFriends(userId) {
    // get friends of the current user
    userId = checkId(userId)

    const friendCollection = await friends()
    const friendships = await friendCollection.find({
      $or: [
        { reqId: new ObjectId(userId) },
        { recId: new ObjectId(userId) }
      ],
      status: 'accepted'
    }).toArray()

    // get the other user's id from each friendship
    const friendIds = friendships.map(f =>
      f.reqId.toString() === userId ? f.recId : f.reqId
    )

    // fetch user details for each friend
    const userCollection = await users()
    const friendList = await userCollection.find({
      _id: { $in: friendIds }
    }).toArray()

    return friendList
  },

  async getPendingReq(userId) {
    // GET incoming reqs
    userId = checkId(userId)

    const friendCollection = await friends()
    const pending = await friendCollection.find({
      recId: new ObjectId(userId),
      status: 'pending'
    }).toArray()

    return pending
  }
}

export default exportedMethods