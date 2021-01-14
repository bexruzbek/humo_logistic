const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const language = require('../language/lang.json');
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json(language);
});

router.post('/auto', (req, res) => {
  const { newTransport } = req.body;
  fs.readFile(path.join(__dirname, '..', 'language', 'lang.json'), 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
    obj = JSON.parse(data); //now it an object
    obj.avtoType_uz.unshift({label: newTransport, value: newTransport}); //add some data
    obj.avtoType_ru.unshift({label: newTransport, value: newTransport}); //add some data
    json = JSON.stringify(obj); //convert it back to json
    fs.writeFile(path.join(__dirname, '..', 'language', 'lang.json'), json, 'utf8', (err) => {
      if(err){
        throw err;
      }
      res.status(201).json({
        success: true,
        message: "Yangi avto qo'shildi"
      });
    }); // write it back 
    }
  });

});

module.exports = router;