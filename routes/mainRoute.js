import express from 'express';
import fs from 'fs';
import cheerio from 'cheerio';
import rp from 'request-promise';
import request from 'request';
import util from 'util';
import colors from 'colors';
import Product from '../models/product';

const router = express.Router();

const baseUrl = 'http://www.shopping.com/products';
const pageUrl = baseUrl + '~PG-';

var getRemainingTotal = function(pageIdx, keyword) {
  return rp({
      "method": "GET",
      "uri": pageUrl + pageIdx + '?KW=' + keyword, 
      "json": true
    })
    .then(function(html) {
      const $ = cheerio.load(html);

      let items = $('#searchResultsContainer > form > div.gridBox.deal').length;

      if(items == 0) return 0;

      console.log(colors.yellow(`processing page ${pageIdx}...`));

      return getRemainingTotal(pageIdx + 1, keyword)
        .then(restOfTheItems => {
          return items + restOfTheItems;
        });
    })
    .catch(function(err) {
      return err;
    })
}

function getTotalResults(keyword, req, res, next) {
  console.log(colors.yellow('processing page 1'));
  request(baseUrl + '?KW=' + keyword, function(err, response, html) {
    if(err) {
      throw err;
    }

    const $ = cheerio.load(html);
    let items = $('#searchResultsContainer > form > div.gridBox').length;

    /*
    fs.writeFile('./src/dataFile2.html', items, function(err) {
      if(err) {
        console.error(colors.red(err));
        return;
      }
    });
    */

    getRemainingTotal(2, keyword)
      .then(function(remainingTotal) {
        items += remainingTotal;
        
        console.log('items ========>', items);
        let product = {
          "category": keyword,
          "count": items
        };

        Product.saveProduct(product, function(err) {
          if(err) {
            console.log(colors.red('err while inserting to DB', err));
            return;
          } else {
            res.json({
              keyword: keyword,
              totalResults: items
            });
          }
        });
        
        console.log(colors.cyan('Scraping DONE!!!'));
      })
      .catch(function (err) {  
        console.log(colors.red(err));
        throw err;
      });
  });
};

function processDOM($, items, req, res) {
  let products = [];

  Object.keys(items).forEach(function(key) {
    if(isNaN(parseInt(key)) == false) {
      let item = items.get(key);
      let image_src = $(item).find('.gridItemTop > a > img').attr('src');
      let product_name = $(item).find('.gridItemTop > a > img').attr('alt');
      let product_price = $(item).find('.gridItemBtm').find('.productPrice > a').text().trim();
      let merchant = $(item).find('.gridItemBtm').find('.newMerchantName').text();

      let product = {
        image_src: image_src,
        product_name: product_name,
        product_price: product_price,
        merchant: merchant
      };

      products.push(product);
    }

  });
  
  if(products.length == 0) products.push({});
  res.json(products);
}

function getPageResults(keyword, pageIdx, req, res, next) {
  console.log(colors.yellow(`Scraping started`));
  request(pageUrl + pageIdx + '?KW=' + keyword, function(err, response, html) {
    if(err) {
      throw err;
    }

    const $ = cheerio.load(html);
    let items = $('#searchResultsContainer > form > div.gridBox');
    processDOM($, items, req, res);
  });
};

router.get('/query1', function(req, res, next) {
  let keyword = req.query.KW;

  Product.getProductWithCategory(keyword, function(err, product) {
    if(err) {
      console.log(colors.red(`err while fetching total products of category: ${keyword}`, err));
      getTotalResults(keyword, req, res, next);

    } else {
      console.log('product', product);
      if(typeof product == 'undefined' || !product) {
        getTotalResults(keyword, req, res, next);
      } else {
        res.json({
          keyword: keyword,
          totalResults: product.count
        });
      }
    }
  });

});

router.get('/query2', function(req, res, next) {
  let keyword = req.query.KW,
      pageIdx = req.query.PG;
  
  getPageResults(keyword, pageIdx, req, res, next);
});

export default router;