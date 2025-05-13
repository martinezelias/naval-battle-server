const errors = {
    "missing_game_id": "Game id missing",
    "game_not_found": "Game {0} not found",
    "cannot_join_game_that_has_two_players": "Cannot join because the game already has 2 players",
    "invalid_player_number": "Invalid player number",
    "player_key_mismatch": "Player key doesn't match",
    "value_missing_in_request_body": "Value missing in request body",
    "value_not_modifiable_by_player": "Value not modifiable by the player",
    "cannot_modify_status_value_when_playing": "Cannot modify the status value when it is 'playing'",
    "cannot_modify_status_value_when_player_has_not_all_ships_positioned": "Cannot modify the status value because the player has not all ships positioned",
    "cannot_place_ships_when_player_is_ready_or_playing": "Cannot place ships when the player is ready or playing",
    "missing_ship_name": "Ship name missing",
    "invalid_ship_name": "Invalid ship name: {0}",
    "missing_ship_direction": "Ship direction missing",
    "missing_ship_position": "Ship position missing",
    "invalid_ship_position": "Invalid ship position",
    "missing_parameters": "Parameters missing",
    "not_the_player_turn": "It is the turn of player {0}, not your turn",
    "position_already_touched": "The position x={0} y={1} is already touched, shoot another slot",
    "url_not_available": "URL {0} not available",
    "cannot_access_url_from_player": "Cannot access URL {0} from player {1}",
    "player_already_deleted": "The player {0} has already been deleted"
};
function buildError() {
    function format(id_and_params) {
        let text = errors[id_and_params[0]];
        let args = Array.prototype.slice.call(id_and_params, 1);
        return text.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
            ? args[number] 
            : match
        ;
        });
    };
    return {
        id: arguments[0],
        description: errors[arguments[0]] && format(arguments)
    }
}
module.exports = {
    buildError
};