const express = require('express')
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3'});
const OAuth2 = google.auth.OAuth2;
const credencial = require('./credentials/youtube.json').installed
const fs = require('fs')
const content = {
    title : 'Testando API',
    description: 'testando'
}
async function Start() {

    await Setup();
    const videoInformation = await UploadVideo(content);
    await UploadThumbnail(videoInformation);
    console.log('Tudo Concluido com Sucesso!')

async function Setup() {
    const WebServer = await IniciarWebServer();
    const OAuthClient = await autenticarComAuth();
    requisitarConteudoUser(OAuthClient);
    const authCode = await aguardarGoogleCallback(WebServer);
    await requisitarGooglePeloAccessToken(OAuthClient, authCode);
    setGlobalGoogleAuthentication(OAuthClient);
    await StopWebServer(WebServer);

    async function IniciarWebServer() {
        return new Promise((resolve, reject) => {
            const port = 5000;
            const app = express();
            
            const server = app.listen(port, () => {
                console.log('Servidor Ligado com Sucesso!')

                resolve({
                    app,
                    server
                })
            })
        })
    }

    async function autenticarComAuth() {
        const OAuthClient = new OAuth2(
            credencial.client_id, 
            credencial.client_secret, 
            credencial.redirect_uris[0]
            )

        return OAuthClient;
    }

    async function requisitarConteudoUser(OAuthClient) {
        const UrlConsenso = OAuthClient.generateAuthUrl({
            access_type: "offline",
            scope: ['https://www.googleapis.com/auth/youtube']
        })

        console.log('> Por favor envie seu Consenso: ' + UrlConsenso)
    }

    async function aguardarGoogleCallback(WebServer) {
        return new Promise((resolve, reject) => {
            console.log('> Aguardando Consentimento do Usuario....')

            WebServer.app.get('/oauth2callback', (req, res) => {
                const authCode = req.query.code;

                console.log('Codigo Concedido: ' + authCode);

                res.send('<h1> Obrigado pelo Consentimento! </h1>')

                resolve(
                    authCode
                )
            })

        })
    }

    async function requisitarGooglePeloAccessToken(OAuthClient, authCode) {
        return new Promise((resolve, reject) =>{ 
            OAuthClient.getToken(authCode, (error, tokens) => {
                if (error) {
                    return reject(error)
                }

                console.log("Tokens Adquiridos: ")
                console.log(tokens)

                OAuthClient.setCredentials(tokens)

                resolve()
            })
        })
    }

    function setGlobalGoogleAuthentication(OAuthClient) {
        google.options({
            auth: OAuthClient
        })
    }

    async function StopWebServer(WebServer) {
        return new Promise((resolve, reject) => {
            WebServer.server.close(() => {
                resolve()
            })
        })
    }

}

async function UploadVideo(content) {
    const videoFilePath = './content/output.mp4';
    const videoFileSize = fs.statSync(videoFilePath).size;
    const videoTitle = `${content.title}`
    const videoDescription = content.description
    const requestData = {
        part: 'snippet, status',
        requestBody: {
            snippet : {
                title: videoTitle,
                description: videoDescription
            },
            status: {
                privacyStatus: 'unlisted'
            }},
            media: {
                body: fs.createReadStream(videoFilePath)
            }
        
    }

    function onUploadProgress(event) {
        const progress = Math.round( (event.bytesRead / videoFileSize) * 100)
        console.log(progress +"% Concluido")
    }

    const youtubeResponse = await youtube.videos.insert(requestData, {onUploadProgress: onUploadProgress})

    console.log('> Video Enviado com Sucesso em: https://youtu.be/'+ youtubeResponse.data.id)
    return await youtubeResponse.data;

}

async function UploadThumbnail(videoInformation) {
    const videoId = videoInformation.id;
    const videoThumbnailFilePath = './content/youtube-thumbnail.png';

    const requestData = {
        videoId: videoId,
        media: {
            mimeType: 'image/png',
            body: fs.createReadStream(videoThumbnailFilePath)
        }
    }

    const youtubeResponse = await youtube.thumbnails.set(requestData);
    console.log('> Upload com Sucesso!')
}

}

Start()