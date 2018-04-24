import express from 'express';
import fs from 'fs';
import cheerio from 'cheerio';
import rp from 'request-promise';
import request from 'request';
import util from 'util';
import colors from 'colors';

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
      //console.log(html);
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
  console.log(colors.cyan(`Scraping started`));
  request(baseUrl + '?KW=' + keyword, function(err, response, html) {
    if(err) {
      throw err;
    }

    const $ = cheerio.load(html);
    let items = $('#searchResultsContainer > form > div.gridBox.deal').length;
    console.log(items);
    
    //return;
    getRemainingTotal(2, keyword)
    .then(function(total) {
      items += total;
      res.json({
        "total search results": items
      });

      console.log('total items', items, 38 * 20);
    })
    .catch(function (err) {  
      console.log(colors.red(err));
    });
  });
};

function processDOM($, items, req, res) {
  Object.keys(items).forEach(function(key) {
    //console.log(key + ' ' + parseInt(key));
    if(isNaN(parseInt(key)) == false) {
      let item = items.get(key);
      let image_src = $(item).find('.gridItemTop > a > img').attr('src');
      let image_alt = $(item).find('.gridItemTop > a > img').attr('alt');
      let product_price = $(item).find('.gridItemBtm').find('.productPrice > a').text();
      let merchant = $(item).find('.gridItemBtm').find('.newMerchantName').text();
      console.log(merchant);
    }
  });

  return;
  ul.get(0).children.forEach(function(elem, idx) {
    let name = $(elem).children().find('h4.head_title').text();
    let number_rating = $(elem).children().find('span.number_rating').text();
    let thumbs_up = $(elem).children().find('div a.per_votes').text();
    let image_src = $(elem).children().first().find('img').attr('src');
    let yrs_exp = $(elem).children().first().find('span.yrs_exp').text();
    
    let ratings = {
      number_rating: number_rating,
      thumbs_up: thumbs_up
    };

    // features
    let features = [];
    $(elem).children().first().next().find('div.mob_list_fetr li').each((idx, thisElem) => {
      features.push($(thisElem).find('span.txt').text());
    });
    
    // working days
    let working_days = {};
    let dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $(elem).children().first().next().find('div.location li.working_days li').each((idx, thisElem) => {
      working_days[dayOfWeek[idx]] = $(thisElem).hasClass('off') ? false: true;
    });

    // work timings
    let work_timings = $(elem).children().first().next().find('div.location li.working_days span.wrk_timing').text();
    
    // services;
    let services_types = '';
    $(elem).children().first().next().first().find('div.location li.list_jobs a').each((idx, thisElem) => {
      services_types += $(thisElem).text();
    });

    // service ratings
    let service_quality_ratings = {};
    $(elem).children().first().next().find('li.clearfix').each((idx, thisElem) => {
      service_quality_ratings[$(thisElem).text().replace("\"", '')] = $(thisElem).find('ul.review_rate span.active').length;
    });

    // location - name, distance
    let location_data = {}
    location_data.distance = $(elem).children().first().next().next().find('div.location_distance div.distance span').first().next().text();
    location_data.name = $(elem).children().first().next().next().find('div.location_distance div.location span').text();

    let listing = {
      name: name,
      image_src: image_src,
      ratings: ratings,
      features: features,
      working_days: working_days,
      work_timings: work_timings,
      services_types: services_types,
      service_quality_ratings: service_quality_ratings,
      location_data: location_data
    };

    //console.log(listing);
    listingsArr.push(listing);
  });
}

function getPageResults(keyword, pageIdx, req, res, next) {
  console.log(colors.yellow(`Scraping started`));
  request(pageUrl + pageIdx + '?KW=' + keyword, function(err, response, html) {
    if(err) {
      throw err;
    }

    const $ = cheerio.load(html);
    let items = $('#searchResultsContainer > form > div.gridBox');
    //console.log(items);
    processDOM($, items, req, res);
  });
};

router.get('/query1', function(req, res, next) {
  let keyword = req.query.KW;
  getTotalResults(keyword, req, res, next);
});

router.get('/query2', function(req, res, next) {
  let keyword = req.query.KW,
      pageIdx = req.query.PG;
  
  getPageResults(keyword, pageIdx, req, res, next);
});

export default router;