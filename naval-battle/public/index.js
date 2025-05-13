// Índices del tablero
const CHAR_INDEX_START = "A";
const CHAR_INDEX_LENGTH = 10;
const CHAR_CODE_INDEX_START = CHAR_INDEX_START.charCodeAt(0);
const CHAR_CODE_INDEX_END = CHAR_CODE_INDEX_START + CHAR_INDEX_LENGTH;
const NUM_INDEX_START = 1;
const NUM_INDEX_LENGTH = 10;
const NUM_INDEX_END = NUM_INDEX_START + NUM_INDEX_LENGTH;
const SHIP_LENGTHS = {
    carrier: 5,
    vessel: 4,
    submarine: 3,
    cruise: 3,
    launch: 2
};
const API_URL = "/api";
const own_board = createBoard("Mar propio");
const own_board_container = document.getElementById("own_board_container");
const opposite_board = createBoard("Mar del oponente");
const opposite_board_container = document.getElementById("opposite_board_container");
const opposite_container = document.getElementById("opposite_container");
const own_board_slots = own_board.getElementsByTagName("td");
const opposite_board_slots = opposite_board.getElementsByTagName("td");
const ship_select = document.getElementById("ship_select");
const mouse_rotate_instructions = document.getElementById("mouse_rotate_instructions");
const touch_rotate_instructions = document.getElementById("touch_rotate_instructions");
const game_title = document.getElementById("game_title");
const game_join_container = document.getElementById("game_join_container");
const game_join_menu = document.getElementById("game_join_menu");
const game_container = document.getElementById("game_container");
const player_names = document.getElementById("player_names");
const player_name_input = document.getElementById("player_name_input");
const status_areas = document.getElementsByClassName("status_area");
const my_info = document.getElementById("my_info");
const my_name = document.getElementById("my_name");
const my_ready = document.getElementById("my_ready");
const ready_input = document.getElementById("ready");
const checkbox_label = document.getElementById("checkbox_label");
const checkbox_box = document.getElementById("checkbox_box");
const my_win_text = document.getElementById("my_win_text");
const my_turn = document.getElementById("my_turn");
const opponent_info = document.getElementById("opponent_info");
const opponent_name = document.getElementById("opponent_name");
const opponent_ready = document.getElementById("opponent_ready");
const opponent_preparing = document.getElementById("opponent_preparing")
const opponent_absent = document.getElementById("opponent_absent");
const opponent_win_text = document.getElementById("opponent_win_text");
const opponent_turn = document.getElementById("opponent_turn");
const start_game_join_section = document.getElementById("start_game_join_section");
const rejoin_game_join_section = document.getElementById("rejoin_game_join_section");
const create_game_button = document.getElementById("create_game");
const join_dialog_box = document.getElementById("join_dialog_box");
const game_id_input = document.getElementById("game_id_input");
const join_game_button = document.getElementById("join_game");
const rejoin_nobody_connected = document.getElementById("rejoin_nobody_connected");
const rejoin_opponent_status = document.getElementById("rejoin_opponent_status");
const rejoin_opponent_name = document.getElementById("rejoin_opponent_name");
const rejoin_opponent_connected = document.getElementById("rejoin_opponent_connected");
const rejoin_opponent_absent = document.getElementById("rejoin_opponent_absent");
const rejoin_game_button = document.getElementById("rejoin_game");
const rejoin_quit_game_button = document.getElementById("rejoin_quit_game");
const playing_quit_game_button = document.getElementById("playing_quit_game");
const chat_div = document.getElementById("chat_div");
const chat_messages = document.getElementById("chat_messages");
const chat_text_to_send_input = document.getElementById("chat_text_to_send_input");
const chat_send_message_button = document.getElementById("chat_send_message_button");
const pointerFineQuery = window.matchMedia('(pointer: fine)');
const pointerCoarseQuery = window.matchMedia('(pointer: coarse)');
own_board_container.appendChild(own_board);
opposite_board_container.appendChild(opposite_board);
let game_id;
let stored_game_id;
let game;
let my_player_num;
let opponent_player_num;
let disconnected_warning_toast = undefined;
let offline_warning_toast = undefined;
let own_board_slot_size = getOwnBoardSlotSize();
let all_ships_positioned = false;
let start_timer = undefined;
let poll_game_state_timeout = undefined;
let rejoin_info_timeout = undefined;
let ship_divs = document.getElementsByClassName("ship");
let ship_info = {};
function createElementWithClass(type, class_name) {
    let element = document.createElement(type);
    element.className = class_name;
    return element;
}
function createBoard(title) {
    let board = createElementWithClass("table", "board");
    let caption = document.createElement("caption");
    let board_title_container = createElementWithClass("div", "board-title-container");
    let title_left_side = '<svg viewBox="0 0 4 5" class="board-title-side"><path d="M0,5 L4,0 L4,5" fill="#668aff"></path><path d="M0,5 L4,0" stroke="#3d5fcc" vector-effect="non-scaling-stroke"></path></svg>';
    let board_title = createElementWithClass("div", "board-title");
    board_title.innerHTML = title;
    let title_right_side = '<svg viewBox="0 0 4 5" class="board-title-side"><path d="M4,5 L0,0 L0,5" fill="#668aff""></path><path d="M4,5 L0,0" stroke="#3d5fcc" vector-effect="non-scaling-stroke"></path></svg>';
    board_title_container.innerHTML += title_left_side;
    board_title_container.appendChild(board_title);
    board_title_container.innerHTML += title_right_side;
    caption.appendChild(board_title_container);
    board.appendChild(caption);
    let tbody = document.createElement("tbody");
    let row = document.createElement("tr");
    row.appendChild(document.createElement("th"));
    for (let i = NUM_INDEX_START; i < NUM_INDEX_END; i++) {
        let header = document.createElement("th");
        header.innerHTML = i;
        row.appendChild(header);
    }
    tbody.appendChild(row);
    for (let i = CHAR_CODE_INDEX_START; i < CHAR_CODE_INDEX_END; i++) {
        let row = document.createElement("tr");
        let header = document.createElement("th");
        header.innerHTML = String.fromCharCode(i);
        row.appendChild(header);
        for (let j = NUM_INDEX_START; j < NUM_INDEX_END; j++) {
            let hole = createElementWithClass("div", "hole");
            let data = document.createElement("td");
            data.setAttribute("x", j - NUM_INDEX_START);
            data.setAttribute("y", i - CHAR_CODE_INDEX_START)
            data.appendChild(hole);
            row.appendChild(data);
        }
        tbody.appendChild(row);
    }
    board.appendChild(tbody);
    return board;
}
function getOwnBoardSlotSize(){
    return own_board_slots[0].getBoundingClientRect().width;
}
function highlightBoardTileTemporarily(tile, type, time) {
    tile.classList.add("highlight");
    tile.classList.add(type + "-highlight");
    window.setTimeout(() => {
        tile.classList.remove("highlight");
        tile.classList.add(type + "-highlight");
    }, time);
}
function initializeOutlineInputs() {
    function createInputBorder(input_element, border_class) {
        let input_border = createElementWithClass("div", border_class);
        let input_border_start = createElementWithClass("div", "input-border-start");
        let input_border_notch = createElementWithClass("div", "input-border-notch");
        let notch_spacer = createElementWithClass("div", "notch-spacer");
        let field_name = (input_element.getElementsByClassName("field-name") && input_element.getElementsByClassName("field-name")[0] && input_element.getElementsByClassName("field-name")[0].innerHTML) || "";
        notch_spacer.innerHTML = field_name;
        input_border_notch.appendChild(notch_spacer);
        let input_border_end = createElementWithClass("div", "input-border-end");
        input_border.appendChild(input_border_start);
        input_border.appendChild(input_border_notch);
        input_border.appendChild(input_border_end);
        return input_border;
    }
    let all_outline_inputs = document.getElementsByClassName("input");
    for (let input of all_outline_inputs) {
        input.appendChild(createInputBorder(input, "input-border"));
        input.appendChild(createInputBorder(input, "input-border-focus"));
    }
}
function makeShipsDraggable(ship_divs) {
    for (let i = 0; i < ship_divs.length; i++) {
        dragElement(ship_divs[i]);
        ship_divs[i].classList.add("draggable");
    }
}
function makeShipsNotDraggable(ship_divs) {
    for (let i = 0; i < ship_divs.length; i++) {
        ship_divs[i].parentNode.replaceChild(ship_divs[i].cloneNode(1), ship_divs[i]); // To remove all event listeners.
        ship_divs[i].classList.remove("draggable");
    }
}
function rotateShip(ship, to_horizontal) {
    if (to_horizontal || ship.classList.contains("vertical")) {
        ship.classList.remove('vertical');
        ship_info[ship.id].directionName = "horizontal";
        ship_info[ship.id].directionProcessStrategy = processHorizontal;
    } else {
        ship.classList.add('vertical');
        ship_info[ship.id].directionName = "vertical";
        ship_info[ship.id].directionProcessStrategy = processVertical;
    }
}
function rotateShipToHorizontal(ship) {
    rotateShip(ship, true);
}
function processHorizontal(callback, override_position) {
    let position = override_position ? override_position : this.position;
    for (let i = position[1]; i < position[1] + this.length; i++) {
        let board_slot = own_board.children[1].children[position[0] + 1].children[i + 1];
        result = callback(board_slot);
        if (result) return result;;
    }
    
}
function processVertical(callback, override_position) {
    let position = override_position ? override_position : this.position;
    for (let i = position[0]; i < position[0] + this.length; i++) {
        let board_slot = own_board.children[1].children[i + 1].children[position[1] + 1];
        result = callback(board_slot);
        if (result) return result;
    }
}
function isFreePlace(ship_name, position) {
    let position_is_occupied = ship_info[ship_name].directionProcessStrategy((board_slot) => {
        if (board_slot && board_slot.getAttribute("ship") != null && board_slot.getAttribute("ship") != ship_name) {
            return true;
        }
    }, position);
    return !position_is_occupied;
}
function saveShipInTable(ship_name, position) {
    ship_info[ship_name].position = position;
    ship_info[ship_name].directionProcessStrategy((board_slot) => {
        board_slot.setAttribute("ship", ship_name);
    });
    ship_info[ship_name].inTableDirectionProcessStrategy = ship_info[ship_name].directionProcessStrategy;
}
function removeShipFromTable(ship_name) {
    if (ship_info[ship_name].position && ship_info[ship_name].inTableDirectionProcessStrategy) {
        ship_info[ship_name].inTableDirectionProcessStrategy((board_slot) => {
            board_slot.removeAttribute("ship");
        });
        ship_info[ship_name].position = false;
        delete ship_info[ship_name].inTableDirectionProcessStrategy;
    }
}
function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let lastTouchTime = 0;
  const doubleTouchDelay = 500; // Maximum time (in milliseconds) between touches for it to be considered a double touch
  let element_position;
  let element_goal_position;
  let origin_ship_section;
  let offset;
  let container = document.getElementById(elmnt.getAttribute("container"));
  let nearest_slot = undefined;
  elmnt.addEventListener("mousedown", dragMouseDown);
  elmnt.addEventListener("touchstart", dragTouchStart, { passive: false });

  function dragMouseDown(e) {
    origin_ship_section = e.target;
    if (origin_ship_section.classList.contains("hole")) {
        origin_ship_section = origin_ship_section.parentElement;
    }
    origin_ship_section_position = origin_ship_section.getBoundingClientRect();
    element_position = elmnt.getBoundingClientRect();
    offset = 0;
    if (e.button == 2) {
        if (elmnt.classList.contains("vertical")) {
            offset = element_position.top - origin_ship_section_position.top;
        } else {
            offset = origin_ship_section_position.left - element_position.left;
        }
        origin_ship_section_index = Array.prototype.indexOf.call(elmnt.children, origin_ship_section);
        elmnt.style.setProperty("--dragging-from-section", origin_ship_section_index);
        elmnt.classList.add("origin-changed");
        element_goal_position = {
            top: element_position.top - offset,
            left: element_position.left + offset,
            bottom: element_position.bottom - offset,
            right: element_position.right + offset
        }
        if (!elmnt.classList.contains("vertical")) {
            offset = 0;
        }
        rotateShip(elmnt);
    } else {
        let {top, left, bottom, right} = element_position;
        element_goal_position = {top, left, bottom, right};
    }
    clientX = e.clientX;
    clientY = e.clientY;
    dragStart(e);
  }

  function dragTouchStart(e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
    origin_ship_section = document.elementFromPoint(clientX, clientY);
    if (origin_ship_section.classList.contains("hole")) {
        origin_ship_section = origin_ship_section.parentElement;
    }
    origin_ship_section_position = origin_ship_section.getBoundingClientRect();
    element_position = elmnt.getBoundingClientRect();
    offset = 0;
    const currentTime = new Date().getTime();
    const timeSinceLastTouch = currentTime - lastTouchTime;
    if (timeSinceLastTouch < doubleTouchDelay && timeSinceLastTouch > 0) {
        if (elmnt.classList.contains("vertical")) {
            offset = element_position.top - origin_ship_section_position.top;
        } else {
            offset = origin_ship_section_position.left - element_position.left;
        }
        origin_ship_section_index = Array.prototype.indexOf.call(elmnt.children, origin_ship_section);
        elmnt.style.setProperty("--dragging-from-section", origin_ship_section_index);
        elmnt.classList.add("origin-changed");
        element_goal_position = {
            top: element_position.top - offset,
            left: element_position.left + offset,
            bottom: element_position.bottom - offset,
            right: element_position.right + offset
        }
        if (!elmnt.classList.contains("vertical")) {
            offset = 0;
        }
        rotateShip(elmnt);
    } else {
        let {top, left, bottom, right} = element_position;
        element_goal_position = {top, left, bottom, right};
    }
    lastTouchTime = currentTime;
    dragStart(e);
  }
  
  function dragStart(e) {
    elmnt.classList.remove("not_moving");
    elmnt.classList.add("moving");
    e = e || window.event;
    e.preventDefault();
    pos3 = clientX;
    pos4 = clientY;
    previous_highlight_div = undefined;
    elmnt.style.top = (elmnt.offsetTop - pos2 - offset) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1 + offset) + "px";
    setAndHighlightNearestFreeSpace();
    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;
    document.onmousemove = elementDrag;
    document.addEventListener("touchmove", elementTouchDrag, { passive: false });
    document.addEventListener("contextmenu", preventShowingContextMenu, true);
  }

  function elementTouchDrag(e) {
    elementDrag(e, true);
  }

  function preventShowingContextMenu(e) {
      e.preventDefault();
  }

  function getNearestFreeSpace(element, board_slots) {
    let distance_to_board;
    let distance_to_ship_select;
    if (window.matchMedia("(orientation: portrait)").matches) {
        distance_to_board = Math.abs(element_goal_position.top - own_board.getBoundingClientRect().top);
        distance_to_ship_select = Math.abs(element_goal_position.bottom - ship_select.getBoundingClientRect().bottom);
    } else {
        distance_to_board = Math.abs(element_goal_position.right - own_board.getBoundingClientRect().right);
        distance_to_ship_select = Math.abs(element_goal_position.left - ship_select.getBoundingClientRect().left);
    }
    if (distance_to_board < distance_to_ship_select) {
        function distanceBetween(first_point, second_point) {
            return Math.pow(first_point.left - second_point.left, 2) + Math.pow(first_point.top - second_point.top, 2);
        }
        function canBePlacedElementInSlot(slot) {
            return (ship_info[element.id].directionName == "horizontal" && (+slot.getAttribute("x") + ship_info[element.id].length <= NUM_INDEX_LENGTH)) || (ship_info[element.id].directionName == "vertical" && (+slot.getAttribute("y") + ship_info[element.id].length <= CHAR_INDEX_LENGTH));
        }
        function distanceDifference(a, b) {
            return distanceBetween(element_goal_position, a.getBoundingClientRect()) - distanceBetween(element_goal_position, b.getBoundingClientRect());
        }
        let distance_sorted_board_slots = Object.keys(board_slots).filter((key) => canBePlacedElementInSlot(board_slots[key])).sort((key_a, key_b) => distanceDifference(board_slots[key_a], board_slots[key_b])).map(key => board_slots[key]);
        let nearest_free_slot = undefined;
        for (board_slot of distance_sorted_board_slots) {
            let board_slot_position = [+board_slot.getAttribute("y"), +board_slot.getAttribute("x")];
            if (isFreePlace(element.id, board_slot_position)) {
                nearest_free_slot = board_slot;
                break;
            }
        }
        return nearest_free_slot;
    } else {
        return container;
    }
  }

  function removePreviousHighlight() {
    if (previous_highlight_div) {
      previous_highlight_div.classList.add("hide");
      previous_highlight_div.parentElement.highlighted = false;
      window.setTimeout(function(previous_highlight_div){
          previous_highlight_div.parentElement.removeChild(previous_highlight_div);
      }.bind(this, previous_highlight_div), 250);
      previous_highlight_div = undefined;
    }
  }

  function setAndHighlightNearestFreeSpace() {
    nearest_slot = getNearestFreeSpace(elmnt, own_board_slots);
    if (nearest_slot && nearest_slot != container) {
        if (!nearest_slot.highlighted) {
            if (previous_highlight_div) {
                previous_highlight_div.classList.add("hide");
                previous_highlight_div.parentElement.highlighted = false;
                window.setTimeout(function(previous_highlight_div){
                    previous_highlight_div.parentElement.removeChild(previous_highlight_div);
                }.bind(this, previous_highlight_div), 250);
            }
            highlight_div = createElementWithClass("div", elmnt.id + "-highlight ship-highlight hide" + (elmnt.classList.contains("vertical") ? " vertical" : ""));
            nearest_slot.insertBefore(highlight_div, nearest_slot.firstChild);
            nearest_slot.highlighted = true;
            window.setTimeout(function(){
                highlight_div.classList.remove("hide");
            }, 1);
            previous_highlight_div = highlight_div;
        }
    } else {
        removePreviousHighlight();
    }
  }

  function elementDrag(e, isTouch) {
    e = e || window.event;
    e.preventDefault();
    clientX = isTouch ? e.touches[0].clientX : e.clientX;
    clientY = isTouch ? e.touches[0].clientY : e.clientY;
    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;
    element_goal_position.top -= pos2;
    element_goal_position.left -= pos1;
    element_goal_position.bottom -= pos2;
    element_goal_position.right -= pos1;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    setAndHighlightNearestFreeSpace();
  }

  function closeDragElement() {
    elmnt.classList.add("not_moving");
    elmnt.classList.remove("moving");
    elmnt.classList.remove("origin-changed");
    elmnt.style.removeProperty("--dragging-from-section");
    if (nearest_slot) {
        let pos = elmnt.getBoundingClientRect();
        let pos_nearest_slot = nearest_slot.getBoundingClientRect();
        let pos_abs_left = pos.left - pos_nearest_slot.left;
        let pos_abs_top = pos.top - pos_nearest_slot.top;
        elmnt.style.left = pos_abs_left + "px";
        elmnt.style.top = pos_abs_top + "px";
        elmnt.style.transform = window.getComputedStyle(elmnt).getPropertyValue("transform");
        removeShipFromTable(elmnt.id);
        if (nearest_slot == container) {
            elmnt.style.fontSize = "";
            if (elmnt.parentElement.id !== container.id) {
                container.appendChild(elmnt);
                doFetch(`${GAME_API_URL}/players/${my_player_num}/ships/${elmnt.id}`, "PATCH", {action: "place_ship", direction: false, position: false});
            }
            window.setTimeout(function(){
                elmnt.style.top = "0px";
                elmnt.style.left = "0px";
                elmnt.style.transform = "";
                rotateShipToHorizontal(elmnt);
            }, 1);
        } else {
            nearest_slot.insertBefore(elmnt, nearest_slot.firstChild);
            saveShipInTable(elmnt.id, [+nearest_slot.getAttribute("y"), +nearest_slot.getAttribute("x")]);
            doFetch(`${GAME_API_URL}/players/${my_player_num}/ships/${elmnt.id}`, "PATCH", {action: "place_ship", direction: ship_info[elmnt.id].directionName, position: ship_info[elmnt.id].position});
            window.setTimeout(function(){
                elmnt.style.top = "-1px";
                elmnt.style.left = "-1px";
                elmnt.style.transform = "";
            }, 1);
        }
    }
    removePreviousHighlight();
    all_ships_positioned = areAllShipsPositioned();
    enableOrDisableReadyInput();
    document.onmouseup = null;
    document.ontouchend = null;
    document.onmousemove = null;
    document.removeEventListener("touchmove", elementTouchDrag);
    document.removeEventListener("contextmenu", preventShowingContextMenu);
  }
}
function resizeElements() {
    document.documentElement.style.setProperty("--ship-section-size", own_board_slot_size + "px");
    if (window.matchMedia("(orientation: portrait)").matches) {
        opposite_container.style.height = (opposite_board_container.classList.contains("hide") ? ship_select.offsetHeight + 10 : opposite_board_container.offsetHeight + 30) + "px";
    } else {
        opposite_container.style.height = "";
    }
};
function clearToastNotification(toast) {
    if (toast) {
        toastr.clear(toast);
    }
}
function doFetch(url, method, body, handler) {
    fetch(url, method == "GET" ? {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: method
    } : {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: method,
        body: JSON.stringify(body)
    }).then((resp) => {
        if (disconnected_warning_toast || offline_warning_toast) {
            clearToastNotification(disconnected_warning_toast);
            clearToastNotification(offline_warning_toast);
            disconnected_warning_toast = undefined;
            offline_warning_toast = undefined;
            toastr.options.timeOut = 5000;
            toastr.options.extendedTimeOut = 5000;
            toastr.options.progressBar = true;
            toastr["info"]("Se recuperó la conexión.");
        }
        if (resp.status != 500) {
            return resp.json();
        } else {
            return Promise.reject(resp);
        }
    }).then((body) => {
        if (body.error) {
            console.error("Error response from server:", body);
        }
        if (handler) {
            handler(body);
        }
    }).catch(async(error) => {
        if (error.status) {
            let error_text = await error.text();
            console.error(error_text);
            toastr["error"]("Mirá la consola del navegador para ver detalles.", "Error del servidor");
        } else if (error.stack && error.message) {
            console.error(error);
            toastr["error"]("Mirá la consola del navegador para ver detalles.", "Error en tu navegador");
        } else if (navigator.onLine) {
            if (!disconnected_warning_toast) {
                clearToastNotification(offline_warning_toast);
                offline_warning_toast = undefined;
                toastr.options.timeOut = 0;
                toastr.options.extendedTimeOut = 0;
                toastr.options.progressBar = false;
                disconnected_warning_toast = toastr["warning"]("Conexión perdida.<br>Intentando reconectarse...");
            }
            window.setTimeout(() => {
                doFetch(url, method, body, handler);
            }, 1000);
        } else {
            if (!offline_warning_toast) {
                clearToastNotification(disconnected_warning_toast);
                disconnected_warning_toast = undefined;
                toastr.options.timeOut = 0;
                toastr.options.extendedTimeOut = 0;
                toastr.options.progressBar = false;
                offline_warning_toast = toastr["warning"]("No estás conectado.<br>Por favor, revisá la configuración de red.");
            }
            window.addEventListener("online", () => {
                doFetch(url, method, body, handler);
            }, {once: true});
        }
    });
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
function showGameIdInputDialog(message) {
    game_id_input.focus();
    join_dialog_box.getElementsByTagName("span")[0].innerHTML = message;
    join_dialog_box.classList.add("in");
}
function getNombreJugadorAnonimo(numero_de_jugador) {
    return "Jugador " + (numero_de_jugador != undefined ? (+numero_de_jugador + 1) + " " : "") + "(anónimo)"
}
function setStatusDescription(status) {
    for (status_area of status_areas) {
        status_area.innerHTML = status;
    }
}
function setOpponentStatus(game, status) {
    opponent_ready.classList[status == "ready" ? "add" : "remove"]("show");
    opponent_preparing.classList[status == "not_ready" ? "add" : "remove"]("show");
    opponent_absent.classList[status == "absent" ? "add" : "remove"]("show");
    opponent_win_text.classList[status == "win" ? "add" : "remove"]("show");
    if (status == "disconnected") {
        opponent_name.innerHTML = '<span class="gray-text-color">Esperando jugador...</span>';
    } else {
        setOpponentPlayerName(game.players[opponent_player_num].name);
    }
}
function synchronizeShipsAndReadyInput(game) {
    for (let ship_div of ship_divs) {
        game_state_ship = game.players[my_player_num].ships[ship_div.id];
        if (game_state_ship.position) {
            ship_x = game_state_ship.position[1];
            ship_y = game_state_ship.position[0];
            let board_slot_to_place = own_board.querySelector('[x="' + ship_x + '"][y="' + ship_y + '"]');
            board_slot_to_place.appendChild(ship_div);
            if (game_state_ship.direction == "vertical") {
                rotateShip(ship_div);
            }
            saveShipInTable(ship_div.id, [ship_y, ship_x]);
            ship_div.style.top = "-1px";
            ship_div.style.left = "-1px";
        }
    }
    ready_input.checked = game.players[my_player_num].status == "not_ready" ? false : true;
    if (ready_input.checked) {
        makeShipsNotDraggable(ship_divs);
    }
    all_ships_positioned = areAllShipsPositioned();
    enableOrDisableReadyInput();
    disableHighlightIfReadyInputIsEnabled();
}
function init(game) {
    window.localStorage.setItem("game_id", game_id);
    my_player_num = +getCookie("player_num");
    opponent_player_num = getCookie("player_num") == 0 ? 1 : 0;
    GAME_API_URL = API_URL + "/" + game_id;
    document.body.style.setProperty("overflow", "visible");
    game_title.classList.add("shrunk");
    game_join_menu.classList.add("hide");
    game_join_container.classList.add("hide");
    game_container.classList.add("show");
    my_name.innerHTML = "Yo: " + (player_name_input.value || getNombreJugadorAnonimo(my_player_num));
    if (game.players) {
        if (game.players[opponent_player_num]) {
            if (game.players[opponent_player_num].online_state != "disconnected") {
                setOpponentPlayerName(game.players[opponent_player_num].name);
            }
            if (game.players[opponent_player_num].board) {
                setOpponentBoardState(game);
            }
        }
    } else {
        console.error("The game doesn't have players. game:", game);
        return;
    }
    handleGameStateChange(game);
    game.turn = undefined;
    handleOpponentStateChange(game);
    ready_input.onchange = () => {
        window.clearInterval(start_timer);
        doFetch(GAME_API_URL + "/players/" + my_player_num + "/status", "PUT", {value: ready_input.checked ? "ready" : "not_ready"});
        if (ready_input.checked) {
            makeShipsNotDraggable(ship_divs);
        } else {
            makeShipsDraggable(ship_divs);
        }
    };
    poll_game_state_timeout = window.setTimeout(() => {
        doFetch(GAME_API_URL + "/", "GET", null, pollGameState);
    }, 1000);
}
function createGame() {
    doFetch(API_URL, "POST", {action: "create", data: {player_name: player_name_input.value}}, handleCreateGame);
}
function handleCreateGame(data) {
    if (data.game_id !== undefined) {
        game_id = data.game_id;
        game = data.game;
        init(game);
    } else if (data.error) {
        toastr["error"](data.error.description, "Error");
    }
}
function joinGame() {
    if (game_id_input.value) {
        doFetch(API_URL, "POST", {action: "join", data: {game_id: game_id_input.value.replace(" ",""), player_name: player_name_input.value}}, handleJoinGame);
    } else {
        showGameIdInputDialog("Escribí el código numérico para unirte.");
    }
}
function handleJoinGame(data) {
    if (data.game_id !== undefined) {
        game_id = data.game_id;
        game = data.game;
        init(game);
        synchronizeShipsAndReadyInput(game);
        setOwnBoardState(game, false);
    } else if (data.error) {
        if (data.error.id == "missing_game_id") {
            showGameIdInputDialog("Escribí el código numérico para unirte.");
        } else if (data.error.id == "game_not_found") {
            game_id_input.classList.add("error");
            showGameIdInputDialog("No hay ninguna partida con este código.");
        } else if (data.error.id == "cannot_join_game_that_has_two_players") {
            game_id_input.classList.add("error");
            showGameIdInputDialog("Ya hay 2 jugadores en esa partida.");
        } else {
            toastr["error"](data.error.description, "Error");
        }
    }
}
function handleRejoinInfo(data) {
    if (!data.error) {
        game = data;
        opponent_player_num = getCookie("player_num") == 0 ? 1 : 0;
        if (game.players && game.players[opponent_player_num]) {
            if (game.players[opponent_player_num].online_state != "disconnected") {
                rejoin_opponent_name.innerText = game.players[opponent_player_num].name || getNombreJugadorAnonimo(opponent_player_num);
                if (game.players[opponent_player_num].online_state == "online") {
                    rejoin_opponent_connected.classList.add("show");
                    rejoin_opponent_absent.classList.remove("show");
                } else {
                    rejoin_opponent_absent.classList.add("show");
                    rejoin_opponent_connected.classList.remove("show");
                }
                if (game.players[opponent_player_num].board) {
                    setOpponentBoardState(game);
                }
                rejoin_opponent_status.classList.add("show");
                rejoin_nobody_connected.classList.remove("show");
            } else {
                rejoin_nobody_connected.classList.add("show");
                rejoin_opponent_status.classList.remove("show");
            }
        } else {
            rejoin_nobody_connected.classList.add("show");
            rejoin_opponent_status.classList.remove("show");
        }
        rejoin_game_join_section.classList.add("show");
        rejoin_info_timeout = window.setTimeout(() => {
            doFetch(API_URL + "/" + stored_game_id + "?no_refresh_last_seen=1", "GET", null, handleRejoinInfo);
        }, 1000);
    } else {
        if (data.error.id == "game_not_found") {
            window.localStorage.removeItem("game_id");
        }
        start_game_join_section.classList.add("show");
        rejoin_game_join_section.classList.remove("show");
    }
}
function rejoinGame() {
    window.clearTimeout(rejoin_info_timeout);
    game_id = stored_game_id;
    init(game);
    synchronizeShipsAndReadyInput(game);
    setOwnBoardState(game, false);
}
function quitGame() {
    doFetch(API_URL, "POST", {action: "quit", data: {game_id: game_id || stored_game_id}}, handleQuitGame);
}
function handleQuitGame(data) {
    if (!data.error || data.error.id == "game_not_found") {
        window.clearTimeout(poll_game_state_timeout);
        window.clearTimeout(rejoin_info_timeout);
        window.localStorage.removeItem("game_id");
        game_title.classList.remove("shrunk");
        game_join_menu.classList.remove("hide");
        game_join_container.classList.remove("hide");
        game_container.classList.remove("show");
        start_game_join_section.classList.add("show");
        rejoin_game_join_section.classList.remove("show");
        ready_input.checked = false;
        makeShipsNotDraggable(ship_divs);
        makeShipsDraggable(ship_divs);
        all_ships_positioned = areAllShipsPositioned();
        enableOrDisableReadyInput();
        disableHighlightIfReadyInputIsEnabled();
        clearShipsState();
        clearBoardSlots(own_board_slots);
        clearBoardSlots(opposite_board_slots);
        my_ready.style.display = "";
        opponent_ready.classList.add("show");
        my_info.style.color = "";
        my_turn.style.visibility = "hidden";
        opponent_turn.style.visibility = "hidden";
        opponent_info.style.color = "";
        ship_select.style.opacity = "";
        ship_select.style.pointerEvents = "";
        ship_select.style.visibility = "";
        opposite_board_container.classList.add("hide");
    } else {
        toastr["error"](data.error.description, "Error");
    }
}
function sendChatMessage() {
    if (chat_text_to_send_input.value) {
        doFetch(GAME_API_URL + "/chat_messages", "POST", {from_name: player_name_input.value ? player_name_input.value : getNombreJugadorAnonimo(my_player_num), message: chat_text_to_send_input.value}, attachMessagesToChat);
        chat_text_to_send_input.setAttribute("value", "");
        chat_text_to_send_input.value = "";
    }
}
function attachMessagesToChat(response) {
    if (response) {
        if (response.error) {
            chat_messages.innerHTML += "<p style='color:#ff0000;margin:0;'>Error: " + JSON.stringify(response.error) + "</p>";
        } else if (Array.isArray(response)) {
            for (message of response) {
                chat_messages.innerHTML += "<p style='margin:0;color:#707070;'>" + "<span style='color:#2f558f'>" + (message.from == my_player_num ? "<span style='color:#2f2f8f'>></span>" : "<span style='color:#8f2f2f'><</span>") + " " + message.from_name + "</span>: <span style='color:#000000'>" + message.message + "</span></p>";
            }
        } else {
            console.error("[attachMessagesToChat] La respuesta no es una colección de mensajes.");
            console.error(response);
        }
        if (response.length && response.length != 0) {
            chat_messages.scroll({top:chat_messages.scrollHeight,behavior:"smooth"});
        }
    } else {
        console.error("[attachMessagesToChat] No hay respuesta.");
    }
}
function handleGameStateChange(game) {
    switch (game.state) {
        case "waiting_for_player": {
            start_timer && window.clearInterval(start_timer);
            status_description = "<span>Código para unirse a esta partida:</span><br><input type='text' style='display: inline; background-color: #ccf0ff; border: 2px solid #0c0; border-radius: .25em; padding: .25em; width: 5em; text-align: center' value='" + game_id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "' readonly='readonly'>";
            setStatusDescription(status_description);
            break;
        }
        case "waiting_the_ready": {
            start_timer && window.clearInterval(start_timer);
            enableOrDisableReadyInput();
            status_description = "<span>Esperando a que ambos jugadores estén listos.</span>";
            setStatusDescription(status_description);
            break;
        }
        case "starting": {
            start_counter = 5;
            status_description = "<span>La partida va a empezar en " + start_counter + " segundos.</span>";
            setStatusDescription(status_description);
            start_timer = window.setInterval(() => {
                start_counter--;
                if (start_counter > 0) {
                    status_description = "<span>La partida va a empezar en " + start_counter + " segundos.</span>";
                    setStatusDescription(status_description);
                } else {
                    window.clearInterval(start_timer);
                    ready_input.disabled = true;
                    status_description = "<span>Empezando...</span>";
                    setStatusDescription(status_description);
                    doFetch(GAME_API_URL + "/players/" + my_player_num + "/status", "PUT", {value: "playing"});
                }
            }, 1000);
            break;
        }
        case "in_game": {
            status_description = game.turn === my_player_num ? "<span style='display: inline-block;height: 3rem;font-size: 1.25em;color: #000080;text-shadow: rgb(0 255 0) 0px 0px 10px;'>Tu turno</span>" : "<span style='display: inline-block;height: 3rem;'>Turno de " + (game.players[game.turn].name || getNombreJugadorAnonimo(game.turn)) + "</span>";
            setStatusDescription(status_description);
            startGame(game);
            break;
        }
        case "finished": {
            status_description = "<span>Partida finalizada. ¡El ganador es " + (game.players[game.winner].name || getNombreJugadorAnonimo(game.winner)) + "!</span>";
            setStatusDescription(status_description);
            if (game.winner == my_player_num) {
                my_info.style.color = "#000080";
                my_turn.style.visibility = "visible";
                my_win_text.classList.add("show");
                opponent_info.style.color = "#505050";
                opponent_turn.style.visibility = "hidden";
            } else {
                my_info.style.color = "#505050";
                my_turn.style.visibility = "hidden";
                opponent_info.style.color = "#000080";
                opponent_turn.style.visibility = "visible";
                setOpponentStatus(game, "win");
            }
            opposite_board_container.style.opacity = 0.75;
            break;
        }
    }
}
function handleOpponentStateChange(game) {
    let opponent = game.players[opponent_player_num];
    if (opponent) {
        if (opponent.online_state == "online") {
            if (game.state != "finished") {
                setOpponentStatus(game, opponent.status);
            }
        } else {
            setOpponentStatus(game, opponent.online_state);
        }
    } else {
        setOpponentStatus(game, "disconnected");
    }
}
function clearBoardSlots(board_slots) {
    for (let board_slot of board_slots) {
        board_slot.children[0].classList.value = "hole";
    }
}
function clearShipsState() {
    let ship_divs_to_remove_from_table = Array.prototype.slice.call(ship_divs);
    for (let ship_div of ship_divs_to_remove_from_table) {
        for (let ship_slot of ship_div.children) {
            ship_slot.children[0].classList.value = "hole";
        }
        removeShipFromTable(ship_div.id);
        document.getElementById(ship_div.getAttribute("container")).appendChild(ship_div);
        ship_info[ship_div.id].position = false;
        ship_div.style.top = "0px";
        ship_div.style.left = "0px";
        rotateShipToHorizontal(ship_div);
    }
}
function setOwnBoardState(game, notify_slot_change) {
    for (let y = 0; y < game.players[my_player_num].board.length; y++) {
        for (let x = 0; x < game.players[my_player_num].board[y].length; x++) {
            let board_slot = own_board.children[1].children[y + 1].children[x + 1];
            if (game.players[my_player_num].board[y][x].touched) {
                let type = game.players[my_player_num].board[y][x].type;
                if (type == "water") {
                    if (notify_slot_change && !board_slot.children[0].classList.contains("touched")) {
                        highlightBoardTileTemporarily(board_slot, type, 3000);
                        showShootResultDialog(board_slot, type);
                    }
                    board_slot.children[0].classList.value = "water_touched touched";
                } else {
                    let ship_slot = ship_divs[type].children[ship_info[type].directionName == "horizontal" ? (x - ship_info[type].position[1]) : (y - ship_info[type].position[0])];
                    let result_type = game.players[my_player_num].ships[type].touches == SHIP_LENGTHS[type] ? "sunken" : "touched";
                    if (notify_slot_change && !ship_slot.children[0].classList.contains("touched")) {
                        highlightBoardTileTemporarily(ship_slot, result_type, 3000);
                        showShootResultDialog(ship_slot, result_type);
                    }
                    ship_slot.children[0].classList.value = "ship_" + result_type + " touched";
                }
            }
        }
    }
}
function setOpponentBoardState(game) {
    for (let y = 0; y < game.players[opponent_player_num].board.length; y++) {
        for (let x = 0; x < game.players[opponent_player_num].board[y].length; x++) {
            let board_slot = opposite_board.children[1].children[y + 1].children[x + 1];
            if (game.players[opponent_player_num].board[y][x]) {
                let type = game.players[opponent_player_num].board[y][x];
                if (type == "water") {
                    board_slot.children[0].classList.value = "water_touched touched";
                } else {
                    board_slot.children[0].classList.value = "ship_" + type + " touched";
                }
            } else {
                board_slot.children[0].classList.value = "hole";
            }
        }
    }
}
async function pollGameState(remote_game) {
    if (!remote_game.error) {
        if (remote_game.state != game.state) {
            handleGameStateChange(remote_game);
        }
        if (!game.players[opponent_player_num] || remote_game.players[opponent_player_num].status != game.players[opponent_player_num].status || remote_game.players[opponent_player_num].online_state != game.players[opponent_player_num].online_state) {
            handleOpponentStateChange(remote_game);
        }
        if ((remote_game.state == "in_game" || remote_game.state == "finished") && remote_game.turn !== game.turn) {
            if (remote_game.turn === my_player_num) {
                setOwnBoardState(remote_game, true);
                if (remote_game.state == "in_game") {
                    for (let i = 0; i < opposite_board_slots.length; i++) {
                        if (opposite_board_slots[i].children[0].classList.contains("hole")) {
                            opposite_board_slots[i].onclick = shoot;
                            opposite_board_slots[i].classList.add("clickable");
                        }
                    }
                }
            }
            if (remote_game.state == "in_game") {
                status_description = remote_game.turn === my_player_num ? "<span style='display: inline-block;height: 3rem;font-size: 1.25em;color: #000080;text-shadow: rgb(0 255 0) 0px 0px 10px;'>Tu turno</span>" : "<span style='display: inline-block;height: 3rem;'>Turno de " + (remote_game.players[remote_game.turn].name || getNombreJugadorAnonimo(remote_game.turn)) + "</span>";
                setStatusDescription(status_description);
                my_info.style.color = remote_game.turn === my_player_num ? "#000080" : "#505050";
                my_turn.style.visibility = remote_game.turn === my_player_num ? "visible" : "hidden";
                opponent_turn.style.visibility = remote_game.turn !== my_player_num ? "visible" : "hidden";
                opponent_info.style.color = remote_game.turn !== my_player_num ? "#000080" : "#505050";
                opposite_board_container.style.opacity = remote_game.turn === my_player_num ? 1 : 0.75;
            }
        }
        game = remote_game;
        attachMessagesToChat(game.chat_messages);
        poll_game_state_timeout = window.setTimeout(() => {
            doFetch(GAME_API_URL + "/", "GET", null, pollGameState);
        }, 1000);
    }
}
function setOpponentPlayerName(name) {
    opponent_name.innerHTML = "Oponente: " + (name || getNombreJugadorAnonimo(opponent_player_num));
}
function areAllShipsPositioned() {
    let all_positioned = true;
    for (let ship in SHIP_LENGTHS) {
        if (ship_info[ship].position === false) {
            all_positioned = false;
            break;
        }
    }
    return all_positioned;
}
function enableOrDisableReadyInput() {
    ready_input.disabled = !all_ships_positioned;
    if (checkbox_box.should_highlight && all_ships_positioned) {
        checkbox_box.classList.add("highlight");
    } else {
        checkbox_box.classList.remove("highlight");
    }
}
function disableHighlightIfReadyInputIsEnabled() {
    if (!ready_input.disabled) {
        checkbox_box.should_highlight = false;
        enableOrDisableReadyInput();
        checkbox_label.removeEventListener("mouseenter", disableHighlightIfReadyInputIsEnabled);
    }
}
function startGame(game) {
    my_ready.style.display = "none";
    opponent_ready.classList.remove("show");
    setOpponentStatus(game, "playing");
    ship_select.style.opacity = 0;
    ship_select.style.pointerEvents = "none";
    window.setTimeout(() => ship_select.style.visibility = "hidden", 500);
    opposite_board_container.classList.remove("hide");
    resizeElements();
}
function shoot() {
    doFetch(`${GAME_API_URL}/players/${opponent_player_num}/board/${this.getAttribute("y")}/${this.getAttribute("x")}`, "PATCH", {action: "shoot"}, (data) => updateOppositeBoard(this.getAttribute("x"), this.getAttribute("y"), data));
    for (let i = 0; i < opposite_board_slots.length; i++) {
        opposite_board_slots[i].onclick = null;
        opposite_board_slots[i].classList.remove("clickable");
    }
    game.turn = false;
}
function showShootResultDialog(board_slot, dialog_type) {
    let message;
    switch (dialog_type) {
        case "water": {
            message = "¡Agua!";
            break;
        }
        case "touched": {
            message = "¡Tocado!";
            break;
        }
        case "sunken": {
            message = "¡Hundido!";
            break;
        }
    }
    if (message) {
        let shoot_result_dialog = createElementWithClass("div", dialog_type + "-shoot-result shoot-result-dialog dialog-box fade");
        let time_to_show = 50;
        for (let character of message) {
            let character_span = createElementWithClass("span", "shoot-result-dialog-character");
            character_span.innerHTML = character;
            shoot_result_dialog.appendChild(character_span);
            window.setTimeout(() => character_span.classList.add("show"), time_to_show);
            time_to_show += 50;
        }
        board_slot.appendChild(shoot_result_dialog);
        window.setTimeout(() => shoot_result_dialog.classList.add("in"), 25);
        window.setTimeout(() => shoot_result_dialog.classList.remove("in"), time_to_show + 2000);
        window.setTimeout(() => shoot_result_dialog.remove(), time_to_show + 2150);
    } else {
        console.error("dialog_type value is not a specified type. dialog_type:", dialog_type);
    }
}
function updateOppositeBoard(x, y, data) {
    if (!data.error) {
        let board_slot = opposite_board.querySelector('[x="' + x + '"][y="' + y + '"]');
        showShootResultDialog(board_slot, data.result);
        switch (data.result) {
            case "water": {
                board_slot.children[0].classList.value = "water_touched touched";
                break;
            }
            case "touched": {
                board_slot.children[0].classList.value = "ship_touched touched";
                break;
            }
            case "sunken": {
                if (data.direction == "horizontal") {
                    for (let i = data.position[1]; i < data.position[1] + data.length; i++) {
                        let slot = opposite_board.children[1].children[data.position[0] + 1].children[i + 1];
                        slot.children[0].classList.value = "ship_sunken touched";
                    }
                } else if (data.direction == "vertical") {
                    for (let i = data.position[0]; i < data.position[0] + data.length; i++) {
                        let slot = opposite_board.children[1].children[i + 1].children[data.position[1] + 1];
                        slot.children[0].classList.value = "ship_sunken touched";
                    }
                }
                break;
            }
        }
    }
}
function showOrHideElementIfQueryMatches(element, inputQuery) {
    if (inputQuery.matches) {
        element.classList.add("show");
    } else {
        element.classList.remove("show");
    }
}
for (let i = 0; i < ship_divs.length; i++) {
    ship_divs[i].setAttribute("container", ship_divs[i].parentElement.id);
    ship_info[ship_divs[i].id] = {
        length: ship_divs[i].children.length,
        position: false
    };
    rotateShipToHorizontal(ship_divs[i]);
}
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-center",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "5000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};
makeShipsDraggable(ship_divs);
initializeOutlineInputs();
showOrHideElementIfQueryMatches(mouse_rotate_instructions, pointerFineQuery);
showOrHideElementIfQueryMatches(touch_rotate_instructions, pointerCoarseQuery);
resizeElements();
checkbox_box.should_highlight = true;
checkbox_label.addEventListener("mouseenter", disableHighlightIfReadyInputIsEnabled);
create_game_button.addEventListener("click", createGame);
join_dialog_box.addEventListener("mousedown", (event) => {event.preventDefault(); event.stopPropagation()});
join_dialog_box.addEventListener("click", () => join_dialog_box.classList.remove("in"));
game_id_input.addEventListener("blur", () => {
    join_dialog_box.classList.remove("in");
    game_id_input.classList.remove("error");
});
game_id_input.addEventListener("input", function(e) {
  let txt = this.value.replace(/\D/g, '');
  let newtxt = '';
  for (let i = 0; i < txt.length; i++) {
    newtxt += txt[i];
    if ((i + 1) % 3 == 0) {
      newtxt += ' ';
    }
  }
  if (newtxt[newtxt.length - 1] == ' ') newtxt = newtxt.substring(0, newtxt.length - 1);
  this.value = newtxt;
  join_dialog_box.classList.remove("in");
  game_id_input.classList.remove("error");
});
game_id_input.addEventListener("keydown", (event) => {
    if (event.keyCode == 13) joinGame();
});
join_game_button.addEventListener("mousedown", (event) => {event.preventDefault(); event.stopPropagation()});
join_game_button.addEventListener("click", joinGame);
rejoin_game_button.addEventListener("click", rejoinGame);
rejoin_quit_game_button.addEventListener("click", quitGame);
playing_quit_game_button.addEventListener("click", quitGame);
stored_game_id = window.localStorage.getItem("game_id");
if (stored_game_id) {
    doFetch(API_URL + "/" + stored_game_id + "?no_refresh_last_seen=1&get_opponent_board=1", "GET", null, handleRejoinInfo);
} else {
    start_game_join_section.classList.add("show");
}
chat_text_to_send_input.addEventListener("keydown", (event) => {
    if (event.keyCode == 13) sendChatMessage();
});
chat_send_message_button.addEventListener("click", sendChatMessage);
window.addEventListener("resize", () => {
    own_board_slot_size = getOwnBoardSlotSize();
    resizeElements();
});
pointerFineQuery.addEventListener("change", (mediaQuery) => showOrHideElementIfQueryMatches(mouse_rotate_instructions, mediaQuery));
pointerCoarseQuery.addEventListener("change", (mediaQuery) => showOrHideElementIfQueryMatches(touch_rotate_instructions, mediaQuery));