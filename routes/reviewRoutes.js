const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const { getAllReviews, createReview, deleteReview, updateReview, setTourUserIds, getReview } = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourUserIds, createReview);

router.route('/:id')
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview)
    .get(getReview);

module.exports = router;