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
  }
}
