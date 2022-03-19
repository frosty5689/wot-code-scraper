const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Push = require('pushover-notifications');
const p = new Push( {
  user: process.env['PUSHOVER_USER'],
  token: process.env['PUSHOVER_TOKEN'],
  // httpOptions: {
  //   proxy: process.env['http_proxy'],
  //},
  // onerror: function(error) {},
  // update_sounds: true // update the list of sounds every day - will
  // prevent app from exiting.
})
const codes_r_us_page_1 = 'http://forum.worldoftanks.com/index.php?/topic/605553-codes-r-us/page__pid__12143305#entry12143305';


const get_codes = async () => {
  const response = await axios.get(codes_r_us_page_1);
  const dom = new JSDOM(response.data);
  const firstPost = dom.window.document.querySelectorAll("div.post.entry-content")[0];
  const codeLinks = firstPost.querySelectorAll("[href*='bonus_mode=']");
  const foundCodes = [];
   codeLinks.forEach(link =>  {
    foundCodes.push(link.href.replace('https://na.wargaming.net/shop/redeem/?bonus_mode=', ''));
   })

  return foundCodes;
}

const check_codes = async() => {
  const seen_codes = fs.existsSync('./seen.txt') ? JSON.parse(fs.readFileSync('./seen.txt').toString()) : {};

  const codes = await get_codes();
  const new_codes = codes.filter(code => !seen_codes[code]);
  if (new_codes.length) {
    p.send( {
      title: `New WOT Codes found: ${new_codes.length}`,
      message: new_codes.map(code => `- https://na.wargaming.net/shop/redeem/?bonus_mode=${code}`).join('\n') 
    }, function( err, result ) {
      if ( err ) {
        throw err
      }
    });
    new_codes.forEach(code => seen_codes[code] = true);
    
    fs.writeFileSync('./seen.txt', JSON.stringify(seen_codes));
    console.log(`New codes found: ${new_codes}`);
  }
}

check_codes();