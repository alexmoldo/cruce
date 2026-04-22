var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
const { Server } = require("socket.io");
const io = new Server(http);
var port = process.env.PORT || 3000;

var cards = [
    {c: 'r', v: 0, o: null},
    {c: 'r', v: 2, o: null},
    {c: 'r', v: 3, o: null},
    {c: 'r', v: 4, o: null},
    {c: 'r', v: 10, o: null},
    {c: 'r', v: 11, o: null},
    {c: 'v', v: 0, o: null},
    {c: 'v', v: 2, o: null},
    {c: 'v', v: 3, o: null},
    {c: 'v', v: 4, o: null},
    {c: 'v', v: 10, o: null},
    {c: 'v', v: 11, o: null},
    {c: 'd', v: 0, o: null},
    {c: 'd', v: 2, o: null},
    {c: 'd', v: 3, o: null},
    {c: 'd', v: 4, o: null},
    {c: 'd', v: 10, o: null},
    {c: 'd', v: 11, o: null},
    {c: 'g', v: 0, o: null},
    {c: 'g', v: 2, o: null},
    {c: 'g', v: 3, o: null},
    {c: 'g', v: 4, o: null},
    {c: 'g', v: 10, o: null},
    {c: 'g', v: 11, o: null}
];

var users = {};
var userCards = {};
var lobbyUsers = {};
var activeGames = {};
var decks = {};

var bot_number = 0;
var bot_names = ['₪ Andromadalin', '₪ Androtiberiu', '₪ Androaugustin'];

var gibBotPls = function(game) {
    bot_number += 1;
    bot_name = bot_names[bot_number % 3] + bot_number;
    users[bot_name] = {socket: {gameId: game.id, userId: bot_name, emit: function(a,b,c){return true;}}, alter: 'bot', game: game,  can_double: false, bot: true};

    if (game.users.white == null)
    {
        game.users.white = bot_name;
        game.alters.white = 'bot';
    }
    else if (game.users.red == null)
    {
        game.users.red = bot_name;
        game.alters.red = 'bot';
    }
    else if (game.users.black == null)
    {
        game.users.black = bot_name;
        game.alters.black = 'bot';
    }
    else if (game.users.blue == null)
    {
        game.users.blue = bot_name;
        game.alters.blue = 'bot';
    }
    else
    {
        bot_number -= 1;
    }

}

app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/default.html');
});

io.on('connection', function(socket) {
    console.log('new connection ' + socket);

    function doLogin(socket, userId, alter) {
        socket.userId = userId;

        var lower_user = userId.toLowerCase().trim();
        var cenzura = lower_user.length < 2 || lower_user.length > 16 || userId.indexOf("₪") > -1 ||
                      lower_user.indexOf("pula") > -1 || lower_user.indexOf("pizd") > -1 || lower_user.indexOf("pwla") > -1 ||
                      lower_user == "undefined" || lower_user == "null" || lower_user == "true" || lower_user == "false" || 
                      lower_user.indexOf("'") > -1 || lower_user.indexOf('"') > -1;
     
        if (!users[userId] && !cenzura) {    
            console.log('creating new user');
            lobbyUsers[userId] = true;

            socket.emit('login', {userId: userId, users: Object.keys(lobbyUsers), games: Object.keys(activeGames)});

            users[userId] = {socket: socket, alter: alter, game: null, can_double: false, bot:false};
        } else {
            socket.emit('login_nope');   
        }
    }

    function joinGame(socket, game)
    {
        if (!(socket.userId in lobbyUsers)) return;
        if (game.state == -1) return;
        delete lobbyUsers[socket.userId];
        users[socket.userId].game = game.id;
        socket.gameId = game.id;
        socket.emit('joingame', {game: game});
    }

    function sendToRoom(socket, msg, params)
    {
        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        for (user in users)
        {
            if (users[user].game == socket.gameId)
            {
                users[user].socket.emit(msg, params);
            }
        }
    }

    function sendToLobbyUsers(socket, msg, params)
    {
        if (!(socket.userId in users)) return;

        for (user in lobbyUsers)
        {
            if (user in users)
                users[user].socket.emit(msg, params);
        }
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function giveThreeCards(game, user, tromf_stat) {
        var cards_sum = 0;
        userCards[user] = userCards[user].concat(decks[game.id].splice(0,3));
        for (card in userCards[user])
        {
            cards_sum += userCards[user][card].v;
            userCards[user][card].o = user;
            if (userCards[user][card].c == game.tromf) tromf_stat.val++;
        }

        if (cards_sum < 3 || (user != game.bid.user && cards_sum < 15 && userCards[user].length == 6))
        {
            users[user].can_double = true;
        }
        else
        {
            users[user].can_double = false;
        }

        game.cards.white = game.cards.blue = game.cards.black = game.cards.red = userCards[user].length;
        users[user].socket.emit('updategame', {can_double: users[user].can_double, update_cards: userCards[user]});
    }

    function cardsBatch(socket, game, first_to_receive)
    { 
        var this_is_a_new_game = false;
        if (!(game.id in decks) || decks[game.id].length == 0)
        {
            this_is_a_new_game = true;
            // Assign and shuffle deck
            decks[game.id] = cards.slice();
            shuffle(decks[game.id]);
        }

        var tromf_white = {val:0};
        var tromf_color = {val:0};

        // Trigger giving cards
        sendToRoom(socket, 'updategame', {tromf: game.tromf, first_to_receive: first_to_receive});

        // Assign cards to our 4 handsomes
        for (var i=0; i<4; i++)
        {
            var to_receive = (first_to_receive+i)%4;
            switch(to_receive) {
                case 0: giveThreeCards(game, game.users.white, tromf_white); break;
                case 1: giveThreeCards(game, game.users.red, tromf_color); break;
                case 2: giveThreeCards(game, game.users.black, tromf_white); break;
                case 3: giveThreeCards(game, game.users.blue, tromf_color); break;
                default: break;
            }
        }

        if (!this_is_a_new_game && (tromf_color.val == 0 || tromf_white.val == 0))
        {
            sendToRoom(socket, 'updategame', {showcards:true, userId: socket.userId, white: userCards[game.users.white], red: userCards[game.users.red], black: userCards[game.users.black], blue: userCards[game.users.blue]});
            nextHand(game);
            game.dubla = true;
        } else if (this_is_a_new_game) {
            game.turn = (game.big_turn + 1) % 4;
        }
    }

    socket.on('login', function(userId, alter) {
       doLogin(socket, userId, alter);
    });
    
    socket.on('newgame', function() {
        console.log('new game by: ' + socket.userId);
        
        if (!(socket.userId in lobbyUsers))
        {
            return;
        }

        /*
        Game states:
        0 - Players choosing seats
        1 - Shuffle waiting
        2 - Game started, bidding
        3 - Waiting on tromf
        4 - Playing

        Turns:
        0 - White
        1 - Red
        2 - Black
        3 - Blue
        */

        var game = {
            id: socket.userId,
            state: 0,
            users: {white: null, black: null, red: null, blue: null},
            cards: {white: 0, black: 0, red: 0, blue: 0},
            alters: {white: null, black: null, red: null, blue: null},
            bid: {user: null, value: -1},
            river: [],
            tromf: null,
            score: {small_whites: 0, small_colors: 0, big_whites: 0, big_colors: 0},
            turn: -1,
            big_turn: 0,
            dubla: false,
            date: Date.now()
        };
        
        activeGames[game.id] = game;
        joinGame(socket, game);
  
        console.log('starting game: ' + game.id);
        
        sendToLobbyUsers(socket, 'refreshgames', Object.keys(activeGames));
    });
    
    socket.on('joingame', function(gameId) {
        console.log('ready to join game: ' + gameId);

        if (!(socket.userId in users)) return;
        if (!(gameId in activeGames))
        {
            socket.emit('refreshgames', Object.keys(activeGames));
            return;
        }

        var game = activeGames[gameId];
        joinGame(socket, game)
    });

    socket.on('selectseat', function(seat) {
        console.log('ready to join seat: ' + seat);

        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;

        var game = activeGames[socket.gameId];
        if (game.state > 0) return;
        if (game.users.white == socket.userId || game.users.blue == socket.userId || game.users.black == socket.userId || game.users.red == socket.userId) return;

        if (seat == 0 && game.users.white == null)
        {
            game.users.white = socket.userId;
            game.alters.white = users[socket.userId].alter;
        }
        else if (seat == 1 && game.users.red == null)
        {
            game.users.red = socket.userId;
            game.alters.red = users[socket.userId].alter;
        }
        else if (seat == 2 && game.users.black == null)
        {
            game.users.black = socket.userId;
            game.alters.black = users[socket.userId].alter;
        }
        else if (seat == 3 && game.users.blue == null)
        {
            game.users.blue = socket.userId;
            game.alters.blue = users[socket.userId].alter;
        }
        else
        {
            return;
        }

        // This is where the game starts if all seats taken
        if (game.users.white != null && game.users.black != null && game.users.red != null && game.users.blue != null)
        {
            nextHand(game);
        }

        sendToRoom(socket, 'updategame', game);

        doBotStuff(game, socket);
    });

    socket.on('cermaleste', function() {
        if (!socket.gameId || !(socket.gameId in activeGames)) return;
        if (!(socket.userId in users)) return;

        var game = activeGames[socket.gameId];
        cermaleste(game, socket.userId);
        sendToRoom(socket, 'updategame', game);

        doBotStuff(game, socket);
    });

    function cermaleste(game, user)
    {
        if (game.state != 1) return;

        if ( (game.big_turn == 0 && game.users.white == user)
          || (game.big_turn == 1 && game.users.red == user)
          || (game.big_turn == 2 && game.users.black == user)
          || (game.big_turn == 3 && game.users.blue == user))
        {
            cardsBatch(socket, game, (game.big_turn+1)%4);
            game.score.small_whites = 0;
            game.score.small_colors = 0;
            // new game?
            if ((game.score.big_whites > 20 || game.score.big_colors > 20) && Math.abs(game.score.big_whites - game.score.big_colors) > 1)
            {
                game.score.big_whites = 0;
                game.score.big_colors = 0;
            }
            game.state++;

            // Cleanup river
            game.river = [];

        }
    }

    socket.on('bid', function(value) {
        console.log('ready to bid: ' + value);

        if (value > 4) return;
        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;

        var game = activeGames[socket.gameId];
        bid(game, socket.userId, value);
        sendToRoom(socket, 'updategame', game);

        doBotStuff(game, socket);
    });

    function bid(game, user, value)
    {
        if (game.state != 2) return;

        if ( (game.turn == 0 && game.users.white == user)
          || (game.turn == 1 && game.users.red == user)
          || (game.turn == 2 && game.users.black == user)
          || (game.turn == 3 && game.users.blue == user)
        )
        {
            if (game.bid.user == null) game.bid.user = user;

            if (value < 5 && value > game.bid.value)
            {
                game.bid.user = user;
                game.bid.value = value;
            }

            if (game.turn == game.big_turn || value == 4)
            {
                // Advance game state, bidding over
                game.state++;
                if (game.bid.user.indexOf("₪") > -1) {
                    selectTromfBot(game, user);
                } else {
                    users[game.bid.user].socket.emit('updategame', {bidwinner: true});                    
                }
                if (game.bid.user == game.users.white) game.turn = 0;
                if (game.bid.user == game.users.red) game.turn = 1;
                if (game.bid.user == game.users.black) game.turn = 2;
                if (game.bid.user == game.users.blue) game.turn = 3;
            }
            else
            {
                game.turn = (game.turn + 1) % 4;
            }
        }
        else
        {
            return;
        }

    }

    function bidBot(game, bot, socket) {
        if (users[bot].can_double) {
            tura_dubla(socket, game, bot);
            return;
        }

        let rand = Math.random();
        
        if (rand > 0.80) { bid(game,bot, 2); return; }
        else if (rand > 0.50) { bid(game,bot, 1); return; }
        else { bid(game,bot, 0); return; }
    }

    function selectTromfBot(game, bot)
    {
        if (userCards[bot].length != 3) return;
        var g=0,v=0,r=0,d=0;

        for (userCard in userCards)
        {
            if (userCards[userCard].c == 'r') r++;
            if (userCards[userCard].c == 'g') g++;
            if (userCards[userCard].c == 'v') v++;
            if (userCards[userCard].c == 'd') d++;
        }

        if (r>1) { selectTromf(game, bot, 'r'); return; }
        if (g>1) { selectTromf(game, bot, 'g'); return; }
        if (v>1) { selectTromf(game, bot, 'v'); return; }
        if (d>1) { selectTromf(game, bot, 'd'); return; }
        selectTromf(game, bot, decks[game.id][1].c); return;
    }

    socket.on('tromf', function(value) {
        console.log('ready to select tromf: ' + value);

        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;

        var game = activeGames[socket.gameId];
        selectTromf(game, socket.userId, value);
        sendToRoom(socket, 'updategame', game);

        doBotStuff(game, socket);
    });

    function selectTromf(game, user, value)
    {
        if (game.state != 3
            || game.bid.user != user
            || (value != 'r' && value != 'd' && value != 'v' && value != 'g' && value != '1' && value != '2' && value != '3' )) return;

        if (value == '1') game.tromf = decks[game.id][0].c;
        else if (value == '2') game.tromf = decks[game.id][1].c;
        else if (value == '3') game.tromf = decks[game.id][2].c;
        else game.tromf = value;

        // Second batch of cards for our handsomes
        cardsBatch(socket, game, game.turn);

        // Sometimes that will reset game state, otherwise advance.
        if (game.state == 3)
            game.state++;
    }

    // And now the moves!
    socket.on('turn', function(value, color) {
        console.log('ready to turn: ' + color + value);

        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;

        if (users[socket.userId].can_double) users[socket.userId].can_double = false; // no more!

        var game = activeGames[socket.gameId];
        turn(game, socket.userId, color, value, socket)

        sendToRoom(socket, 'updategame', game);

        if ((game.score.big_whites > 20 || game.score.big_colors > 20) && Math.abs(game.score.big_whites - game.score.big_colors) > 1) {
            sendToRoom(socket, 'updategame', {victory: true, white: game.score.big_whites, color: game.score.big_colors});
        }

        doBotStuff(game, socket);
    });

    function doBotStuff(game, socket) {
        var bot_turn = true;
        while (bot_turn) {
            bot_turn = checkBotTurn(game, socket);
            if (bot_turn)
            {
                botAct(game, socket);
                sendToRoom(socket, 'updategame', game);
                if ((game.score.big_whites > 20 || game.score.big_colors > 20) && Math.abs(game.score.big_whites - game.score.big_colors) > 1) {
                    sendToRoom(socket, 'updategame', {victory: true, white: game.score.big_whites, color: game.score.big_colors});
                }
            }
        };
    }

    function checkBotTurn(game, socket) {
        var bot_turn = false;

        if (game.state < 1) return bot_turn;

        if (game.state == 1 && game.big_turn == 0 && game.alters.white == 'bot') bot_turn = true;
        if (game.state == 1 && game.big_turn == 1 && game.alters.red == 'bot') bot_turn = true;
        if (game.state == 1 && game.big_turn == 2 && game.alters.black == 'bot') bot_turn = true;
        if (game.state == 1 && game.big_turn == 3 && game.alters.blue == 'bot') bot_turn = true;

        if (game.state == 2 && game.turn == 0 && game.alters.white == 'bot') bot_turn = true;
        if (game.state == 2 && game.turn == 1 && game.alters.red == 'bot') bot_turn = true;
        if (game.state == 2 && game.turn == 2 && game.alters.black == 'bot') bot_turn = true;
        if (game.state == 2 && game.turn == 3 && game.alters.blue == 'bot') bot_turn = true;

        if (game.state == 3 && game.turn == 0 && game.alters.white == 'bot') bot_turn = true;
        if (game.state == 3 && game.turn == 1 && game.alters.red == 'bot') bot_turn = true;
        if (game.state == 3 && game.turn == 2 && game.alters.black == 'bot') bot_turn = true;
        if (game.state == 3 && game.turn == 3 && game.alters.blue == 'bot') bot_turn = true;

        if (game.state == 4 && game.turn == 0 && game.alters.white == 'bot') bot_turn = true;
        if (game.state == 4 && game.turn == 1 && game.alters.red == 'bot') bot_turn = true;
        if (game.state == 4 && game.turn == 2 && game.alters.black == 'bot') bot_turn = true;
        if (game.state == 4 && game.turn == 3 && game.alters.blue == 'bot') bot_turn = true;

        console.log("Checked bot turn and it's " + bot_turn);

        return bot_turn;
    }

    function botAct(game, socket)
    {
        if (game.state == 1 && game.big_turn == 0 && game.alters.white == 'bot') { cermaleste(game, game.users.white); return; }
        if (game.state == 1 && game.big_turn == 1 && game.alters.red == 'bot') { cermaleste(game, game.users.red); return; }
        if (game.state == 1 && game.big_turn == 2 && game.alters.black == 'bot') { cermaleste(game, game.users.black); return; }
        if (game.state == 1 && game.big_turn == 3 && game.alters.blue == 'bot') { cermaleste(game, game.users.blue); return; }

        if (game.state == 2 && game.turn == 0 && game.alters.white == 'bot') { bidBot(game, game.users.white, socket); return; }
        if (game.state == 2 && game.turn == 1 && game.alters.red == 'bot') { bidBot(game, game.users.red, socket); return; }
        if (game.state == 2 && game.turn == 2 && game.alters.black == 'bot') { bidBot(game, game.users.black, socket); return; }
        if (game.state == 2 && game.turn == 3 && game.alters.blue == 'bot') { bidBot(game, game.users.blue, socket); return; }

        if (game.state == 3 && game.turn == 0 && game.alters.white == 'bot') { selectTromfBot(game, game.users.white); return; }
        if (game.state == 3 && game.turn == 1 && game.alters.red == 'bot') { selectTromfBot(game, game.users.red); return; }
        if (game.state == 3 && game.turn == 2 && game.alters.black == 'bot') { selectTromfBot(game, game.users.black); return; }
        if (game.state == 3 && game.turn == 3 && game.alters.blue == 'bot') { selectTromfBot(game, game.users.blue); return; }

        if (game.state == 4 && game.turn == 0 && game.alters.white == 'bot') { turnBot(game, game.users.white, socket); return; }
        if (game.state == 4 && game.turn == 1 && game.alters.red == 'bot') { turnBot(game, game.users.red, socket); return; }
        if (game.state == 4 && game.turn == 2 && game.alters.black == 'bot') { turnBot(game, game.users.black, socket); return; }
        if (game.state == 4 && game.turn == 3 && game.alters.blue == 'bot') { turnBot(game, game.users.blue, socket); return; }
    }

    function turnBot(game, bot, socket) {

        if (users[bot].can_double) 
        {
            tura_dubla(socket, game, bot);
            return;
        }

        let anunt = [];
        let has_color = {};
        let has_tromf = false;

        console.log("Turning");

        for (card in userCards[bot])
        {
            // Has anunt?
            if (userCards[bot][card] != null && userCards[bot][card].v == 3)
                for (sec_card in userCards[bot])
                    if (userCards[bot][sec_card].v == 4 && userCards[bot][sec_card].c == userCards[bot][card].c)
                        anunt.push(userCards[bot][sec_card].c);
        }

        let se_cere = game.river.length > 0 ? game.river[0].c : null;

        if (se_cere == null && anunt.length > 0)
            if (turn(game, bot, (anunt.includes(game.tromf)) ? game.tromf : anunt[0],  3 + (Math.random() > 0.5 ? 1:0),  socket)) return true;

        let cine_duce = null;
        let cu_cartea = -1;

        for (card in game.river)
        {
            if (se_cere != game.river[card].c && game.river[card].c == game.tromf)
            {
                se_cere = game.tromf;
                cine_duce = game.river[card].o;
                cu_cartea = game.river[card].v;
            }
            if (game.river[card].c == se_cere && game.river[card].v > cu_cartea)
            {
                cine_duce = game.river[card].o;
                cu_cartea = game.river[card].v;
            }
        }

        let cards_slice = userCards[bot].slice();

        let has_larger = false;
        if (se_cere != null)
            for (card in cards_slice)
                if (cards_slice[card].v > cu_cartea && cards_slice[card].c == se_cere)
                    has_larger = true;

        let ducem = has_larger || se_cere == null || ((bot == game.users.white || bot == game.users.black) && (cine_duce== game.users.white || cine_duce == game.users.black))
                                    || ((bot == game.users.red || bot == game.users.blue) && (cine_duce== game.users.red || cine_duce == game.users.blue));
        cards_slice.sort(function(a,b) {return ducem ? b.v-a.v : a.v-b.v});

        let s_adus = false;
        let turn_try = 0;
        let weloop = false;
        while (!s_adus) {
            if (turn_try == cards_slice.length) {
                turn_try = 0;
                weloop = true;
            }
            // Discourage 11 on ducem
            if (!(!weloop && cards_slice[turn_try].c != se_cere && se_cere != null && cards_slice[turn_try].v == 11))
                s_adus = turn(game, bot, cards_slice[turn_try].c, cards_slice[turn_try].v, socket);
            turn_try += 1;
        }

    }

    function turn(game, user, color, value, socket)
    {
        if (game.state != 4) return false;

        if (!((game.turn == 0 && game.users.white == user)
          || (game.turn == 1 && game.users.red == user)
          || (game.turn == 2 && game.users.black == user)
          || (game.turn == 3 && game.users.blue == user))) return false;

        let has_tromf = false;
        let has_color = {};
        let anunt = {};
        let team_white = (game.users.white == user || game.users.black == user);
        let card_item = -1;

        for (card in userCards[user])
        {
            // Only valid cards
            if (userCards[user][card].c == color && userCards[user][card].v == value)
                card_item = card;
            // Has color?
            has_color[userCards[user][card].c] = true;
            // Has tromf?
            if (userCards[user][card].c == game.tromf)
                has_tromf = true;
            // Has anunt?
            if (userCards[user][card].v == 3)
                for (sec_card in userCards[user])
                    if (userCards[user][sec_card].v == 4 && userCards[user][sec_card].c == userCards[user][card].c)
                        anunt[userCards[user][sec_card].c] = true;
        }

        if (card_item < 0) return false;

        // First move tromf
        if (game.score.small_whites == 0 && game.score.small_colors == 0 && color != game.tromf && has_tromf) return false;

        // Other illegal moves
        if (game.river.length > 0 && game.river.length < 4 && game.river[0].c != color)
        {
            if (has_color[game.river[0].c]) return false;
            if (color != game.tromf && has_tromf) return false;
        }

        // Move is legal. If river's full it's time to clean up
        if (game.river.length == 4) game.river = [];

        // Anunt?
        if (game.river.length == 0 && ((value == 3 || value == 4) && color in anunt && anunt[color]))
        {
            if (team_white) game.score.small_whites += color == game.tromf ? 40 : 20;
            else game.score.small_colors += color == game.tromf ? 40 : 20;
            sendToRoom(socket, 'updategame', {anunt: true, userId: user, clr: color, white: team_white, anunt_tromf: color == game.tromf});
        }

        // Add card to river removing from user cards pack
        game.river.push(userCards[user].splice(card_item, 1)[0]);

        if (game.users.white == user) game.cards.white--;
        if (game.users.red == user) game.cards.red--;
        if (game.users.black == user) game.cards.black--;
        if (game.users.blue == user) game.cards.blue--;

        // End round?
        if (game.river.length == 4)
        {
            var se_cere = game.river[0].c;
            var cine_duce = null;
            var cu_cartea = -1;
            var cat_duce = 0;

            for (card in game.river)
            {
                cat_duce += game.river[card].v;
                if (se_cere != game.river[card].c && game.river[card].c == game.tromf)
                {
                    se_cere = game.tromf;
                    cine_duce = game.river[card].o;
                    cu_cartea = game.river[card].v;
                }
                if (game.river[card].c == se_cere && game.river[card].v > cu_cartea)
                {
                    cine_duce = game.river[card].o;
                    cu_cartea = game.river[card].v;
                }
            }

            // Add small score to teams
            var duc_albii = cine_duce == game.users.white || cine_duce == game.users.black;
            var bid_albii = game.bid.user == game.users.white || game.bid.user == game.users.black;

            if (duc_albii) game.score.small_whites += cat_duce;
            else game.score.small_colors += cat_duce;

            // Game done?
            if (game.cards.white == 0)
            {
                var score_whites = game.score.small_whites/33 < game.bid.value && bid_albii ? -game.bid.value : parseInt(game.score.small_whites/33);
                var score_colors = game.score.small_colors/33 < game.bid.value && !bid_albii ? -game.bid.value : parseInt(game.score.small_colors/33);
                game.score.big_whites += (score_whites * (game.dubla ? 2 : 1));
                game.score.big_colors += (score_colors * (game.dubla ? 2 : 1));

                // Next one to shuffle cards, reset game state
                nextHand(game);
                game.big_turn = (game.big_turn + 1) % 4;
            }

            if (cine_duce == game.users.white) game.turn = 0;
            if (cine_duce == game.users.red) game.turn = 1;
            if (cine_duce == game.users.black) game.turn = 2;
            if (cine_duce == game.users.blue) game.turn = 3;
        }
        else
        {
            game.turn = (game.turn + 1) % 4;
        }

        return true;
    }

    function nextHand(game)
    {
        game.state = 1;
        game.dubla = false;
        game.tromf = null;
        game.bid.user = null;
        game.bid.value = -1;
        game.cards.white = 0;
        game.cards.blue = 0;
        game.cards.red = 0;
        game.cards.black = 0;
        userCards[game.users.white] = []
        userCards[game.users.black] = []
        userCards[game.users.red] = []
        userCards[game.users.blue] = []
        delete decks[game.id];
    }

    socket.on('dubla', function() {
        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;
        var game = activeGames[socket.gameId];

        tura_dubla(socket, game, socket.userId);
        doBotStuff(game, socket);

    });

    function tura_dubla(socket, game, userId) {
        if (!users[userId].can_double) return false;
        
        sendToRoom(socket, 'updategame', {showcards:true, userId: userId, white: userCards[game.users.white], red: userCards[game.users.red], black: userCards[game.users.black], blue: userCards[game.users.blue]});

        nextHand(game);
        game.dubla = true;
        sendToRoom(socket, 'updategame', game);
    }

    socket.on('say', function(msg) {
        if (!socket.gameId) return;
        if (!(socket.userId in users)) return;
        if (!(socket.gameId in activeGames)) return;

        let game = activeGames[socket.gameId];

        if (msg == '!fmmexo')
        {
            socket.emit('refresh', {game: activeGames[socket.gameId], update_cards: userCards[socket.userId]});
        }
        else if (msg == '!addbot' && socket.gameId == socket.userId)
        {
            if (game.state > 0) return;
            if (game.users.white == null || game.users.blue == null || game.users.black == null || game.users.red == null)
            {
                gibBotPls(game);
                if (game.users.white != null && game.users.blue != null && game.users.black != null && game.users.red != null)
                nextHand(game);
                sendToRoom(socket, 'updategame', game);
                doBotStuff(game, socket);
            }
        }
        else if (msg == '!kickwhite' && socket.gameId == socket.userId && game.users.white != socket.gameId && game.users.white in users) resign(users[game.users.white].socket, true);
        else if (msg == '!kickred' && socket.gameId == socket.userId && game.users.red != socket.gameId && game.users.red in users) resign(users[game.users.red].socket), true;
        else if (msg == '!kickblack' && socket.gameId == socket.userId && game.users.black != socket.gameId && game.users.black in users) resign(users[game.users.black].socket, true);
        else if (msg == '!kickblue' && socket.gameId == socket.userId && game.users.blue != socket.gameId && game.users.blue in users) resign(users[game.users.blue].socket, true);
        else if (msg.length < 101)
            sendToRoom(socket, 'say', {userId: socket.userId, actualMsg: msg});
    });
    
    socket.on('resign', function() {
        resign(socket, false);
    });

    function migrateRoom(game, owner)
    {
        for (user in users)
        {
            if (users[user].game == game.id)
            {
                users[user].game = owner;
                users[user].socket.gameId = owner;
            }
        }
        decks[owner] = decks[game.id];
        delete activeGames[game.id];
        delete decks[game.id];
        game.id = owner;
        activeGames[owner] = game;
    }

    function resign(socket, kicked) 
    {
        if (!(socket.userId in users)) return;
        if (!socket.gameId) return;

        users[socket.userId].game = null;
        lobbyUsers[socket.userId] = true;

        if (socket.gameId in activeGames)
        {
            let game = activeGames[socket.gameId];
            if (game.users.white == socket.userId) {game.users.white = null; game.state=Math.min(0, game.state);}
            if (game.users.red == socket.userId) {game.users.red = null; game.state=Math.min(0, game.state);}
            if (game.users.black == socket.userId) {game.users.black = null; game.state=Math.min(0, game.state);}
            if (game.users.blue == socket.userId) {game.users.blue = null; game.state=Math.min(0, game.state);}

            let room_empty = true;

            for (user in users)
            {
                if (users[user].game == socket.gameId)
                {
                    if (socket.gameId == socket.userId && socket.gameId == game.id) migrateRoom(game, user);
                    room_empty = false;
                    break;
                }
            }

            if (room_empty)
            {
                delete decks[socket.userId];
                delete activeGames[socket.gameId];
                game.state = -1;
                sendToLobbyUsers(socket, 'refreshgames', Object.keys(activeGames));
            } else {
                socket.emit('refreshgames', {kicked: kicked, games: Object.keys(activeGames)});
                sendToRoom(users[game.id].socket, 'updategame', {game:game, kicked: kicked});
            }
        }

        socket.gameId = null;
    }

    socket.on('disconnect', function(msg) {
        
      console.log(msg);
      
      if (socket && socket.userId ) {
        console.log(socket.userId + ' disconnected');
        
        // Any games to quit?
        resign(socket, false);

        if (socket.userId in lobbyUsers) delete lobbyUsers[socket.userId];
        if (socket.userId in users) delete users[socket.userId];
        if (socket.userId in decks) delete decks[socket.userId];
      }

    });           
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
