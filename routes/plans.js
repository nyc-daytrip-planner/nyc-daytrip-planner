import { Router } from 'express';
const router = Router();
import { planData } from '../data/plans.js'
import { plans } from '../config/mongoCollections.js';
import { checkId } from '../helpers.js';

router.route('/') // main page
  .get(async (req, res) => {
    try {
      const userId = req.session.user._id
      const date = req.query.date || new Date().toISOString().split('T')[0]

      const plans = await planData.getPlanByDate(userId, date)
      res.render('planner', { title: 'Planner', plans, date })
    } catch (e) {
      // if no plan found for that date just render empty calendar
      res.render('planner', {
        title: 'Planner',
        plans: [],
        date: new Date().toISOString().split('T')[0]
      })
    }
  })
  .post(async (req, res) => { // DONE
    // this will give the user the ability to create a new plan 
    try {
      const userId = req.session.user._id

      if (!req.body) return res.status(400).render('error', { error: 'No data provided' })
      const { title, date, isPublic, locations } = req.body

      const plan = await planData.newPlan(userId, title, date, isPublic, locations)
      res.redirect(`/plans/${plan._id}`)
    } catch (e) {
      res.status(e.status || 500).render('error', { error: e.message || e })
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

router.route('/:planId') // plan specific page
  .get(async (req, res) => { // DONE
    // this will retrieve a plan specified by the user on the frontend
    try {
      const userId = req.session.user._id
      const planId = checkId(req.params.planId)

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

      if (!req.body) return res.status(400).render('error', { error: 'No data provided' })
      const { title, date, status, isPublic } = req.body

      const plan = await planData.newPlan(userId, title, date, isPublic, locations)
      res.redirect(`/plans/${plan._id}`)
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
  .get((req, res) => { // DONE
    // this will retrive all of the activities/locations of a specific plan
  })
  .post((req, res) => { // DONE
    // add an activity to a plan
  })

router.route(':planId/activities/:activityId')
  .put((req, res) => { // DONE
    // update a activity and its parameters
  })
  .delete((req, res) => { // DONE
    // delete a specific activity
  })

export default router;