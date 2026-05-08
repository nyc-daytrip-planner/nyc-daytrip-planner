import { Router } from 'express';
const router = Router();
import planData from '../data/plans.js'

router.route('/') // main page
  .get(async (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0]
    try {
      const userId = req.session.user._id
      const plan = await planData.getPlanByDate(userId, date)
      res.render('planner', { title: 'Planner', plan, date })
    } catch (e) {
      // no plan found for that date — render empty planner
      res.render('planner', { title: 'Planner', plan: null, date })
    }
  })
  .post(async (req, res) => { // DONE
    // this will give the user the ability to create a new plan
    const fallbackDate = req.body?.date || new Date().toISOString().split('T')[0]
    try {
      const userId = req.session.user._id

      if (!req.body) return res.status(400).render('error', { error: 'No data provided' })
      const { title, date, locations } = req.body
      const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true

      const plan = await planData.newPlan(userId, title, date, isPublic, locations)
      res.redirect(`/plans?date=${plan.date}`)
    } catch (e) {
      res.status(e.status || 400).render('planner', {
        title: 'Planner',
        plan: null,
        date: fallbackDate,
        error: e.message || e
      })
    }
  });

router.get('/all', async (req, res) => { // DONE
  // this will retrieve all of the saved plans belonging to the logged-in user 
  try {
    const userId = req.session.user._id
    const plans = await planData.getAllPlans(userId)

    res.render('plans', { title: 'My Plans', plans })
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
})

router.post('/activities', async (req, res) => {
  try {
    const userId = req.session.user._id
    const { planId, locationId, startTime, endTime, notes } = req.body

    const plan = await planData.getPlanById(planId)
    if (plan.userId.toString() !== userId)
      return res.status(403).render('error', { error: 'Unauthorized' })

    await planData.addActivity(planId, locationId, startTime, endTime, notes)
    res.redirect(`/plans/${planId}`)
  } catch (e) {
    res.status(e.status || 500).render('error', { error: e.message || e })
  }
})

router.route('/:planId') // plan specific page
  .get(async (req, res) => { // DONE
    // this will retrieve a plan specified by the user on the frontend
    try {
      const userId = req.session.user._id
      const planId = req.params.planId

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      res.render('plans', { title: 'Current Plan', plan })
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })
  .put(async (req, res) => { // DONE
    // update the time, change date, etc. of a pre-existing plan
    try {
      const userId = req.session.user._id
      const planId = req.params.planId

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      if (!req.body) return res.status(400).render('error', { error: 'No data provided' })
      const { title, date, status, isPublic } = req.body

      const updatedPlan = await planData.updatePlan(planId, { title, date, status, isPublic })
      res.redirect(`/plans/${updatedPlan._id}`)
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })
  .delete(async (req, res) => { // DONE
    // delete a plan
    try {
      const userId = req.session.user._id
      const planId = req.params.planId
      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      await planData.deletePlan(planId)
      res.redirect('/plans')
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })

router.route('/:planId/activities')
  .get(async (req, res) => { // DONE
    // this will retrive all of the activities/locations of a specific plan
    try {
      const userId = req.session.user._id
      const planId = req.params.planId

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      res.render('activities', { title: 'Plan Activities', activities: plan.activities })  // use plan.activities directly
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })
  .post(async (req, res) => { // DONE
    // add an activity to a plan
    try {
      const userId = req.session.user._id
      const planId = req.params.planId
      const { locationId, startTime, endTime, notes } = req.body

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      await planData.addActivity(planId, locationId, startTime, endTime, notes)
      res.redirect(`/plans/${planId}`)
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })

router.route('/:planId/activities/:activityId')
  .put(async (req, res) => { // DONE
    // update a activity and its parameters
    try {
      const userId = req.session.user._id
      const { planId, activityId } = req.params
      const { startTime, endTime, notes } = req.body

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      await planData.updateActivity(planId, activityId, { startTime, endTime, notes })
      res.redirect(`/plans/${planId}`)
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })
  .delete(async (req, res) => { // DONE
    // delete a specific activity
    try {
      const userId = req.session.user._id
      const { planId, activityId } = req.params

      const plan = await planData.getPlanById(planId)
      if (plan.userId.toString() !== userId)
        return res.status(403).render('error', { error: 'Unauthorized' })

      await planData.deleteActivity(planId, activityId)
      res.redirect(`/plans/${planId}`)
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
    }
  })

export default router;