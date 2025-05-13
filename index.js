const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 80;
// Módulo de juego
const navalBattle = require('./naval-battle/modules/navalBattle');
const navalBattleApi = express.Router();
navalBattleApi.route('*').all((req, res, next) => {
    console.log("Petición " + req.method + " a " + req.url);
    next();
});
navalBattleApi.route('/')
    .post((req, res) => {
        let result = navalBattle.postAction(req);
        if (result.cookies) {
            for (let cookie in result.cookies) {
                res.cookie(cookie, result.cookies[cookie]);
            }
        }
        res.status(result.status).json(result.body);
    })
    .all((req, res) => {
        res.status(400).send({error: "Game id missing"});
    });
navalBattleApi.route('/:game_id*')
    .all((req, res, next) => {
        let result = {};
        if (req.cookies && req.cookies.player_num) {
            if (req.cookies.player_key) {
                if (!req.query.no_refresh_last_seen) {
                    navalBattle.refreshPlayerLastSeen(req);
                } else {
                    req.url = req.path;
                }
                next();
            } else {
                result.status = 400;
                result.body = {error: "Player key cookie missing"};
            }
        } else {
            result.status = 400;
            result.body = {error: "Player number cookie missing"};
        }
        res.status(result.status).send(result.body);
    })
    .get((req, res) => {
        let result = navalBattle.state(req);
        res.status(result.status).json(result.body);
    })
    .put((req, res) => {
        let result = navalBattle.changeValue(req);
        res.status(result.status).json(result.body);
    })
    .patch((req, res) => {
        let result = navalBattle.patch(req);
        res.status(result.status).json(result.body);
    });
navalBattleApi.route('/:game_id/chat_messages')
    .post((req, res) => {
        let result = {};
        if (req.body) {
            if (req.body.message) {
                if (req.cookies && req.cookies.player_num) {
                    if (req.cookies.player_key) {
                        result = navalBattle.postChatMessage(req);
                    } else {
                        result.status = 400;
                        result.body = {error: "Player key cookie missing"};
                    }
                } else {
                    console.log("[Chat] Falta cookie player_num en la solicitud.");
                    console.log("[Chat] -> req.cookies:");
                    console.log(req.cookies);
                    console.log("[Chat] <- Hasta acá");
                    result.status = 400;
                    result.body = {error: "Player number cookie missing"};
                }
            } else {
                console.log("[Chat] Falta propiedad message en el body en un mensaje POST /chat_messages");
                console.log("[Chat] -> req.body:");
                console.log(req.body);
                console.log("[Chat] <- Hasta acá");
                result.status = 400;
                result.body = {error: "Falta propiedad message en el body"};
            }
        } else {
            console.log("[Chat] Falta body en un mensaje POST /chat_messages");
            result.status = 400;
            result.body = {error: "Falta body"};
        }
        res.status(result.status).json(result.body);
    });
// Inclusión de módulos de express
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
// Configuración de servidor estático de archivos
app.use('/', express.static('naval-battle/public'));
// API Rest URL
app.use('/api', navalBattleApi);

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));