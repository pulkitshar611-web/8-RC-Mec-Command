const express = require('express');
const router = express.Router();

router.get('/categories', (req, res) => {
    res.json(["Logistics", "Operations", "Personnel", "Intelligence"]);
});

module.exports = router;
