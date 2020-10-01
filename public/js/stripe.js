/* global Stripe */
const stripe = Stripe(
  'pk_test_51HWvaLDxyZSIZ01Z2emIxOWjaUR7GNSxtWcMkyMs5MHicMIJwo1GithAdUjJndlycXkT9ffNONkfgLaho6UyGgqy00HRNd0G5n'
);
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-sessions/${tourId}`);
    console.log(session);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
