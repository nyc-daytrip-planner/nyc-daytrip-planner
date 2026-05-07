import { Router } from 'express';
const router = Router();

router.route('/') // main page
  .get(async (req, res) => {
    // would like this to render an empty calender for the current day on the frontend 
    res.render('planner', { title: 'Planner' });
  })
  .post(async (req, res) => {
    // this will give the user the ability to create a new plan
  });

router.get('/all', async (req, res) => {
  // this will retrieve all of the saved plans belonging to the logged-in user
})

router.route('/all/:planId') // plan specific page
  .get(async (req, res) => {
    // this will retrieve a plan specified by the user on the frontend 
  })
  .put('/all/:planId', async (req, res) => {
    // update the time, change date, etc. of a pre-existing plan
  })
  .delete('/all/:planId', async (req, res) => {
    // delete a plan
  })

router.route('/all/:planId/activities')
  .get((req, res) => {
    // this will retrive all of the activities/locations of a specific plan
  })
  .post((req, res) => {
    // add an activity to a plan
  })

router.route('all/:planId/activities/:activityId')
  .put((req, res) => {
    // update a plan and its parameters
  })
  .delete((req, res) => {
    // delete a specific activity
  })

router.get('all?date=YYYY-MM-DD', (req, res) => {
  // this will filter plans by specific day
})

export default router;