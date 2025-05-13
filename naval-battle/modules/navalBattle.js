// Naval Battle module for API Rest server.
// By Elías Martínez
// GitHub: https://github.com/martinezelias
const fs = require('fs');
const { generateHash } = require('./randomBytes');
const { buildError } = require('./navalBattleErrors');
const MAX_GAME_AMOUNT = 900000;
const NUM_INDEX_START = 1;
const NUM_INDEX_LENGTH = 10;
const CHAR_INDEX_START = "a";
const CHAR_INDEX_LENGTH = 10;
const CHAR_CODE_INDEX_START = CHAR_INDEX_START.charCodeAt(0);
const SHIP_LENGTHS = {
    carrier: 5,
    vessel: 4,
    submarine: 3,
    cruise: 3,
    launch: 2
};
const DIRECTIONS = ["horizontal", "vertical"];
const MODIFIABLE_VALUES = [/\/(\d|[A-Za-z]|-){1,}\/players\/((0\/status)|(1\/board\/\d\/\d))\/?/, // For Player 0
                           /\/(\d|[A-Za-z]|-){1,}\/players\/((1\/status)|(0\/board\/\d\/\d))\/?/  // For Player 1
];
function shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
function generateShuffledGameIds() {
    let unassigned_game_ids = [];
    for (let i = 0; i < MAX_GAME_AMOUNT; i++) {
        unassigned_game_ids[i] = i + 100000;
    }
    shuffle(unassigned_game_ids);
    return unassigned_game_ids;
}
function createFileWithContentIfNotExists(name, content_generator) {
    if (!fs.existsSync(__dirname + '/../data/')) {
        fs.mkdirSync(__dirname + '/../data/');
    }
    if (!fs.existsSync(__dirname + '/../data/' + name)) {
        console.log('File ' + name + ' does not exist. Trying to create it...');
        let content = content_generator();
        try {
            fs.writeFileSync(__dirname + '/../data/' + name, JSON.stringify(content), {encoding: 'utf8'});
            console.log('File ' + name + ' created successfully.');
        } catch (err) {
            console.error('Error when creating ' + name + ' file.');
            console.error(err);
        }
    }
}
function createDataFilesIfNotExists() {
    createFileWithContentIfNotExists("unassigned_game_ids.json", generateShuffledGameIds);
    createFileWithContentIfNotExists("games.json", () => {return {}});
}
function getUnassignedGameId() {
    createDataFilesIfNotExists();
    let unassigned_game_ids = JSON.parse(fs.readFileSync(__dirname + '/../data/unassigned_game_ids.json', {encoding: 'utf8'}));
    let first_unassigned_game_id = unassigned_game_ids.shift();
    fs.writeFileSync(__dirname + '/../data/unassigned_game_ids.json', JSON.stringify(unassigned_game_ids), {encoding: 'utf8'});
    return first_unassigned_game_id;
}
function getAllGames() {
    createDataFilesIfNotExists();
    return JSON.parse(fs.readFileSync(__dirname + '/../data/games.json', {encoding: 'utf8'}));
}
function getGame(game_id) {
    return getAllGames()[game_id];
}
function saveGame(id, state) {
    let games = getAllGames();
    games[id] = state;
    fs.writeFileSync(__dirname + '/../data/games.json', JSON.stringify(games), {encoding: 'utf8'});
}
function postAction(request) {
    let result = {};
    let body = request.body;
    if (body && body.action) {
        let action = body.action;
        let data = body.data;
        if (action == "create") {
            let create_game_result = createGame(data);
            let new_game_id = create_game_result.game_id;
            let new_game = create_game_result.game;
            result.status = 200;
            result.cookies = {
                player_num: 0,
                player_key: new_game.players[0].key
            };
            result.body = {
                game_id: new_game_id,
                game: getStateFromPlayer(new_game, 0, new_game.players[0].key)
            };
            saveGame(new_game_id, new_game);
        } else if (data && data.game_id !== undefined && data.game_id !== "") {
                if (action == "join") {
                    let game;
                    if (game = getGame(data.game_id)) {
                        result = joinGame(game, data);
                        saveGame(data.game_id, game);
                    } else {
                        result.status = 404;
                        result.body = {error: buildError("game_not_found", data.game_id)};
                    }
                } else if (action == "quit") {
                    result = quitGame(request);
                }
        } else {
            result.status = 400;
            result.body = {error: buildError("missing_game_id")};
        }
    } else {
        result.status = 204;
    }
    return result;
}
function patch(request) {
    let result = {};
    let url = request.url;
    let cookies = request.cookies;
    let data = request.body;
    if (data.action == "place_ship") {
        result = state(request);
        if (result.status == 200) {
            result = placeShip(request);
        }
    } else if (data.action == "shoot") { // La acción fue un disparo del jugador en el tablero
        result = shoot(request);
    }
    return result;
}
function shoot(request) {
    let result = {};
    let game_id = request.params.game_id;
    let url = request.url;
    let cookies = request.cookies;
    let data = request.body;
    let values = getValuesFromUrl(url);
    let player_num = cookies.player_num;
    let player_key = cookies.player_key;
    let player_to_shoot = values[2];
    let y = values[4];
    let x = values[5];
    if (player_to_shoot !== undefined && y !== undefined && x !== undefined) {
        let game;
        if (game = getGame(game_id)) {
            if (game.players[player_num].key == player_key) {
                if (MODIFIABLE_VALUES[cookies.player_num].test(url)) {
                    let turn = game.turn;
                    if (player_num == turn) {
                        if (!game.players[player_to_shoot].data.board[y][x].touched) {
                            game.players[player_to_shoot].data.board[y][x].touched = true;
                            game.turn = turn === 0 ? 1 : 0;
                            let type = game.players[player_to_shoot].data.board[y][x].type;
                            if (type == "water") {
                                result.body = {result: "water"};
                            } else {
                                if (++game.players[player_to_shoot].data.ships[type].touches == SHIP_LENGTHS[type]) {
                                    let ship = game.players[player_to_shoot].data.ships[type];
                                    result.body = {result: "sunken", position: ship.position, direction: ship.direction, length: SHIP_LENGTHS[type]};
                                    let all_sunken = true;
                                    for (let ship in game.players[player_to_shoot].data.ships) {
                                        if (game.players[player_to_shoot].data.ships[ship].touches !== SHIP_LENGTHS[ship]) {
                                            all_sunken = false;
                                            break;
                                        }
                                    }
                                    if (all_sunken) {
                                        game.state = "finished";
                                        game.winner = turn;
                                    }
                                } else {
                                    result.body = {result: "touched"};
                                }
                            }
                            saveGame(game_id, game);
                            result.status = 200;
                        } else {
                            result.status = 400;
                            result.body = {error: buildError("position_already_touched", x, y)};
                        }
                    } else {
                        result.status = 403;
                        result.body = {error: buildError("not_the_player_turn", turn)};
                    }
                } else {
                    result.status = 403;
                    result.body = {error: buildError("value_not_modifiable_by_player")};
                }
            } else {
                result.status = 403;
                result.body = {error: buildError("player_key_mismatch")};
            }
        } else {
            result.status = 404;
            result.body = {error: buildError("game_not_found", game_id)};
        }
    } else {
        result.status = 400;
        result.body = {error: buildError("missing_parameters")};
    }
    return result;
}
function placeShip(request) {
    let result = {};
    let game_id = request.params.game_id;
    let url = request.url;
    let cookies = request.cookies;
    let data = request.body;
    let values = getValuesFromUrl(url);
    let game = getGame(game_id);
    let ship = values[4];
    let player_num = cookies.player_num;
    if (game.players[player_num].data.status === "not_ready") {
        if (ship !== undefined) {
            if (ship in SHIP_LENGTHS) {
                if ((data.direction !== undefined) && (data.direction === false || DIRECTIONS.includes(data.direction))) {
                    let direction = data.direction;
                    if (data.position !== undefined) {
                        let position = data.position;
                        if (direction === false || position === false || isValidPosition(ship, position, direction)) {
                            let player_data = game.players[player_num].data;
                            let board = player_data.board;
                            if (player_data.ships && player_data.ships[ship] && player_data.ships[ship].position && player_data.ships[ship].direction) {
                                let previous_position = player_data.ships[ship].position;
                                let dir = player_data.ships[ship].direction;
                                if (dir == "horizontal") {
                                    for (let i = previous_position[1]; i < previous_position[1] + SHIP_LENGTHS[ship]; i++) {
                                        board[previous_position[0]][i] = {type: "water", touched: false};
                                    }
                                } else if (dir == "vertical") {
                                    for (let i = previous_position[0]; i < previous_position[0] + SHIP_LENGTHS[ship]; i++) {
                                        board[i][previous_position[1]] = {type: "water", touched: false};
                                    }
                                }
                            }
                            let valid_position = true;
                            if (direction === false || position === false) {
                                player_data.ships[ship].position = false;
                                player_data.ships[ship].direction = false;
                                console.log("[placeShip] Ship " + ship + " removed");
                            } else {
                                //let object = {type: ship, touched: false};
                                if (direction == "horizontal") {
                                    for (let i = position[1]; i < position[1] + SHIP_LENGTHS[ship]; i++) {
                                        let box = board[position[0]][i];
                                        if (box && box.type != "water" && box.type != ship) {
                                            valid_position = false;
                                            break;
                                        }
                                    }
                                    if (valid_position) {
                                        for (let i = position[1]; i < position[1] + SHIP_LENGTHS[ship]; i++) {
                                            board[position[0]][i] = {type: ship, touched: false};
                                        }
                                    }
                                } else if (direction == "vertical") {
                                    for (let i = position[0]; i < position[0] + SHIP_LENGTHS[ship]; i++) {
                                        let box = board[i][position[1]];
                                        if (box && box.type != "water" && box.type != ship) {
                                            valid_position = false;
                                            break;
                                        }
                                    }
                                    if (valid_position) {
                                        for (let i = position[0]; i < position[0] + SHIP_LENGTHS[ship]; i++) {
                                            board[i][position[1]] = {type: ship, touched: false};
                                        }
                                    }
                                }
                                if (valid_position) {
                                    player_data.ships[ship].position = [position[0], position[1]];
                                    player_data.ships[ship].direction = direction;
                                    console.log("[placeShip] Ship " + ship + " placed at position " + position[0] + ", " + position[1]);
                                } else {
                                    player_data.ships[ship].position = false;
                                    player_data.ships[ship].direction = false;
                                    console.log("[placeShip] Ship " + ship + " removed");
                                }
                            }
                            for (let i = 0; i < CHAR_INDEX_LENGTH; i++) {
                                console.log("[placeShip] " + strInPos(board, i, 0) + " " + strInPos(board, i, 1) + " " + strInPos(board, i, 2) + " " + strInPos(board, i, 3) + " " + strInPos(board, i, 4) + " " + strInPos(board, i, 5) + " " + strInPos(board, i, 6) + " " + strInPos(board, i, 7) + " " + strInPos(board, i, 8) + " " + strInPos(board, i, 9));
                            }
                            saveGame(game_id, game);
                            result.status = valid_position ? 200 : 400;
                            result.body = {all_ships_positioned: allShipsPositioned(player_data)};//{status: result.status, game_state: getStateFromPlayer(data.game_id, data.player_num, data.player_key)};
                        } else {
                            result.status = 400;
                            result.body = {error: buildError("invalid_ship_position")};
                        }
                    } else {
                        result.status = 400;
                        result.body = {error: buildError("missing_ship_position")};
                    }
                } else {
                    result.status = 400;
                    result.body = {error: buildError("missing_ship_direction")};
                }
            } else {
                result.status = 400;
                result.body = {error: buildError("invalid_ship_name", ship)};
            }
        } else {
            result.status = 400;
            result.body = {error: buildError("missing_ship_name")};
        }
    } else {
        result.status = 400;
        result.body = {error: buildError("cannot_place_ships_when_player_is_ready_or_playing")};
    }
    return result;
}
function changeValue(request) {
    let result = {};
    const data = request.body;
    if (data.value !== undefined) {
        let url = request.url;
        let cookies = request.cookies;
        result = state(request);
        if (result.status == 200) {
            let game_id = request.params.game_id;
            let values = getValuesFromUrl(url);
            let player_key = cookies.player_key;
            let game = getGame(game_id);
            if (game.players[cookies.player_num].key == player_key) {
                if (MODIFIABLE_VALUES[cookies.player_num].test(url)) {
                    let player_num = cookies.player_num;
                    if (!values[3] || values[3] !== "status" || (allShipsPositioned(game.players[player_num].data) && game.players[player_num].data.status !== "playing")) {
                        let full_game_state = game;
                        for (let i = 1; i < values.length - 1; i++) {
                            full_game_state = full_game_state[values[i]];
                            full_game_state.data && (full_game_state = full_game_state.data);
                        }
                        full_game_state[values[values.length - 1]] = data.value;
                        result.body = {changed: true};
                        updateGameState(game);
                        saveGame(game_id, game);
                    } else {
                        result.status = 403;
                        if (allShipsPositioned(getGame(game_id).players[player_num].data)) {
                            result.body = {error: buildError("cannot_modify_status_value_when_playing")};
                        } else {
                            result.body = {error: buildError("cannot_modify_status_value_when_player_has_not_all_ships_positioned")};
                        }
                    }
                } else {
                    result.status = 403;
                    result.body = {error: buildError("value_not_modifiable_by_player")};
                }
            } else {
                result.status = 403;
                result.body = {error: buildError("player_key_mismatch")};
            }
        }
    } else {
        result.status = 400;
        result.body = {error: buildError("value_missing_in_request_body")};
    }
    return result;
}
function state(request) {
    let game_id = request.params.game_id;
    let url = request.url;
    let cookies = request.cookies;
    let values = getValuesFromUrl(url);
    let result = {};
    let full_game_state = getGame(game_id);
    let state_from_player = getStateFromPlayer(full_game_state, cookies.player_num, cookies.player_key, request.query.get_opponent_board);
    if (!request.query.no_refresh_last_seen) {
        saveGame(game_id, full_game_state);
    }
    if (state_from_player) {
        if (state_from_player.error) {
            result.status = 400;
            result.body = state_from_player;
        } else {
            for (let i = 1; i < values.length; i++) {
                full_game_state !== undefined && (full_game_state = full_game_state[values[i]]);
                full_game_state !== undefined && full_game_state.data && (full_game_state = full_game_state.data);
                state_from_player !== undefined && (state_from_player = state_from_player[values[i]]);
            }
            if (full_game_state !== undefined) {
                if (state_from_player !== undefined) {
                    result.status = 200;
                    result.body = typeof state_from_player == "number" ? state_from_player.toString() : state_from_player;
                } else {
                    result.status = 403;
                    result.body = {error: buildError("cannot_access_url_from_player", url, cookies.player_num)};
                }
            } else {
                result.status = 404;
                result.body = {error: buildError("url_not_available", url)};
            }
        }
    } else {
        result.status = 404;
        result.body = {error: buildError("game_not_found", game_id)};
    }
    return result;
}
function createGame(data) {
    let new_game = {
        state: "waiting_for_player",
        players: [
            createPlayer(data)
        ],
        turn: undefined,
        chat_messages: []
    };
    let new_game_id = getUnassignedGameId();
    return {
        game_id: new_game_id,
        game: new_game
    };
}
function createPlayer(data) {
    return {
        key: generateHash(32),
        data: {
            name: (data && data.player_name) || false,
            status: "not_ready",
            last_seen: Date.now(),
            ships: {launch: createShipInfo(), cruise: createShipInfo(), submarine: createShipInfo(), vessel: createShipInfo(), carrier: createShipInfo()},
            board: createBoard(),
            disconnected: false
        }
    }
}
function createBoard() {
    let new_board = [];
    for (let i = 0; i < CHAR_INDEX_LENGTH; i++) {
        new_board[i] = [];
        for (let j = 0; j < NUM_INDEX_LENGTH; j++) {
            new_board[i][j] = {type: "water", touched: false};
        }
    }
    return new_board;
}
function createShipInfo() {
    return {position: false, direction: false, touches: 0};
}
function reconnectPlayer(player, data) {
    player.key = generateHash(32);
    player.data.name = (data && data.player_name) || false;
    player.data.disconnected = false;
}
function getConnectedPlayersCount(game) {
    let connected_players_count = 0;
    for (let i = 0; i < 2; i++) {
        let player = game.players[i];
        if (player && !player.data.disconnected) {
            connected_players_count++;
        }
    }
    return connected_players_count;
}
function joinGame(game, data) {
    let result;
    let assigned_player_num;
    let join_succeeded = false;
    for (let i = 0; i < 2; i++) {
        let player = game.players[i];
        if (!player || player.data.disconnected) {
            if (!join_succeeded) {
                join_succeeded = true;
                if (!player) {
                    game.players[i] = createPlayer(data);
                } else {
                    reconnectPlayer(player, data);
                }
                assigned_player_num = i;
            }
        }
    }
    updateGameState(game);
    if (join_succeeded) {
        result = {
            status: 200,
            cookies: {
                player_num: assigned_player_num,
                player_key: game.players[assigned_player_num].key
            },
            body: {
                game_id: data.game_id,
                game: getStateFromPlayer(game, assigned_player_num, game.players[assigned_player_num].key, true)
            }
        };
    } else {
        result = {
            status: 403,
            body: {error: buildError("cannot_join_game_that_has_two_players")}
        };
    }
    return result;
}
function quitGame(request) {
    let result = {};
    let body = request.body;
    let game_id = body.data.game_id;
    let cookies = request.cookies;
    let game = getGame(game_id);
    let player_access_check = checkPlayerAccess(game, cookies.player_num, cookies.player_key);
    if (player_access_check) {
        if (!player_access_check.error) {
            let game = getGame(game_id);
            if (!game.players[cookies.player_num].data.disconnected) {
                game.players[cookies.player_num].data.disconnected = true;
                if (game.state != "finished") {
                    game.state = "waiting_for_player";
                }
                saveGame(game_id, game);
                result.status = 200;
                result.body = {deleted: true};
            } else {
                result.status = 400;
                result.body = {error: buildError("player_already_deleted", cookies.player_num)};
            }
        } else {
            result.status = 403;
            result.body = player_access_check;
        }
    } else {
        result.status = 404;
        result.body = {error: buildError("game_not_found", game_id)};
    }
    return result;
}
function isValidPlayer(game, player_num) {
    return player_num >= 0 && player_num < game.players.length;
}
function getMaskedType(player_data, slot) {
    if (slot.touched) {
        if (slot.type == "water") {
            return "water";
        } else {
            return player_data.ships[slot.type].touches == SHIP_LENGTHS[slot.type] ? "sunken": "touched";
        }
    } else {
        return;
    }
}
function getMaskedBoard(player_data) {
    let masked_board = [];
    for (let i = 0; i < CHAR_INDEX_LENGTH; i++) {
        masked_board[i] = [];
        for (let j = 0; j < NUM_INDEX_LENGTH; j++) {
            masked_board[i][j] = getMaskedType(player_data, player_data.board[i][j]);
        }
    }
    return masked_board;
}
function checkPlayerAccess(game, player_num, player_key) {
    if (game) {
        if (isValidPlayer(game, player_num)) {
            if (game.players[player_num].key == player_key) {
                return true;
            } else {
                return {error: buildError("player_key_mismatch")};
            }
        } else {
            return {error: buildError("invalid_player_number")};
        }
    } else {
        return false;
    }
}
function getStateFromPlayer(game, player_num, player_key, get_opponent_board) {
    let player_access_check = checkPlayerAccess(game, player_num, player_key);
    if (player_access_check && !player_access_check.error) {
        let game_state = {
            state: game.state,
            players: [],
            turn: game.turn,
            chat_messages: getMenssagesToSend(game, player_num),
            winner: game.winner
        };
        for (let i = 0; i < game.players.length; i++) {
            game_state.players[i] = (i == player_num) ? game.players[player_num].data : {
                name: game.players[i].data.name,
                status: game.players[i].data.status,
                board: get_opponent_board ? getMaskedBoard(game.players[i].data) : undefined,
                online_state: !game.players[i].data.disconnected ? (Date.now() - game.players[i].data.last_seen < 5000 ? "online" : "absent") : "disconnected"
            };
        }
        return game_state;
    } else {
        return player_access_check;
    }
}
function updateGameState(game) {
    if (getConnectedPlayersCount(game) > 1) {
        let players = game.players;
        if (players[0].data.status !== "not_ready" && players[1].data.status !== "not_ready") {
            if (players[0].data.status === "playing" && players[1].data.status === "playing") {
                game.state = "in_game";
                if (game.turn === undefined) {
                    game.turn = 0;
                }
            } else {
                game.state = "starting";
            }
        } else {
            for (let i = 0; i < players.length; i++) {
              if (players[i].data.status === "playing") game.players[i].data.status = "ready";
            }
            game.state = "waiting_the_ready";
        }
    }
}
function isValidPosition(ship, position, direction) {
    return Array.isArray(position) && (position.length == 2) && position[0] >= 0 && position[1] >= 0 && position[0] < ((direction == "vertical") ? (11 - SHIP_LENGTHS[ship]) : 10) && position[1] < ((direction == "horizontal") ? (11 - SHIP_LENGTHS[ship]) : 10);
}
function strInPos(board, y, x) {
    return board[y][x] ? (board[y][x].type != "water" ? board[y][x].type.substr(0,5).toUpperCase() : board[y][x].type.substr(0,5)) : board[y][x];
}
function allShipsPositioned(player_data) {
    let all_positioned = true;
    for (let ship in SHIP_LENGTHS) {
        if (player_data.ships[ship].position === false || player_data.ships[ship].direction === false) {
            all_positioned = false;
            break;
        }
    }
    return all_positioned;
}
function refreshPlayerLastSeen(request) {
    let game_id = request.params.game_id;
    let cookies = request.cookies;
    let game = getGame(game_id);
    let player_access_check = checkPlayerAccess(game, cookies.player_num, cookies.player_key);
    if (player_access_check && !player_access_check.error) {
        let game = getGame(game_id);
        game.players[cookies.player_num].data.last_seen = Date.now();
        saveGame(game_id, game);
    }
}
function getValuesFromUrl(url) {
    let values = url.split("/");
    values.shift(0);
    if (!(values[values.length - 1])) values.pop();
    return values;
}
function getMenssagesToSend(game, player_num) {
    let messages_to_send = [];
    for (let i = 0; i < game.chat_messages.length; i++) {
        if (!game.chat_messages[i].seen[player_num]) {
            messages_to_send.push(game.chat_messages[i]);
            game.chat_messages[i].seen[player_num] = true;
        }
    }
    game.chat_messages = game.chat_messages.filter((message) => !message.seen[0] || !message.seen[1]);
    return messages_to_send;
}
function postChatMessage(request) {
    let url = request.url;
    let cookies = request.cookies;
    let data = request.body;
    let result = state(request);
    if (result.status == 200) {
        let values = getValuesFromUrl(url);
        let game_id = values[0];
        let game = getGame(game_id);
        game.chat_messages.push({from: cookies.player_num, from_name: data.from_name, message: data.message, seen: [false, false]});
        result.body = getMenssagesToSend(game, cookies.player_num);
        saveGame(game_id, game);
    }
    return result;
}
createDataFilesIfNotExists();

module.exports = {
    changeValue,
    postAction,
    patch,
    postChatMessage,
    state,
    refreshPlayerLastSeen
}