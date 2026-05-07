import { Router } from 'express';
const router = Router();

router.route('/') // main page
  .get(async (req, res) => { // DONE
    // would like this to render an empty calender for the current day on the frontend 
    res.render('planner', {
      title: 'Planner',
      date: new Date().toISOString().split('T')[0] // passes date so that frontend knows current date
    });
  })
  .post(async (req, res) => { // DONE
    // this will give the user the ability to create a new plan 
  });

router.get('/all', async (req, res) => { // DONE
  // this will retrieve all of the saved plans belonging to the logged-in user 
})

router.route('/all/:planId') // plan specific page
  .get(async (req, res) => { // DONE
    // this will retrieve a plan specified by the user on the frontend 
  })
  .put('/all/:planId', async (req, res) => { // DONE
    // update the time, change date, etc. of a pre-existing plan
  })
  .delete('/all/:planId', async (req, res) => { // DONE
    // delete a plan 
  })

router.route('/all/:planId/activities')
  .get((req, res) => { // DONE
    // this will retrive all of the activities/locations of a specific plan
  })
  .post((req, res) => { // DONE
    // add an activity to a plan
  })

router.route('all/:planId/activities/:activityId')
  .put((req, res) => { // DONE
    // update a activity and its parameters
  })
  .delete((req, res) => { // DONE
    // delete a specific activity
  })

router.get('all?date=YYYY-MM-DD', (req, res) => { // DONE
  // this will filter plans by specific day 
})

export default router;