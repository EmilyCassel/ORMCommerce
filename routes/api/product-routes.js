const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

router.get('/', async(req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category }, { model: Tag, through: ProductTag }] 
    });
    res.json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async(req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag, through: ProductTag }] 
    });
    if (!product) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});








// create new product
router.post('/', async(req, res) => {
  try{
    const newProduct = await Product.create(req.body);
    res.status(200).json(newProduct);
  }catch(err){
    res.status(400).json(err);
  }

  Product.create(req.body)
    .then((product) => {
      
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});



router.put('/:id', async(req, res) => {
  
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    await Product.update(req.body, {
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json(err);
  }

  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {

        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
            .filter((tag_id) => !productTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                product_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const productTagsToRemove = productTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);
          // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async(req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    await Product.destroy({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
