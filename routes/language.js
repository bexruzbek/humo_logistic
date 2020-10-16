const { Router } = require('express');
const language = require('../language/lang.json');
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json(language);
});

module.exports = router;