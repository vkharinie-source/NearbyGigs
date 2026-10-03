import API from './api';

export const reviewService = {
  getUserReviews: async (userId) => {
    const res = await API.get(`/reviews/user/${userId}`);
    return res.data;
  },

  createReview: async (reviewData) => {
    const res = await API.post('/reviews', reviewData);
    return res.data;
  },
};
