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
  async getAllPlans(userId) {
    // GET
    userId = checkId(userId)
    const planCollection = await plans()
    return await planCollection.find({ userId }).toArray()
  },

  async getPlanById(plan_id) {
    // GET
    plan_id = checkId(plan_id)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ _id: new ObjectId(plan_id) })

    if (!plan) throw "Error: Plan not found"

    return plan
  },

  async getPlanActivities(plan_id) {
    // GET
    plan_id = checkId(plan_id)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ _id: new ObjectId(plan_id) })

    if (!plan) throw "Error: Plan not found"

    return plan.activities
  },

  async getPlanByDate(userId, date) {
    // GET
    userId = checkId(userId)
    date = checkDate(date)
    const planCollection = await plans()
    const plan = await planCollection.findOne({ userId, date })

    if (!plan) throw "Error: Plan not found"

    return plan
  },

  async newPlan(userId, title, date, isPublic = false, locations = []) {
    // POST
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
    // POST
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
  },

  async updatePlan(planId, { title, date, status, isPublic } = {}) {
    // PUT
    planId = checkId(planId)

    const updateFields = {}

    if (title != undefined) updateFields.title = checkString(title)
    if (date != undefined) updateFields.date = checkDate(date)
    if (status !== undefined) {
      if (!['active', 'saved', 'completed'].includes(status))
        throw "Error: invalid status"
      updateFields.status = status
    }

    if (isPublic != undefined) {
      if (typeof isPublic != 'boolean') throw "Error: must be boolean"
      updateFields.isPublic = isPublic
    }

    if (Object.keys(updateFields).length === 0) throw "Error: no fields provided to update"

    updateFields.updatedAt = new Date()

    const planCollection = await plans()
    const result = await planCollection.updateOne(
      { _id: new ObjectId(planId) },
      { $set: updateFields }
    )

    if (result.modifiedCount === 0) throw "Error: could not update plan"
    return await this.getPlanById(planId)
  },

  async updateActivity(planId, locationId, { startTime, endTime, notes } = {}) {
    // PUT
    planId = checkId(planId)
    locationId = checkId(locationId)

    const updateFields = {}

    if (startTime != undefined) updateFields.startTime = checkTime(startTime)
    if (endTime != undefined) updateFields.endTime = checkTime(endTime)
    if (notes != undefined) {
      if (typeof notes != 'string') throw "Error: notes must be of type string"
      updateFields.notes = notes
    }

    if (Object.keys(updateFields).length === 0) throw "Error: no fields provided to update"

    const planCollection = await plans()
    const result = await planCollection.updateOne(
      { _id: new ObjectId(planId), "activities.locationId": new ObjectId(locationId) },
      {
        $set: {
          ...(updateFields.startTime && { "activities.$.startTime": updateFields.startTime }),
          ...(updateFields.endTime && { "activities.$.endTime": updateFields.endTime }),
          ...(updateFields.notes && { "activities.$.notes": updateFields.notes }),
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) throw "Error: could not update plan"
    return await this.getPlanById(planId)
  },

  async deletePlan(planId) {
    // DELETE
    planId = checkId(planId)
    const planCollection = await plans()
    const deletedPlan = await planCollection.findOneAndDelete({
      _id: new ObjectId(planId)
    })
    if (!deletedPlan) throw "Error: Plan not found or could not be deleted"

    return { ...deletedPlan, deleted: true }
  },

  async deleteActivity(planId, locationId) {
    // DELETE
    planId = checkId(planId)
    locationId = checkId(locationId)

    const planCollection = await plans()
    const result = await planCollection.updateOne(
      { _id: new ObjectId(planId) },
      {
        $pull: { activities: { locationId: new ObjectId(locationId) } },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) throw "Error: could not delete activity"
    return await this.getPlanById(planId)
  }
}
