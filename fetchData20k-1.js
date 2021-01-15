const { IgApiClient } = require("instagram-private-api");
const util = require("util");
require('dotenv').config();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ig = new IgApiClient();
const { spawn } = require("child_process");
const csv = require('csvtojson')

const fs = require("fs");
const { exit } = require("process");

ig.state.generateDevice("itsmemzian");

ig.state.proxyUrl = process.env.IG_PROXY;
(async () => {
    try {
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(
            process.env.INSTA_USERNAME,
            process.env.INSTA_PASSWORD
        );
    } 
    catch (err) {
        console.log("Error occured while login", err)
        await sleep(5000);
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(
            process.env.INSTA_USERNAME,
            process.env.INSTA_PASSWORD
        );
    }
    const csvWriter = createCsvWriter({
        path: 'complete.csv',
        header: [
            { id: 'pk', title: 'ID' },
            { id: 'username', title: 'User Name' },
            { id: 'is_verified', title: 'Verified Status' },
            { id: 'insta_classification_cat', title: 'Instagram Classification Category' },
            { id: 'profile_name', title: 'Profile Name' },
            { id: 'profile_photo', title: 'Profile Photo' },
            { id: 'bio', title: 'Bio' },
            { id: 'website', title: 'Website' },
            { id: 'email', title: 'Email' },
            { id: 'followers_count', title: 'Number of followers' },
            { id: 'following_count', title: 'Number of following' },
            { id: 'posts_count', title: 'Number of posts' },
            { id: 'likes_count', title: 'Number of likes' },
            { id: 'comments_count', title: 'Number of comments' },
            { id: 'videoviews_count', title: 'Number of video views' },
            { id: 'hashtags', title: 'Hashtags' },
            { id: 'usernames_tagged', title: 'Usernames tagged' },
            { id: 'captions', title: 'Caption text' },
            { id: 'date_first_post', title: 'Date of first post' }
        ]
    });
    let fileName = './100K-list.csv'
    const converter = csv()
        .fromFile(fileName)
        .then(async (json) => {
            const firstHalf = json.splice(0, 20000);
            console.log("Fetching data 0-20000, Length", firstHalf.length)
            let i = 0;
            for (let i =0; i< firstHalf.length; i++) {
                let entry = firstHalf[i]
                if (!!entry && !!entry["User Name"]) {
                    console.log("fetching complete data for user ", entry["User Name"])
                    await fetchCompleteData(entry, i)
                }
            }

        })

    async function fetchCompleteData(entity, i) {
        try {
            console.log("starting for user ", i, Date.now())
            const user = await ig.user.getIdByUsername(entity["User Name"]);
            await sleep(1000);
            const userInfo = await ig.user.info(user)
            await sleep(1000);
            const feeds = await ig.feed.user(user).items()
            await sleep(1000);
            console.log("continue for user ", i)
           
            let objToWrite = {
                pk: userInfo.pk,
                username: userInfo.username,
                is_verified: userInfo.is_verified,
                insta_classification_cat: userInfo.category,
                profile_name: userInfo.full_name,
                profile_photo: userInfo.profile_pic_url,
                bio: userInfo.biography,
                website: userInfo.external_url,
                email: userInfo.public_email,
                followers_count: userInfo.follower_count,
                following_count: userInfo.following_count,
                posts_count: userInfo.media_count,
                likes_count: 0,
                comments_count: 0,
                videoviews_count: 0,
                hashtags: [],
                usernames_tagged: [],
                captions: [],
                date_first_post: ""
            }
            objToWrite = getLast10PostDetails(feeds, objToWrite)
          
            console.log("all post fetched, now writing record", i, Date.now())

            
    
            csvWriter.writeRecords([objToWrite])       // returns a promise
            .then(() => {
            console.log('...Done write object');
            });
        }
       catch(err) {
           if (err.message.includes("wait a few minutes before"))
            console.log("error here, sleeping for 5 minutes", err)
            await sleep(300000);
            await fetchCompleteData(entity)
        }
        

    }

    // }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    function getLast10PostDetails(feeds, objToWrite) {
        if (feeds.length > 10) {
            feeds = feeds.splice(0, 10)
        }

        feeds.forEach((feed) => {
            objToWrite.likes_count += feed.like_count
            objToWrite.comments_count += feed.comment_count
            objToWrite.videoviews_count += !!feed.view_count ? feed.view_count : 0
            if (!!feed && !!feed.caption && !!feed.caption.text) {
                objToWrite.captions.push(feed.caption.text)
                let userTags = feed.caption.text.match(/@[^\s#\.:\;]*/gmi)
                if (!!userTags && !!userTags.length) {
                    objToWrite.usernames_tagged = objToWrite.usernames_tagged.concat(userTags)
                }
    
                let hashTags = feed.caption.text.match(/#[^\s#\.\;]*/gmi)
                if (!!hashTags && !!hashTags.length) {
                    objToWrite.hashtags = objToWrite.hashtags.concat(hashTags)
                }
            }
        })

        return objToWrite

    }

})().catch((err) => {
    console.log(err);
});

