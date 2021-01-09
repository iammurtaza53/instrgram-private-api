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

  const lvl2 = require("./lvl2.json");

  let lvl3 = [];

  let temp = 0;

  const half = Math.ceil(lvl2.length / 2);
  const firstHalf = lvl2.splice(0, half);
  for (let pk = 0; pk <= firstHalf.length; pk++) {
    for (let username = 0; username < firstHalf[pk].length; username++) {
      let counter = 0;
      while (counter < 3) {
        try {
          counter = counter + 1
          let data = firstHalf[pk][username];
          let obj = await ig.discover.chaining(data.pk);
          obj = obj["users"].map((item) => {
            temp = temp + 1;
            console.log(temp);
            return {
              pk: item.pk,
              username: item.username,
              parent: data.username,
            };
          });
          lvl3.push(obj).then(() => {
            fs.writeFile("lvl2.json", JSON.stringify(lvl2), function (err) {
              if (err) {
                console.log(err);
              }
            });
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
})().catch((err) => {
  console.log(err);
});
