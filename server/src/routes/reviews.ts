
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { ReviewService } from '../services/ReviewService';

const router = express.Router();
const reviewService = new ReviewService();

router.use(requireAuth);

// Get all reviews
router.get('/', async (req: any, res) => {
    try {
        const { page, limit, status, search } = req.query;
        const accountId = (req as any).accountId;
        const result = await reviewService.getReviews(accountId, {
            page: Number(page),
            limit: Number(limit),
            status: status as string,
            search: search as string
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});



// Reply to a review
router.post('/:id/reply', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const accountId = (req as any).accountId;
        const result = await reviewService.replyToReview(accountId, id, reply);
        res.json(result);
    } catch (error) {
        console.error('Error replying to review:', error);
        res.status(500).json({ error: 'Failed to reply to review' });
    }
});

export default router;
