import { users, plans } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"
import { checkId } from "../helpers.js"

const exportedMethods = {
  async sendFriendReq(reqId, recId) {
    reqId = checkId(reqId)
    recId = checkId(recId)

    if (reqId === recId) throw { status: 400, message: 'Cannot send friend request to yourself' }

    const userCollection = await users()

    // check if already friends or request already sent
    const requester = await userCollection.findOne({ _id: new ObjectId(reqId) })
    if (requester.friends.map(id => id.toString()).includes(recId))
      throw { status: 400, message: 'Already friends' }

    // add to recipient's pending requests
    const result = await userCollection.updateOne(
      { _id: new ObjectId(recId) },
      { $push: { pendingRequests: new ObjectId(reqId) } }
    )

    if (result.modifiedCount === 0) throw { status: 500, message: 'Could not send friend request' }

    return { status: 'pending' }
  },

  async acceptFriendReq(reqId, recId) {
    reqId = checkId(reqId)
    recId = checkId(recId)

    const userCollection = await users()

    // add each other to friends array and remove from pending
    await userCollection.updateOne(
      { _id: new ObjectId(recId) },
      {
        $push: { friends: new ObjectId(reqId) },
        $pull: { pendingRequests: new ObjectId(reqId) }
      }
    )

    await userCollection.updateOne(
      { _id: new ObjectId(reqId) },
      { $push: { friends: new ObjectId(recId) } }
    )

    return { status: 'accepted' }
  },

  async declineFriendReq(reqId, recId) {
    reqId = checkId(reqId)
    recId = checkId(recId)

    const userCollection = await users()
    const result = await userCollection.updateOne(
      { _id: new ObjectId(recId) },
      { $pull: { pendingRequests: new ObjectId(reqId) } }
    )

    if (result.modifiedCount === 0) throw { status: 404, message: 'Request not found' }

    return { status: 'declined' }
  },

  async getFriends(userId) {
    userId = checkId(userId)

    const userCollection = await users()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (!user) throw { status: 404, message: 'User not found' }

    const friendList = await userCollection.find({
      _id: { $in: user.friends }
    }).toArray()

    const planCollection = await plans()
    const friendsWithPlans = await Promise.all(
      friendList.map(async (friend) => {
        const recentPlan = await planCollection.findOne(
          { userId: friend._id, isPublic: true },
          { sort: { createdAt: -1 } }
        )
        return { ...friend, recentPlan }
      })
    )

    return friendsWithPlans
  },

  async getPendingReq(userId) {
    userId = checkId(userId)

    const userCollection = await users()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (!user) throw { status: 404, message: 'User not found' }

    const pending = await userCollection.find({
      _id: { $in: user.pendingRequests || [] }
    }).toArray()

    return pending
  }
}

export default exportedMethods