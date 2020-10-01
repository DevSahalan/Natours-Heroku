import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async data => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users//updateMe',
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', 'User Updated Succesfully');
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (error) {
    showAlert('error', 'Failed to update,Please try again');
  }
};
