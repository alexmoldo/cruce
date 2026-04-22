(function () {

    var treide = true;
    var vol = 1;
    var chatbox_lock = false;

    $(document).ready(function () {

      //////////////////////////////
      // Helpers
      ////////////////////////////// 

        function endMove() {
            chatbox_lock = false;
        }

        function startMove() {
            chatbox_lock = true;
        }

        $(window).on('mousemove touchmove', function(event) {
            var thisX = Math.min(event.pageX - $('.movable').width() / 2, $(window).width() - $('.movable').width() - 10),
                thisY = Math.min(event.pageY - $('.movable').height() / 2, $(window).height() - $('.movable').height() - 10);

            $('.movable').offset({
                left: Math.max(10, thisX),
                top: Math.max(10,thisY)
            });
        });

        $("#game-chatroom").on('mousedown touchstart', function() {
            $(this).addClass('movable');
            startMove();
        }).on('mouseup touchend', function() {
            $(this).removeClass('movable');
            endMove();
        });

        $(window).on('mouseup touchend', function() {
            $('.movable').removeClass('movable');
        });

        $("#game-chatroom input").on('mousedown touchstart', function(e) {
            e.stopPropagation();
        });

        $(document).on('dragstart', 'img', function(e) { e.preventDefault(); });
        
        $("#login-form").on('submit', function(e) {
            e.preventDefault();
        });

        function Queue() {
           this.elements = [];
        }
        Queue.prototype.enqueue = function (e) {
            this.elements.push(e);
        };
        Queue.prototype.dequeue = function () {
            return this.elements.shift();
        };
        Queue.prototype.isEmpty = function () {
            return this.elements.length == 0;
        };
        Queue.prototype.length = function() {
            return this.elements.length;
        }

        function getBoundingRect(el) {
            let offsetLeft = 0, offsetTop = 0, width = el.offsetWidth, height = el.offsetHeight;
            do{
                offsetLeft += el.offsetLeft;
                offsetTop  += el.offsetTop;

                el = el.offsetParent;
            } while( el );

            return {
              width: width,
              height: height,
              left: offsetLeft,
              top: offsetTop
            }
        }

        function toggleFullScreen() {
          if (!document.fullscreenElement &&
              !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
              document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
              document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
              document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          }
        }

        var $win = $(window);
        var $lay = $('#game-board');

        // Game scales .. Not the best but not the worst solution, is it? :)
        function updateScale() {

            var baseSize = {
                w: treide ? 1700 : 1400,
                h: treide ? 700 : 800
            }

            let ww = $win.width();
            let wh = $win.height();
            let newScale = 1;

            // compare ratios
            if(ww/wh < baseSize.w/baseSize.h) { // tall ratio
                newScale = Math.min(1, ww / baseSize.w);
            } else { // wide ratio
                newScale = Math.min(1, wh / baseSize.h);
            }

            if (newScale < 1) newScale -= 0.05;

            // Amazingly arbitrary stuff
            let translateZ = -400*newScale;
            let translateY = -300*newScale;
            let translateX = 420 *(1.0-newScale);
            let translateX_2D = 75 *(1.0-newScale);
            let marginTop = 100*(newScale-0.25);

            let controlsHeight = 340 * newScale;
            let holderHeight = baseSize.h * newScale;
            let controlsOffset = (600 + baseSize.h-700) * newScale;

            $('#game-board-holder').css({'height':holderHeight+'px'});
            $('#my-controls').css({'top': controlsOffset + 'px', 'max-height': controlsHeight+'px'});

            if (treide)
                $lay.css({'transform': 'scale(' + newScale + ',' +  newScale + ') rotateX(50deg) translateZ(' + translateZ + 'px) translateY(' + translateY + 'px) translateX(' + translateX + 'px)'});
            else 
                $lay.css({'transform': 'scale(' + newScale + ',' +  newScale + ') translateX(' + translateX_2D + 'px)', 'margin-top': marginTop + 'px'});
        }

        $(window).resize(updateScale);
        updateScale();

        var setBackground = function(source, destElem) {
            let image = new Image();

            image.src = source;

            image.onload = function() {
                let cssBackground = 'url(' + image.src + ')';

                $(destElem).css('background-image', cssBackground);
            };
        }

        var preloadImages = function(urls, allImagesLoadedCallback){
            var loadedCounter = 0;
            var toBeLoadedNumber = urls.length;
            urls.forEach(function(url){
                preloadImage(url, function(){
                    loadedCounter++;
                    let loadingProgress = Math.floor(100*(loadedCounter/toBeLoadedNumber));
                    $("#loading-progress").css('width', loadingProgress + '%');
                    if (url == 'img/d.png' || url == 'img/r.png' || url == 'img/v.png' || url == 'img/g.png') {
                        $("#loading-tromfi").append($("<img/>",{src:url}));
                    }

                    if(loadedCounter == toBeLoadedNumber) {
                        allImagesLoadedCallback();
                    }
                });
            });
        }

        var preloadImage = function(url, anImageLoadedCallback){
            var img = new Image();
            img.src = url;
            img.onload = anImageLoadedCallback;
        }

        var soundBoard = new Howl({
            src: ['sounds.mp3', 'sounds.ogg'],
            sprite: {
                clicky: [0, 300],
                nope: [400, 300],
                pass: [700, 2400],
                una: [3200,800],
                doua: [4200, 1500],
                trei: [6000, 1200],
                patru: [7350, 2900],
                rachiu: [10500, 1000],
                lucaciu: [11700, 3900],
                sictir: [15700, 2200],
                mota: [18000, 2000],
                speis: [20200, 2800],
                ooooo: [23200, 7800],
                satana: [31300, 5200],
                iapula: [36650, 3300],
                seejay: [40300, 3000],
                fail: [44000, 5500],
                dubla: [49500, 4800],
                nice: [54400, 2300],
                shuffle: [57100, 4800],
                check: [60000, 200],
                turn: [63100, 1100],
                nelson: [64300, 1400],
                surprise: [65750, 1450],
                slap: [67400, 300],
                plm: [68000, 1600],
                lamasamea: [69900, 3600],
                tenerife: [73800, 3500],
                paultheman: [77900, 6100],
                huoo: [84200, 15200]
            }
        })
        
        var socket;
        var username;
        var game_updates = new Queue();

        var game_vars = {
            in_seat: -1,
            game_turn: -1,
            cards_on_river: 0,
            cards_handed: false,
            logged_in: false,
            big_whites: 0,
            big_colors: 0,
            bid_value: -1,
            game_tromf: null,
            game_dubla: false
        };

        var master_tl = new gsap.timeline({autoRemoveChildren: true, onComplete: function() {
            if (!game_updates.isEmpty())
                updateGame(game_updates.dequeue());
        }});

        socket = io();

        setInterval(function() {
            if (!document.hidden && !game_updates.isEmpty() && (master_tl.duration() == 0 || master_tl.progress() == 1))
                updateGame(game_updates.dequeue());
        }, 1000);

        // Loading
        preloadImages([
            'img/r.png',
            'img/max_afara.jpg',
            'img/0.png',
            'img/0d.png',
            'img/0g.png',
            'img/0r.png',
            'img/0v.png',
            'img/1.png',
            'img/10d.png',
            'img/10g.png',
            'img/10r.png',
            'img/10v.png',
            'img/11d.png',
            'img/11g.png',
            'img/11r.png',
            'img/11v.png',
            'img/g.png',
            'img/2.png',
            'img/2d.png',
            'img/2g.png',
            'img/2r.png',
            'img/2v.png',
            'img/3.png',
            'img/3d.png',
            'img/3g.png',
            'img/3r.png',
            'img/3v.png',
            'img/4.png',
            'img/4d.png',
            'img/4g.png',
            'img/4r.png',
            'img/4v.png',
            'img/d.png',
            'img/alters.png',
            'img/bere.png',
            'img/cafea.png',
            'img/chair.png',
            'img/deck.png',
            'img/lamasa.png',
            'img/logo.png',
            'img/logow.png',
            'img/max_inauntru.jpg',
            'img/newgame.png',
            'img/score.png',
            'img/tigari.png',
            'img/x2.png',
            'img/v.png',
            'img/max_lamasa.jpg',
            'img/mo.png',
            'img/kick.png'
        ], function() {
            setBackground('img/max_afara.jpg', 'body');
            $("#loading").fadeOut(300, function() {
                $('#page-login').fadeIn(200);
            });
        });

        //////////////////////////////
        // Socket.io handlers
        //////////////////////////////

        socket.on('connect_error', function(error) {
            $("#error").show();
        });

        socket.on('connect_timeout', function(error) {
            $("#error").show();
        });

        socket.on('error', function(error) {
            $("#error").show();
        })

        $("#ignore-error").on('click', function() {
            $("#error").hide();
        })
      
        socket.on('login', function(msg) {
            updateGamesList(msg.games);
            username = msg.userId;
            $('#page-login').fadeOut(200, function() {
                $('#page-lobby').fadeIn(200);
            });
        });

        socket.on('login_nope', function() {
            game_vars.logged_in = false;
            $('#username').effect( "shake", {times:2}, 300 );
            soundBoard.play('nope'); 
        });
      
        socket.on('refreshgames', function(msg) {
            if (msg.kicked != null)
            {
                master_tl.invalidate();
                game_updates = new Queue();
                master_tl = new gsap.timeline({autoRemoveChildren: true, onComplete: function() {
                    if (!game_updates.isEmpty())
                        updateGame(game_updates.dequeue());
                }});

                if (msg.kicked == true) soundBoard.play('huoo');
                $('#page-game').fadeOut(200, function() {
                    setBackground('img/max_inauntru.jpg', 'body');
                    $('#page-lobby').fadeIn(200);
                });
                updateGamesList(msg.games);
            }
            else
                updateGamesList(msg);
        });

        socket.on('refresh', function(msg) {
            master_tl.invalidate();

            setGame(msg.game, msg.update_cards);

            game_updates = new Queue();
            master_tl = new gsap.timeline({autoRemoveChildren: true, onComplete: function() {
                if (!game_updates.isEmpty())
                    updateGame(game_updates.dequeue());
            }});
        });

        socket.on('joingame', function(msg) {
            soundBoard.play('seejay');
            setGame(msg.game, null);
            $("#my-cards").html("");
            $('#page-lobby').fadeOut(200, function() {
                setBackground('img/max_lamasa.jpg', 'body');
                $('#page-game').fadeIn(200);
            });
        });

        socket.on('updategame', function(msg) {
            var game = msg.kicked == null ? msg : msg.game;

            if (msg.victory)
            {
                console.log("WTF" + game);
            }

            if (msg.kicked == true)
            {
                soundBoard.play("lamasamea");
            }

            if (!document.hidden && (master_tl.duration() == 0 || (master_tl.progress() == 1 && game_updates.isEmpty())))
                updateGame(game);
            else
                game_updates.enqueue(game);
        });

        socket.on('say', function(msg) {
            actualMsg = msg.actualMsg.trim();
            if (actualMsg.startsWith('\\'))
            {
                actualMsg = actualMsg.replace(/^\\/, '');

                if (actualMsg.toLowerCase().includes("rachiu")) soundBoard.play("rachiu");
                else if (actualMsg.toLowerCase().includes("lucaciu")) soundBoard.play("lucaciu");
                else if (actualMsg.toLowerCase().includes("sictir")) soundBoard.play("sictir");
                else if (actualMsg.toLowerCase().includes("mota")) soundBoard.play("mota");
                else if (actualMsg.toLowerCase().includes("speis")) soundBoard.play("speis");
                else if (actualMsg.toLowerCase().includes("satana")) soundBoard.play("satana");
                else if (actualMsg.toLowerCase().includes("pula")) soundBoard.play("iapula");
                else if (actualMsg.toLowerCase().includes("plm")) soundBoard.play("plm");
                else if (actualMsg.toLowerCase().includes("paul the man")) soundBoard.play("paultheman");
                else if (actualMsg.toLowerCase().includes("tenerife")) soundBoard.play("tenerife");
            }
            let user_msg = $('<p/>').text(actualMsg);
            let user_msg_bubble = $('<p/>').text(actualMsg);

            showInChat(msg.userId, user_msg);
            showChatBubble(msg.userId, user_msg_bubble);
        });

        var showInChat = function(userId, msg)
        {
            let $msgamend = $('<div/>');
            if (userId == username) $msgamend.addClass("my-message"); else $msgamend.append($('<span/>').text(userId));
            $msgamend.append(msg);
            let $clearfix = $('<div/>').addClass('clearfix');
            
            $msgamend.appendTo($("#messages"));
            $clearfix.appendTo($("#messages"));

            $("#messages").animate({ scrollTop: $("#messages").prop("scrollHeight")}, 333);
        }

        var showChatBubble = function(userId, msg)
        {
            // Don't judge, it's just Javascript.
            if (userId == $("#white-name").text())
            {
                while ($("#thought-white").text().length > 150 || $("#thought-white > p").length > 2 ) $("#thought-white > p").first().remove();
                $("#thought-white").append(msg);
                setTimeout(function() {
                    msg.fadeOut(500, function(){ $(this).remove()});
                }, 5000);
            }
            else if (userId == $("#red-name").text())
            {
                while ($("#thought-red").text().length > 150 || $("#thought-red > p").length > 2) $("#thought-red > p").first().remove();
                $("#thought-red").append(msg);
                setTimeout(function() {
                    msg.fadeOut(500, function(){ $(this).remove()});
                }, 5000);
            }
            else if (userId == $("#black-name").text())
            {
                while ($("#thought-black").text().length > 150 || $("#thought-black > p").length > 2) $("#thought-black > p").first().remove();
                $("#thought-black").append(msg);
                setTimeout(function() {
                    msg.fadeOut(500, function(){ $(this).remove()});
                }, 5000);
            }
            else if (userId == $("#blue-name").text())
            {
                while ($("#thought-blue").text().length > 150 || $("#thought-blue > p").length > 2) $("#thought-blue > p").first().remove();
                $("#thought-blue").append(msg);
                setTimeout(function() {
                    msg.fadeOut(500, function(){ $(this).remove()});
                }, 5000);
            }
        }

        //////////////////////////////
        // Animations
        //////////////////////////////

        function animateToDiv(tl, i, card, destination) {

          try {
                let rect = getBoundingRect(card);
                destination.appendChild(card);
                let newRect = getBoundingRect(card);

                tl.set(card, {x: 0, y: 0}, i);

                tl.from(card, {
                    x: rect.left - newRect.left,
                    y: rect.top - newRect.top,
                    ease: Power3.easeOut,
                    duration: 0.25
                }, i);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function animateToInitialCardsDiv(tl, i, card, destination) {

          try {
                let rect = getBoundingRect(card);
                destination.appendChild(card);
                let newRect = getBoundingRect(card);

                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(card, {x: 0, y: 0}, i);

                tl.from(card, {
                    x: rect.left - newRect.left,
                    y: rect.top - newRect.top,
                    ease: Power3.easeOut,
                    duration: 0.5
                }, i)
                .to(card, 0.5, {ease:Power3.easeOut, rotation: 0}, i);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function animateToInitialCardsDivAndRotate(tl, i, card, destination) {

          try {
                let rect = getBoundingRect(card);
                destination.appendChild(card);
                let newRect = getBoundingRect(card);

                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(card, {x: 0, y: 0}, i)
                  .set(frontCard, {rotationY:180}, 0)
                  .set(backCard, {rotationY:0}, 0)
                .from(card, {
                    x: rect.left - newRect.left,
                    y: rect.top - newRect.top,
                    ease: Power3.easeOut,
                    duration: 0.5
                }, i)
                .to(card, 0.5, {ease:Power3.easeOut, rotation: 0}, i)
                .to(frontCard, 0.5, {rotationY:0, ease: Power3.easeInOut}, 0)
                .to(backCard, 0.5, {rotationY:-180, ease: Power3.easeInOut}, 0);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function animateCardsMargin(tl, val, newMargin, delay) {

          try {
            tl.to(val, {
                marginLeft: newMargin,
                ease: Power2.easeOut,
                duration: 0.25,
                delay: delay
            }, 0);

          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function flipCardBackDelayed(tl, card) {

          try {
                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(frontCard, {rotationY:180, delay: 5}, 0)
                  .set(backCard, {rotationY:0, delay: 5}, 0)
                .to(frontCard, 0.5, {rotationY:0, ease: Power3.easeInOut, delay: 5}, 0)
                .to(backCard, 0.5, {rotationY:-180, ease: Power3.easeInOut, delay: 5}, 0);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function flipCardFront(tl, card) {

          try {
                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(backCard, {rotationY:-180},0)
                  .set(frontCard, {rotationY:0},0)
                .to(frontCard, 0.75, {rotationY:180, ease: Power3.easeInOut},0)
                .to(backCard, 0.75, {rotationY:0, ease: Power3.easeInOut},0);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function animateToDivAndRotate(tl, card, destination) {

          try {
                let rect = getBoundingRect(card);
                destination.appendChild(card);
                let newRect = getBoundingRect(card);

                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(card, {x: 0, y: 0},0)
                .set(frontCard, {rotationY:180},0)
                .set(backCard, {rotationY:0},0)

                tl.from(card, 0.75, {
                    x: rect.left - newRect.left,
                    y: rect.top - newRect.top,
                    ease: Power3.easeOut},0)
                .to(card, 0.65,{ease:Power3.easeOut, rotation: 80 + Math.floor(Math.random()*21)}, 0)
                .to(frontCard, 0.5, {rotationY:0, ease: Power3.easeInOut}, 0)
                .to(backCard, 0.5, {rotationY:-180, ease: Power3.easeInOut}, 0);
                // .set(backCard, {rotationY:-180});
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        function animateToDivAndReveal(tl, card, destination, river_card, i) {

            try {
                let rect = getBoundingRect(card);
                destination.appendChild(card);
                let newRect = getBoundingRect(card);

                $(card).find(".back img").attr('src','img/' + river_card.v + river_card.c + '.png');
                let zindex_offset = $("#cards-collected-white > div > div").length + $("#cards-collected-colors > div > div").length;
                $(card).css('z-index', 20+10*zindex_offset+i);

                let frontCard = $(card).children('.front')[0];
                let backCard = $(card).children('.back')[0];

                tl.set(card, {x: 0, y: 0},0)
                  .set(backCard, {rotationY:-180},0)
                  .set(frontCard, {rotationY:0},0)
                  .from(card, {
                    x: rect.left - newRect.left,
                    y: rect.top - newRect.top,
                    ease: Power3.easeOut,
                    duration: 0.75},0)
                .to(card, 0.75,{ease:Power3.easeOut, rotation: 20 + Math.floor(Math.random()*141)}, 0)
                .to(frontCard, 0.75, {rotationY:180, ease: Power3.easeInOut},0)
                .to(backCard, 0.75, {rotationY:0, ease: Power3.easeInOut},0);
          } catch (err) {
                console.debug(err);
                socket.emit('say', '!fmmexo');
          }
        }

        var addTimeline = function(tl)
        {
            if (master_tl.progress() === 1) {
                //previous animations are done.
                master_tl.add(tl).play(0);
            } else {
                //previous animations are NOT done. Let's add an animation that'll run when the others are finished.
                master_tl.add(tl);
            }
        }

        var revertCards = function() 
        {
            $("#bidding").fadeOut();
            $("#tromfing").fadeOut();
            $("#tura-dubla").hide();
            $(".playing-card").css('z-index', 'initial');

            if ($("#cards-shuffle > div > div").length < 24)
            {
                // Reverting all cards to default position, then just replace for good measure - iOS in mind.
                let tl_finishround = new gsap.timeline({autoRemoveChildren: true, onComplete: function() {
                    resetDeck();
                }});

                var card_index = $("#cards-shuffle > div > div").length;
                $("#game-river-white > div > div").each(function(idx, val) {
                    animateToInitialCardsDivAndRotate(tl_finishround, 0, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#game-river-red > div > div").each(function(idx, val) {
                    animateToInitialCardsDivAndRotate(tl_finishround, 0, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#game-river-black > div > div").each(function(idx, val) {
                    animateToInitialCardsDivAndRotate(tl_finishround, 0, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#game-river-blue > div > div").each(function(idx, val) {
                    animateToInitialCardsDivAndRotate(tl_finishround, 0, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#player-white-cards > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 1, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#player-red-cards > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 2, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#player-black-cards > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 3, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#player-blue-cards > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 4, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#cards-collected-white > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 5, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });
                $("#cards-collected-colors > div > div").each(function(idx, val) {
                    animateToInitialCardsDiv(tl_finishround, 5, val, $("#cards-shuffle > div")[card_index]);
                    card_index += 1;
                });

                addTimeline(tl_finishround);
            }
        }

        //////////////////////////////
        // Menus
        ////////////////////////////// 

        $(".alter_choice").on('click', function(e) {
            if (game_vars.logged_in) return;

            username = $('#username').val().trim();


            let alter = $(this).data("alter");
            if (username.length > 0 && username.length < 17 && username != "0") {
                game_vars.logged_in = true;
                $('#userLabel').text(username);
                soundBoard.play('clicky');
                socket.emit('login', username, alter);
            }
            else
            {
                $('#username').effect( "shake", {times:2}, 300 );
                soundBoard.play('nope');
            }
        });
      
        $('#exit-room').on('click', function() {
            socket.emit('resign');
            $('#page-game').fadeOut(200, function() {
                setBackground('img/max_inauntru.jpg', 'body');
                $('#page-lobby').fadeIn(200);
            });
        });

        $(document).on('click', '.game-card', function() {
            socket.emit('resign');

            if ($(this).attr('id') == "newgame")
                socket.emit('newgame');
            else
                socket.emit('joingame', $(this).data('game'));
        });

        $("#volume-toggle").on('click', function() {
            if (vol == 1) {
                vol = 0.5;
                Howler.volume(vol);
                $(this).html('<svg width="30px" height="30px" viewBox="0 0 16 16" class="bi bi-volume-down-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path fill-rule="evenodd" d="M8.717 3.55A.5.5 0 0 1 9 4v8a.5.5 0 0 1-.812.39L5.825 10.5H3.5A.5.5 0 0 1 3 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>  <path d="M10.707 11.182A4.486 4.486 0 0 0 12.025 8a4.486 4.486 0 0 0-1.318-3.182L10 5.525A3.489 3.489 0 0 1 11.025 8c0 .966-.392 1.841-1.025 2.475l.707.707z"/></svg>');
            } else if (vol == 0.5) {
                vol = 0;
                Howler.volume(vol);
                $(this).html('<svg class="bi bi-volume-mute-fill" width="30px" height="30px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path fill-rule="evenodd" d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 1.596a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708l4-4a.5.5 0 0 1 .708 0z"/>  <path fill-rule="evenodd" d="M9.146 5.146a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0z"/></svg>');
            } else {
                vol = 1;
                Howler.volume(vol);
                $(this).html('<svg class="bi bi-volume-up-fill" width="30px" height="30px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">  <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>  <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>  <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z"/>  <path fill-rule="evenodd" d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/> </svg>');
            }
        });

        $("#fullscreen-toggle").on('click', function() {
            toggleFullScreen();
        });

        $("#eye-toggle").on('click', function() {
            treide = !treide;
            updateScale();
        })

        $("#chat-toggle").on('click', function() {
            if ($(this).hasClass('donthit')) return;
            $(this).addClass('donthit');
            setTimeout(function() {$("#chat-toggle").removeClass('donthit')}, 1000);
            let offset_needed = Math.min(300, Math.max(0, $("#game-chatroom").offset().top - 300));
            if ($("#game-chatroom").hasClass('maxi'))
            {
                $("#game-chatroom").animate({top: "+="+ 300 +"px", opacity: 0.4}, 333);
            }
            else
            {
                $("#game-chatroom").animate({top: "-="+ offset_needed +"px", opacity: 1}, 333);
            }

            $("#game-chatroom").toggleClass('maxi');
            $("#say").focus();
            $("#messages").animate({ scrollTop: $("#messages").prop("scrollHeight")}, 333);
        });

        //////////////////////////////
        // Game
        ////////////////////////////// 

        $(document).on('click', 'div.not-taken#seat-white', function() {
            if (game_vars.in_seat > -1) return;
            socket.emit('selectseat', 0);
        });

        $(document).on('click', 'div.not-taken#seat-red', function() {
            if (game_vars.in_seat > -1) return;
            socket.emit('selectseat', 1);
        });

        $(document).on('click', 'div.not-taken#seat-black', function() {
            if (game_vars.in_seat > -1) return;
            socket.emit('selectseat', 2);
        });

        $(document).on('click', 'div.not-taken#seat-blue', function() {
            if (game_vars.in_seat > -1) return;
            socket.emit('selectseat', 3);
        });

        $(document).on('click', '#tura-dubla', function() {
            socket.emit('dubla');
            $(this).hide();
            $('#bidding').fadeOut();
            $('#my-controls').removeClass('my-turn');
        });

        $(document).on('click', '#cermaleste', function() {
            socket.emit('cermaleste');
            $(this).hide();
            $('#my-controls').removeClass('my-turn');
        });

        $(document).on('click', '.aleg-tromf', function() {
            let tromf = $(this).data("tromf");
            socket.emit('tromf', tromf);
            $('#tromfing').fadeOut();
            $('#my-controls').removeClass('my-turn');
        });

        $(document).on('click', '.licitez', function() {
            let bid = $(this).data("bid");
            socket.emit('bid', bid);
            $('#bidding').fadeOut();
            $('#tura-dubla').hide();
        });

        $("#saysth").on('submit', function(e) {
            e.preventDefault();
            let mymsg = $("#say").val().trim();

            if (mymsg.length < 1) return;

            socket.emit('say', mymsg);
            $("#say").val("");
        });

        $(document).on('click', '.my-turn .playable-card', function() {
            if ($(this).hasClass('card_forbidden')) return;

            let v = $(this).data('value');
            let c = $(this).data('color');
            $('.card_forbidden').removeClass('card_forbidden');
            socket.emit('turn', v, c);

            $('#my-controls').removeClass('my-turn');
            $('#tura-dubla').hide();
        });

        $(document).on('click', '.my-game #white-alter.not-me', function() {
            if (game_vars.in_seat != 0) socket.emit('say', '!kickwhite');
            $(this).removeClass();
        });
        $(document).on('click', '.my-game #red-alter.not-me', function() {
            if (game_vars.in_seat != 1) socket.emit('say', '!kickred');
            $(this).removeClass();
        });
        $(document).on('click', '.my-game #black-alter.not-me', function() {
            if (game_vars.in_seat != 2) socket.emit('say', '!kickblack');
            $(this).removeClass();
        });
        $(document).on('click', '.my-game #blue-alter.not-me', function() {
            if (game_vars.in_seat != 3) socket.emit('say', '!kickblue');
            $(this).removeClass();
        });

        var updateGamesList = function(games)
        {
            document.getElementById('gamesList').innerHTML = '<div id="newgame" class="game-card card"></div>';
            for (g in games)
            {
                $('#gamesList').append($('<div>')
                               .addClass('game-card')
                               .attr('data-game', games[g])
                               .text('La masa lu\'\n' + games[g]));
            }
        }

        var updateGame = function(game)
        {
            console.debug(game);

            if (game.victory && game.victory == true)
            {
                console.log("WTFFF");
                soundBoard.play("ooooo");
                if (game.white > game.color) {
                    $("#winners").text($("#white-name").text() + " & " + $("#black-name").text() + " - " + game.white);
                    $("#losers").text($("#red-name").text() + " & " + $("#blue-name").text() + " - " + game.color);
                } else {
                    $("#winners").text($("#red-name").text() + " & " + $("#blue-name").text() + " - " + game.color);
                    $("#losers").text($("#white-name").text() + " & " + $("#black-name").text() + " - " + game.white);
                }
                $("#game-end").fadeIn(100, function() {
                    var delayedCall = gsap.delayedCall(7, function() {
                        $("#game-end").fadeOut();
                    });
                });
                return;
            }

            updateGameVars(game);

            if (game.anunt == true)
            {
                if (game.white) $("#small_whites").text(parseInt($("#small_whites").text(), 10) + (game.anunt_tromf ? 40 : 20));
                else $("#small_colors").text(parseInt($("#small_colors").text(), 10) + (game.anunt_tromf ? 40 : 20));

                let user_msg = $('<p/>').addClass('msg-fullwidth');
                $('<img/>', {src:'img/' + '3' + game.clr + '.png'}).appendTo(user_msg);
                $('<img/>', {src:'img/' + '4' + game.clr + '.png'}).appendTo(user_msg);

                if (game.anunt_tromf) soundBoard.play("nelson"); else soundBoard.play("surprise");

                let user_msg_bubble = $('<p/>').text("Anunț " + (game.anunt_tromf ? 40 : 20) + "!");

                showInChat(game.userId, user_msg);
                showChatBubble(game.userId, user_msg_bubble);
                return;
            }

            // If just handing cards
            if (game.first_to_receive != null)
            {
                let tl_dealcards = new gsap.timeline({  autoRemoveChildren: true, onStart: function() {
                    soundBoard.play('shuffle');
                } });
                    
                for (let i=0; i<4; i++)
                {
                    let to_receive = (game.first_to_receive+i)%4;
                    switch(to_receive) {
                        case 0: $("#seat-white").css('z-index', 14-i); break;
                        case 1: $("#seat-red").css('z-index', 14-i); break;
                        case 2: $("#seat-black").css('z-index', 14-i); break;
                        case 3: $("#seat-blue").css('z-index', 14-i); break;
                    }
                    for (let j=0; j<3; j++)
                    {
                        if ($("#cards-shuffle > div").length > 0)
                        {
                            switch(to_receive) {
                                case 0: animateToDiv(tl_dealcards, i, $("#cards-shuffle > div > div").last()[0], $("#player-white-cards > div")[2-j+(game_vars.cards_handed ? 3 : 0)]); break;
                                case 1: animateToDiv(tl_dealcards, i, $("#cards-shuffle > div > div").last()[0], $("#player-red-cards > div")[2-j+(game_vars.cards_handed ? 3 : 0)]); break;
                                case 2: animateToDiv(tl_dealcards, i, $("#cards-shuffle > div > div").last()[0], $("#player-black-cards > div")[2-j+(game_vars.cards_handed ? 3 : 0)]); break;
                                case 3: animateToDiv(tl_dealcards, i, $("#cards-shuffle > div > div").last()[0], $("#player-blue-cards > div")[2-j+(game_vars.cards_handed ? 3 : 0)]); break;
                                default: break;
                            }
                        }
                    }
                }

                addTimeline(tl_dealcards);
                return;
            }

            if (game.showcards == true)
            {
                soundBoard.play('dubla');

                let user_msg_bubble = $('<p/>').text("Tură dublă!");
                showChatBubble(game.userId, user_msg_bubble);

                $("#player-white-cards .back img").each(function(idx)
                {
                    $(this).attr('src', 'img/' + game.white[idx].v + game.white[idx].c + '.png');
                });
                $("#player-red-cards .back img").each(function(idx)
                {
                    $(this).attr('src', 'img/' + game.red[idx].v + game.red[idx].c + '.png');
                });
                $("#player-black-cards .back img").each(function(idx)
                {
                    $(this).attr('src', 'img/' + game.black[idx].v + game.black[idx].c + '.png');
                });
                $("#player-blue-cards .back img").each(function(idx)
                {
                    $(this).attr('src', 'img/' + game.blue[idx].v + game.blue[idx].c + '.png');
                });

                $("#game-board").addClass("cards_on_display");

                let tl_turncard = new gsap.timeline({ autoRemoveChildren: true, onComplete: function() {
                    $("#game-board").removeClass("cards_on_display");
                }});

                $(".seat .playing-card").each(function(idx, val) {
                    flipCardFront(tl_turncard, val);
                });

                $(".seat .playing-card-holder").each(function(idx, val) {
                    animateCardsMargin(tl_turncard, val, "-75px", 0);
                });
            
                $(".seat .playing-card").each(function(idx, val) {
                    flipCardBackDelayed(tl_turncard, val);
                });

                $(".seat .playing-card-holder").each(function(idx, val) {
                    animateCardsMargin(tl_turncard, val, "-125px", 5);
                });

                addTimeline(tl_turncard);
                return;
            }

            if (game.update_cards != null)
            {
                if (game.can_double == true)
                    $('#tura-dubla').show();

                updateCards(game.update_cards);
                return;
            }

            if (game.cards == null) return;

            if (game.dubla && game.state == 1)
            {
                revertCards();
            }

            updateBidRound(game);

            let new_river_cards = game.river.length - game_vars.cards_on_river;
            if (new_river_cards == 1)
            {
                let diff_white = Math.abs(game.score.small_whites - parseInt($("#small_whites").text(), 10));
                let diff_big_white = game.score.big_whites - game_vars.big_whites;
                let diff_big_color = game.score.big_colors - game_vars.big_colors;

                let tl_turncard = new gsap.timeline({ autoRemoveChildren: true, onStart: function() {
                    Math.random() < 0.15 ? soundBoard.play('slap') : soundBoard.play('turn');
                }, onComplete: function(r_, dw_, dbw_, dbc_) {
                    if (r_ == 4)
                    {
                        let tl_collectcard = new gsap.timeline({autoRemoveChildren: true, delay:1, onComplete: function(dbw__, dbc__) {
                            if (dbw__ != 0 || dbc__ != 0)
                            {
                                let tl_finishround = new gsap.timeline({autoRemoveChildren: true, delay: 1, onStart: function(is_fail_) {
                                    if (is_fail_) soundBoard.play('fail'); else soundBoard.play('nice');
                                }, onStartParams: [dbw__ < 0 || dbc__ < 0]});
                                let collected_white = $("#cards-collected-white > div > div").length;

                                $("#cards-collected-white > div > div").each(function(idx, val) {
                                    animateToInitialCardsDiv(tl_finishround, 0, val, $("#cards-shuffle > div")[idx]);
                                });
                                $("#cards-collected-colors > div > div").each(function(idx, val) {
                                    animateToInitialCardsDiv(tl_finishround, 1, val, $("#cards-shuffle > div")[collected_white+idx]);
                                });

                                addTimeline(tl_finishround);
                            }
                        }, onCompleteParams:[dbw_, dbc_]});

                        if(dw_ > 0)
                        {
                            $(".game-river > div > div").each(function(idx, val) {
                                animateToDivAndRotate(tl_collectcard, $(this)[0], $("#cards-collected-white > div")[0]);                               
                            });
                        }
                        else
                        {
                            $(".game-river > div > div").each(function(idx, val) {
                                animateToDivAndRotate(tl_collectcard, $(this)[0], $("#cards-collected-colors > div")[0]);                               
                            });
                        }
                        addTimeline(tl_collectcard);
                        game_vars.cards_on_river = 0;
                    }
                }, onCompleteParams:[game_vars.cards_on_river+new_river_cards, diff_white, diff_big_white, diff_big_color]});

                for (let i = game_vars.cards_on_river; i < game_vars.cards_on_river + new_river_cards; i++)
                {
                    if (game.river[i].o == game.users.white) animateToDivAndReveal(tl_turncard, $("#player-white-cards > div > div").last()[0], $("#game-river-white > div")[0], game.river[i], i);
                    if (game.river[i].o == game.users.red) animateToDivAndReveal(tl_turncard, $("#player-red-cards > div > div").last()[0], $("#game-river-red > div")[0], game.river[i], i);
                    if (game.river[i].o == game.users.black) animateToDivAndReveal(tl_turncard, $("#player-black-cards > div > div").last()[0], $("#game-river-black > div")[0], game.river[i], i);
                    if (game.river[i].o == game.users.blue) animateToDivAndReveal(tl_turncard, $("#player-blue-cards > div > div").last()[0], $("#game-river-blue > div")[0], game.river[i], i);
                    $('#my-cards div[data-value="' + game.river[i].v + '"][data-color="' + game.river[i].c + '"]').remove();
                }

                game_vars.cards_on_river += new_river_cards;
                addTimeline(tl_turncard);
            } else if (new_river_cards != 0) {
                // Something's missing. Blame the developer
                console.debug("Warning: New river cards: " + new_river_cards);
                socket.emit('say', '!fmmexo');
                return;
            }

            updateGameTurning(game);

            if (game.turn > -1) updateScore(game);

            var bot_round = false;
            if (game.state == 1 && game.big_turn == 0 && game.alters.white == 'bot') bot_round = true;
            if (game.state == 1 && game.big_turn == 1 && game.alters.red == 'bot') bot_round = true;
            if (game.state == 1 && game.big_turn == 2 && game.alters.black == 'bot') bot_round = true;
            if (game.state == 1 && game.big_turn == 3 && game.alters.blue == 'bot') bot_round = true;
            if (game.state > 1 && game.turn == 0 && game.alters.white == 'bot') bot_round = true;
            if (game.state > 1 && game.turn == 1 && game.alters.red == 'bot') bot_round = true;
            if (game.state > 1 && game.turn == 2 && game.alters.black == 'bot') bot_round = true;
            if (game.state > 1 && game.turn == 3 && game.alters.blue == 'bot') bot_round = true;

            if (bot_round)
            {
                let bot_tl = new gsap.timeline({ autoRemoveChildren: true, delay: 0.5 });
                bot_tl.set({}, {}, 0.25);
                addTimeline(bot_tl);
            }
        }

        var updateGameVars = function(game)
        {
            if (game.id == username) $("#game-board").addClass("my-game"); else $("#game-board").removeClass("my-game");

            if (game.bid != null && game.bid.user == game.users.white) $("#white-name").addClass('highest_bidder');
            else if (game.bid != null && game.bid.user == game.users.red) $("#red-name").addClass('highest_bidder');
            else if (game.bid != null && game.bid.user == game.users.black) $("#black-name").addClass('highest_bidder');
            else if (game.bid != null && game.bid.user == game.users.blue) $("#blue-name").addClass('highest_bidder');

            if (game.tromf != null && game.tromf != game_vars.game_tromf)
            {
                game_vars.game_tromf = game.tromf;
                let bid_msg = $("<img/>", {src:'img/' + game_vars.game_tromf + '.png'});
                $("#score_tromf").append(bid_msg);
                $('.highest_bidder').addClass('tromf_' + game_vars.game_tromf);
            }

            // Others only if cards are there.. :)
            if (game.cards == null) return;

            game_vars.game_dubla = game.dubla;

            if (game.bid != null && game.bid.value > -1)
            {
                $("#score_bid").text(game.bid.value);
            }

            $(".turning").removeClass("turning");

            // Game over.
            if (game.state == -1)
            {
                $(".playing-card-holder").animate({opacity: 0}, 1000);
                $('#game-board').addClass('cards-gone');
            } else {
                $('#game-board').removeClass('cards-gone');   
            }

            game_vars.cards_handed = game.cards.white > 0;
            $("#cermaleste").hide();

            if (game.state < 2) 
            {
                // Reset tromf as this is a new round
                game_vars.game_tromf = null;
                game_vars.bid_value = -1;
                $(".highest_bidder").removeClass (function (index, className) {
                    return (className.match (/(^|\s)tromf_\S+/g) || []).join(' ');
                });
                $('.highest_bidder').removeClass('highest_bidder');
                $("#my-cards").html("");
                $("#score_tromf > img").remove();
                $("#score_bid").text("");

                // New players may still be joining
                updateSeats(game);

                if (game.state < 1)
                    return;

                // TURN 
                game_vars.game_turn = game.big_turn;

                if (game_vars.in_seat == game_vars.game_turn)
                {
                    $("#cermaleste").show();
                }
            }
            else
            {
                game_vars.game_turn = game.turn;
            }

            if (game.state == 3)
            {
                game_vars.cards_on_river = 0;
                if (username == game.bid.user)
                {
                    $('#tromfing').fadeIn();
                }
            }

            if (game.turn > -1)
            {
                $('#game-board').addClass('game-started');
            } else {
                $('#game-board').removeClass('game-started');
            }
        }

        var updateGameTurning = function(game) 
        {

            if (game_vars.game_turn == 0)
            {
                $("#seat-white").addClass("turning");
            }
            else if (game_vars.game_turn == 1)
            {
                $("#seat-red").addClass("turning");
            }
            else if (game_vars.game_turn == 2)
            {
                $("#seat-black").addClass("turning");
            }
            else if (game_vars.game_turn == 3)
            {
                $("#seat-blue").addClass("turning");
            }

            if (game.turn > -1)
            {
                $('#game-board').addClass('game-started');
            } else {
                $('#game-board').removeClass('game-started');
            }

            if (game_vars.game_turn == game_vars.in_seat && game.state == 4)
            {
                updatePlayableCards(game);
                $('#my-controls').addClass('my-turn');
            } 
            else
            {
                $('#my-controls').removeClass('my-turn');
            }
        }

        var updatePlayableCards = function(game)
        {
            let has_color = false;
            let has_tromf = false;

            $('.playable-card').each(function(idx) {
                if ($(this).data("color") == game_vars.game_tromf) has_tromf = true;
                if (game.river.length > 0 && $(this).data("color") == game.river[0].c) has_color = true;
            });

            $('.playable-card').each(function(idx) {
                if (game.score.small_whites == 0 && game.score.small_colors == 0 && $(this).data("color") != game_vars.game_tromf && has_tromf)
                    $(this).addClass("card_forbidden");
                else if (game.river.length > 0 && game.river.length < 4 && has_color && $(this).data("color") != game.river[0].c)
                    $(this).addClass("card_forbidden");
                else if (game.river.length > 0 && game.river.length < 4 && !has_color && has_tromf && $(this).data("color") != game_vars.game_tromf)
                    $(this).addClass("card_forbidden");
           });

            // In case of emergency break glass
            if ($('.playable-card').length == $('.card_forbidden').length)
            {
                socket.emit('say', '!fmmexo');
            }
        }

        var updateBidRound = function(game)
        {
            if ((game.state == 2 || game.state == 3) && game.bid.value > -1)
            {
                if (game.bid.value > game_vars.bid_value)
                {
                    $('.highest_bidder').removeClass('highest_bidder');
                    game_vars.bid_value = game.bid.value;
                    let bid_msg = $("<p/>").addClass('special-text').text(game_vars.bid_value == 0 ? 'Pas' : game_vars.bid_value);
                    showChatBubble(game.bid.user, bid_msg);
                    if (game_vars.bid_value == 0) soundBoard.play('pass');
                    if (game_vars.bid_value == 1) soundBoard.play('una');
                    if (game_vars.bid_value == 2) soundBoard.play('doua');
                    if (game_vars.bid_value == 3) soundBoard.play('trei');
                    if (game_vars.bid_value == 4) soundBoard.play('patru');
                }
                else
                {
                    soundBoard.play('check');
                }
            }
            else
            {
                game_vars.bid_value = game.bid.value;
            }

            if (game.state == 2 && game_vars.in_seat == game_vars.game_turn)
            {
                    $(".licitez[data-bid='1'] > img").attr('src', 'img/1.png');
                    $(".licitez[data-bid='2'] > img").attr('src', 'img/2.png');
                    $(".licitez[data-bid='3'] > img").attr('src', 'img/3.png');
                    if (game.bid.value > 0) $(".licitez[data-bid='1'] > img").attr('src', 'img/0.png');
                    if (game.bid.value > 1) $(".licitez[data-bid='2'] > img").attr('src', 'img/0.png');
                    if (game.bid.value > 2) $(".licitez[data-bid='3'] > img").attr('src', 'img/0.png');
                    $("#bidding").fadeIn();
            }
        } 

        var updateSeats = function(game)
        {
            if (game.users.white != null) 
            {
                $("#seat-white").removeClass('not-taken');
                $('#white-alter').removeClass().addClass('alter-'+game.alters.white + " alter-set");
                $('#white-name').text(game.users.white.indexOf('₪') > -1 ? game.users.white.replace(/[0-9]/g, "") : game.users.white);
                if (game.users.white == username) game_vars.in_seat = 0; else $('#white-alter').addClass('not-me')
            }
            else
            {
                $('#white-alter').removeClass();
                $('#white-name').text("");
                $("#seat-white").addClass('not-taken');
                revertCards();
            }

            if (game.users.red != null) 
            {
                $("#seat-red").removeClass('not-taken');
                $('#red-alter').removeClass().addClass('alter-'+game.alters.red + " alter-set");
                $('#red-name').text(game.users.red.indexOf('₪') > -1 ? game.users.red.replace(/[0-9]/g, "") : game.users.red);
                if (game.users.red == username) game_vars.in_seat = 1; else $('#red-alter').addClass('not-me')
            }
            else
            {
                $('#red-alter').removeClass();
                $('#red-name').text("");
                $("#seat-red").addClass('not-taken');
                revertCards();
            }

            if (game.users.black != null) 
            {
                $("#seat-black").removeClass('not-taken');
                $('#black-alter').removeClass().addClass('alter-'+game.alters.black + " alter-set");
                $('#black-name').text(game.users.black.indexOf('₪') > -1 ? game.users.black.replace(/[0-9]/g, "") : game.users.black);
                if (game.users.black == username) game_vars.in_seat = 2; else $('#black-alter').addClass('not-me')
            }
            else
            {
                $('#black-alter').removeClass();
                $('#black-name').text("");
                $("#seat-black").addClass('not-taken');
                revertCards();
            }

            if (game.users.blue != null) 
            {
                $("#seat-blue").removeClass('not-taken');
                $('#blue-alter').removeClass().addClass('alter-'+game.alters.blue + " alter-set");
                $('#blue-name').text(game.users.blue.indexOf('₪') > -1 ? game.users.blue.replace(/[0-9]/g, "") : game.users.blue);
                if (game.users.blue == username) game_vars.in_seat = 3; else $('#blue-alter').addClass('not-me')
            }
            else
            {
                $('#blue-alter').removeClass();
                $('#blue-name').text("");
                $("#seat-blue").addClass('not-taken');
                revertCards();
            }

            if (game_vars.in_seat > -1)
            {
                $('#game-board').removeClass('not-playing');
            } else {
                $('#game-board').addClass('not-playing');
            }
        }

        var updateScore = function(game)
        {
            game_vars.big_whites = game.score.big_whites;
            game_vars.big_colors = game.score.big_colors;

            $("#score_name_whites").text($("#white-name").text() + (game.users.white != null && game.users.black != null ? ' & ' : '') + $("#black-name").text());
            $("#score_name_colors").text($("#red-name").text() + (game.users.red != null && game.users.blue != null ? ' & ' : '') + $("#blue-name").text());

            $("#big_whites").text(game.score.big_whites);
            $("#big_colors").text(game.score.big_colors);
            $("#small_whites").text(game.score.small_whites);
            $("#small_colors").text(game.score.small_colors);

            $("#score_td").text(game.dubla ? "x2" : "");
        }

        var updateCardsOnDisplay = function(game)
        {
            // Gone!
            if (game.state == -1) {
                $(".playing-card-holder").remove();
                game_vars.in_seat = -1;
                return;
            }

            // Nothing to show.
            if (game.state == 0) return;

            // Shuffling
            if (game.state == 2 || game.state == 3) {
                $('#cards-shuffle > div > div').slice(-12).remove();
            } else if (game.state == 4) {
                $('#cards-shuffle > div > div').remove();    
            }

            // Player cards
            if (game.users.white != null) for (var i=1; i<=game.cards.white; i++) $("#player-white-cards > div:nth-child(" + i + ")").append('<div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div>');
            if (game.users.red != null) for (var i=1; i<=game.cards.red; i++) $("#player-red-cards > div:nth-child(" + i + ")").append('<div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div>');
            if (game.users.black != null) for (var i=1; i<=game.cards.black; i++) $("#player-black-cards > div:nth-child(" + i + ")").append('<div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div>');
            if (game.users.blue != null) for (var i=1; i<=game.cards.blue; i++) $("#player-blue-cards > div:nth-child(" + i + ")").append('<div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div>');

            // IN-GAME Only
            if (game.state < 4) return;
            game_vars.cards_on_river = game.river.length == 4 ? 0 : game.river.length;
            if (game.river.length < 4)
            {
                for (card in game.river)
                {
                    if (game.river[card].o == game.users.white) $("#game-river-white").html('<div class="playing-card-holder"><div class="playing-card d-inline-block position-relative" style="transform: rotate(141deg); z-index: 20;"><div class="front" style="transform: rotateY(180deg);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: translate(0px);"><img src="img/' + game.river[card].v + game.river[card].c + '.png" alt="back"></div></div></div>');
                    if (game.river[card].o == game.users.red) $("#game-river-red").html('<div class="playing-card-holder"><div class="playing-card d-inline-block position-relative" style="transform: rotate(81deg); z-index: 20;"><div class="front" style="transform: rotateY(180deg);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: translate(0px);"><img src="img/' + game.river[card].v + game.river[card].c + '.png" alt="back"></div></div></div>');
                    if (game.river[card].o == game.users.black) $("#game-river-black").html('<div class="playing-card-holder"><div class="playing-card d-inline-block position-relative" style="transform: rotate(111deg); z-index: 20;"><div class="front" style="transform: rotateY(180deg);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: translate(0px);"><img src="img/' + game.river[card].v + game.river[card].c + '.png" alt="back"></div></div></div>');
                    if (game.river[card].o == game.users.blue) $("#game-river-blue").html('<div class="playing-card-holder"><div class="playing-card d-inline-block position-relative" style="transform: rotate(31deg); z-index: 20;"><div class="front" style="transform: rotateY(180deg);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: translate(0px);"><img src="img/' + game.river[card].v + game.river[card].c + '.png" alt="back"></div></div></div>');
                }
            }
            let sum_cards = 24 - (game.river.length + game.cards.white + game.cards.red + game.cards.blue + game.cards.black);
            $("#cards-collected-colors > div").html('');
            $("#cards-collected-white > div").html('');
            let $card_div = '<div class="playing-card d-inline-block position-relative" style="transform: rotate(96deg); z-index: 11;"><div class="front" style="transform: translate(0px);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: rotateY(-180deg);"><img src="img/0.png" alt="back"></div></div><div class="playing-card d-inline-block position-relative" style="transform: rotate(80deg); z-index: 12;"><div class="front" style="transform: translate(0px);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: rotateY(-180deg);"><img src="img/0.png" alt="back"></div></div><div class="playing-card d-inline-block position-relative" style="transform: rotate(83deg); z-index: 13;"><div class="front" style="transform: translate(0px);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: rotateY(-180deg);"><img src="img/0.png" alt="back"></div></div><div class="playing-card d-inline-block position-relative" style="transform: rotate(80deg); z-index: 10;"><div class="front" style="transform: translate(0px);"><img src="img/0.png" alt="front"></div><div class="back" style="transform: rotateY(-180deg);"><img src="img/0.png" alt="back"></div></div>';

            if (game.score.small_colors > 0 && game.score.small_whites > 0)
            {
                for (let i=0; i<sum_cards/8; i++)
                {
                    $("#cards-collected-white > div").append($card_div);
                    $("#cards-collected-colors > div").append($card_div);
                }
            }
            else if (game.score.small_whites > 0)
            {
                for (let i=0; i<sum_cards/4; i++)
                {
                    $("#cards-collected-white > div").append($card_div);
                }
            }
            else if (game.score.small_colors > 0)
            {
                for (let i=0; i<sum_cards/4; i++)
                {
                    $("#cards-collected-colors > div").append($card_div);
                }
            }
        }

        var resetGame = function()
        {
            game_vars = {
                in_seat: -1,
                game_turn: -1,
                cards_on_river: 0,
                cards_handed: false,
                logged_in: game_vars.logged_in,
                big_whites: 0,
                big_colors: 0,
                bid_value: -1,
                game_tromf: null,
                game_dubla: false
            };
            $('#game-board').removeClass('cards-gone game-started');
            $("#game-board").html('<div id="seat-white" class="seat position-absolute"><div class="d-inline-block alter text-center align-middle"><div id="thought-white" class="thought"></div><div id="white-alter"></div><span class="align-middle" id="white-name"></span></div><div class="d-inline-block align-middle cards" id="player-white-cards"><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div></div></div><div id="seat-red" class="seat position-absolute"><div class="d-inline-block align-middle cards" id="player-red-cards"><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div></div><div class="d-inline-block alter text-center align-middle"><div id="thought-red" class="thought"></div><div id="red-alter"></div><span class="align-middle" id="red-name"></span></div></div><div id="seat-black" class="seat position-absolute"><div class="d-inline-block align-middle cards" id="player-black-cards"><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div></div><div class="d-inline-block alter text-center align-middle"><div id="thought-black" class="thought"></div><div id="black-alter"></div><span class="align-middle" id="black-name"></span></div></div><div id="seat-blue" class="seat position-absolute"><div class="d-inline-block alter text-center align-middle"><div id="thought-blue" class="thought"></div><div id="blue-alter"></div><span class="align-middle" id="blue-name"></span></div><div class="d-inline-block align-middle cards" id="player-blue-cards"><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div><div class="playing-card-holder"></div></div></div><div id="score" class="position-absolute"><div id="score_name_whites"></div><div id="small_whites"></div><div id="big_whites"></div><div class="clearfix"></div><div id="score_name_colors"></div><div id="small_colors"></div><div id="big_colors"></div><div class="clearfix"></div><br/><div id="score_tromf"></div><div id="score_td"></div><div id="score_bid"></div></div><div id="cards-shuffle" class="position-absolute"><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div></div><div id="cards-collected-white" class="position-absolute"><div class="playing-card-holder"></div></div><div id="cards-collected-colors" class="position-absolute"><div class="playing-card-holder"></div></div><div id="game-river-white" class="game-river position-absolute"><div class="playing-card-holder"></div></div><div id="game-river-red" class="game-river position-absolute"><div class="playing-card-holder"></div></div><div id="game-river-black" class="game-river position-absolute"><div class="playing-card-holder"></div></div><div id="game-river-blue" class="game-river position-absolute"><div class="playing-card-holder"></div></div><div class="game-overlay" id="bidding"><h2>C&#226;te zici c&#259; faci?</h2><div class="licitez pointer" data-bid="0"><img src="img/0.png"/></div><div class="licitez pointer" data-bid="1"><img src="img/1.png"/></div><div class="licitez pointer" data-bid="2"><img src="img/2.png"/></div><div class="licitez pointer" data-bid="3"><img src="img/3.png"/></div><div class="licitez pointer" data-bid="4"><img src="img/4.png"/></div></div><div class="game-overlay" id="tromfing"><h2>Care s&#259; fie tromfu?</h2><img alt="Roşu" src="img/r.png" class="pointer aleg-tromf" data-tromf="r"/><img alt="Ghindă" src="img/g.png" class="pointer aleg-tromf" data-tromf="g"/><img alt="Dubă" src="img/d.png" class="pointer aleg-tromf" data-tromf="d"/><img alt="Verde" src="img/v.png" class="pointer aleg-tromf" data-tromf="v"/><h2>Te sim&#355;i bul&#259;nos?</h2><img alt="Prima" src="img/1.png" class="pointer aleg-tromf" data-tromf="1"/><img alt="A doua" src="img/2.png" class="pointer aleg-tromf" data-tromf="2"/><img alt="A treia" src="img/3.png" class="pointer aleg-tromf" data-tromf="3"/></div>');
        }

        var setGame = function(game, update_cards)
        {
            console.debug(game)

            resetGame();
            updateGameVars(game);
            updateSeats(game);
            updateCardsOnDisplay(game);
            updateBidRound(game);
            if (update_cards != null) { updateCards(update_cards); }
            updateGameTurning(game);
            updateScore(game);
        }

        var updateCards = function(cards)
        {
            console.debug(cards);
            if (cards.length == 0) return;

            $("#my-cards").html("");

            for (card in cards)
            {
                let $card = $('<div/>');
                $card.attr('data-color', cards[card].c);
                $card.attr('data-value', cards[card].v);
                $card.addClass('playable-card');
                $card.html('<img src="img/' + cards[card].v + cards[card].c + '.png"/>');
                $card.appendTo("#my-cards");
            }
        }

        var resetDeck = function()
        {
            $("#cards-shuffle").html('<div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div><div class="playing-card-holder"><div class="playing-card d-inline-block position-relative"><div class="front"><img src="img/0.png" alt="front"/></div><div class="back"><img src="img/0.png" alt="back"/></div></div></div>');
        }

    });

})();