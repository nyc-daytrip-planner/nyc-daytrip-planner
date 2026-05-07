import { plans } from '../config/mongoCollections.js'
import { ObjectId } from 'mongodb'
import { checkId, checkDate, checkString, checkTime } from '../helpers.js'

// What kind of querying:
// - empty query (handled on frontend?)
// - retrieve all of user's plans
// - retrieve specific plans by id
// - update specific plan by id
// - delete a plan by id

const exportedMethods = {
  async getAllPlans(userId) { // 'plans/all' route
    userId = checkId(userId)
    const planCollection = await plans()
    return await planCollection.find({ userId }).toArray()
  },

  async getPlanById(plan_id) {
    plan_id = checkId(plan_id)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ _id: new ObjectId(plan_id) })

    if (!plan) throw "Error: Plan not found"

    return plan
  },

  async getPlanActivities(plan_id) {
    plan_id = checkId(plan_id)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ _id: new ObjectId(plan_id) })

    if (!plan) throw "Error: Plan not found"

    return plan.activities
  },

  async getPlanByDate(userId, date) {
    userId = checkId(userId)
    date = checkDate(date)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ userId, date })

    if (!plan) throw "Error: Plan not found"

    return plan
  },

  async newPlan(userId, title, date, isPublic = false, locations = []) {
    userId = checkId(userId)
    title = checkString(title)
    date = checkDate(date)

    if (typeof isPublic != 'boolean') throw "Error: must be boolean"

    let activities = []

    if (locations.length > 0) {
      activities = locations.map(({ locationId, startTime, endTime, notes = null }) => ({
        locationId: new ObjectId(checkId(locationId)),
        startTime: startTime || null,
        endTime: endTime || null,
        notes
      }))
    }

    const newPlan = {
      userId: new ObjectId(userId),
      title,
      date,
      status: 'active',
      isPublic,
      activities,
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const planCollection = await plans()
    const newInsert = await planCollection.insertOne(newPlan)
    const newId = newInsert.insertedId
    return await this.getPlanById(newId.toString())
  },

  async addActivity(planId, locationId, startTime, endTime, notes = "") {
    planId = checkId(planId)
    locationId = checkId(locationId)
    startTime = checkTime(startTime)
    endTime = checkTime(endTime)

    if (typeof notes != 'string') throw "Error: notes must be of type string"

    const newActivity = {
      locationId: new ObjectId(locationId),
      startTime,
      endTime,
      notes
    }

    const planCollection = await plans()
    const result = await planCollection.updateOne(
      { _id: new ObjectId(planId) },
      {
        $push: { activities: newActivity },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) throw "Error: could not add activity"

    return await this.getPlanById(planId)
  }

}
