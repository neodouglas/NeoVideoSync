const express = require('express');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios')

app.use(cookieParser());
app.use(cors());
app.listen(process.env.PORT || 5000)
const client_key = 'awzcfikpklamz5z5'
const client_secret = 'ab643a815151c2b36f8319d819953d3d'
const CLIENT_KEY = 'awzcfikpklamz5z5' // this value can be found in app's developer portal

app.get('/oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/auth/authorize';

    url += `?client_key=${CLIENT_KEY}`;
    url += '&response_type=code';
    url += '&scope=user.info.basic,video.list';
    url += '&redirect_uri=localhost:5000/linkTikTok/validate';
    url += '&state=' + csrfState;

    res.redirect(url);
})

app.get('/linkTikTok/validate', async (req, res) => {
    // Query state
    const state = req.query.state
   
    if (!state) {
     return res.status(403).send('No state found');
    }
    const code = req.query.code;
    if (!code) {
     return res.status(403).send('No code found');
    }
    const sessionCookie = req.cookies['__session'] ?? {};
    const sessionState = sessionCookie.state;
   
    if (state !== sessionState) {
     return res.status(403).send('Wrong state');
    }
   
   const URL = `https://open-api.tiktok.com/oauth/access_token`;

   const params = {
    client_key,
    client_secret,
    code,
    grant_type: 'authorization_code',
   };
   
   try {
    const result = await axios.post<any>(URL, '', {
      params,
    });
    const data = result.data.data;
    const {
      access_token: accessToken,
      refresh_token,
      refresh_expires_in,
      open_id: openId,
      expires_in,
    } = data;
   
    if (!accessToken) {
      throw new Error('No access token found');
    }
    // Application logic
    console.log(data)
   } catch {
    console.log()
   }

})