import { Router } from 'express';
import { pool } from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO budgets(user_id, category_id, amount, month, year)
       SELECT $1, prior.category_id, GREATEST(0.01, prior.amount - GREATEST(0, COALESCE(SUM(t.amount), 0) - prior.amount)),
              EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int
       FROM budgets prior
       LEFT JOIN transactions t ON t.user_id = prior.user_id
         AND t.category_id = prior.category_id AND t.type = 'EXPENSE'
         AND date_trunc('month', t.date) = make_date(prior.year, prior.month, 1)
       WHERE prior.user_id = $1
         AND make_date(prior.year, prior.month, 1) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date
         AND NOT EXISTS (SELECT 1 FROM budgets current_budget
           WHERE current_budget.user_id = $1 AND current_budget.category_id = prior.category_id
             AND current_budget.month = EXTRACT(MONTH FROM CURRENT_DATE)
             AND current_budget.year = EXTRACT(YEAR FROM CURRENT_DATE))
       GROUP BY prior.id, prior.category_id, prior.amount
       HAVING prior.amount - GREATEST(0, COALESCE(SUM(t.amount), 0) - prior.amount) > 0
       ON CONFLICT(user_id, category_id, month, year) DO NOTHING`,
      [req.user.id]
    );
    const result = await pool.query(
      `SELECT c.name AS category, c.color, b.amount::text AS amount,
              COALESCE(SUM(t.amount), 0)::text AS spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
        AND t.category_id = b.category_id
        AND t.type = 'EXPENSE'
        AND date_trunc('month', t.date) = make_date(b.year, b.month, 1)
       WHERE b.user_id = $1
         AND b.month = EXTRACT(MONTH FROM CURRENT_DATE)
         AND b.year = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY b.id, c.id
       ORDER BY c.name`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { category, amount } = req.body || {};
    const limit = Number(amount);
    if (typeof category !== 'string' || !category.trim() || !Number.isFinite(limit) || limit <= 0 || limit > 999999999) {
      return res.status(400).json({ success: false, message: 'Choose a category and enter a valid monthly limit.' });
    }
    const result = await pool.query(
      `WITH selected_category AS (
         SELECT c.id FROM categories c
         WHERE c.name = CASE
           WHEN lower($2) IN (lower($4), lower($5)) THEN $6
           WHEN lower($2) = lower($7) THEN $8
           ELSE $2 END
           AND c.type = 'EXPENSE'
           AND (c.user_id = $1 OR c.user_id IS NULL)
         ORDER BY (c.user_id = $1) DESC
         LIMIT 1
       ), saved AS (
         INSERT INTO budgets(user_id, category_id, amount, month, year)
         SELECT $1, id, $3, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int
         FROM selected_category
         ON CONFLICT(user_id, category_id, month, year)
         DO UPDATE SET amount = EXCLUDED.amount
         RETURNING id, user_id, category_id, amount
       )
       SELECT c.name AS category, c.color, saved.amount::text AS amount,
              COALESCE(SUM(t.amount), 0)::text AS spent
       FROM saved JOIN categories c ON c.id = saved.category_id
       LEFT JOIN transactions t ON t.user_id = saved.user_id
         AND t.category_id = saved.category_id AND t.type = 'EXPENSE'
         AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)
       GROUP BY saved.id, saved.amount, c.id`,
      [req.user.id, category.trim(), limit, 'Food & drink', 'Food and drink', 'Food', 'Housing', 'Rent']
    );
    if (!result.rowCount) return res.status(400).json({ success: false, message: 'That spending category is unavailable.' });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

export default router;
