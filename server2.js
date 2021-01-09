const { IgApiClient } = require("instagram-private-api");
const util = require("util");

const ig = new IgApiClient();

const fs = require("fs");

ig.state.generateDevice("aliasghernooruddin");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(
    process.env.INSTA_USERNAME,
    process.env.INSTA_PASSWORD
  );
  
  const lvl2 = require('./lvl2.json');

  let temp = 0
  
  let lvl3 = [];
  const half = Math.ceil(lvl2.length / 2);
  const secondHalf = lvl2.splice(-half)
  for (let pk = 0; pk <= secondHalf.length; pk++) {
    for (let username = 0; username < secondHalf[pk].length; username++) {
      // let data = secondHalf[pk][username]
      // let obj = await ig.discover.chaining(data.pk);
      try {
        let data = secondHalf[pk][username]
       let obj = await ig.discover.chaining(data.pk);
       obj = obj["users"].map((item) => {
        temp = temp + 1
        console.log(temp)
        return {
          pk: item.pk,
          username: item.username,
          parent: data.username,
        };
      });
      lvl3.push(obj)
      .then(() => {
        fs.writeFile("lvl2.json", JSON.stringify(lvl2), function (err) {
          if (err) {
            console.log(err);
          }
        });
      });
      } catch (error) {
        console.log(error);
      }     
  }};

})().catch((err) => {
  console.log(err);
});
