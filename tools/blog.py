"""Blog posts for usurp.games/blog/. Content only: tools/build.py renders them (blog_pages()).

House rules for every post: describe only what the games on this site actually do (check the game's JS before
adding a claim), keep history to facts with a solid source, US spelling, no em dashes, no keyword stuffing.
Placeholders in a post body, replaced by build.py:
  {{fig:NAME}}   a rules diagram (see blog_figs() in build.py)
  {{play:ID}}    a "play the game" call-out for the game with that id
"""

DATE = '2026-11-11'   # set to the day the posts go live

POSTS = [
    dict(
        slug='blog/how-to-play-nine-mens-morris.html', game='morris', og='game-morris',
        h1="How to Play Nine Men's Morris: Rules and a First Strategy",
        title="How to Play Nine Men's Morris: Rules and First Strategy",
        og_title="How to play Nine Men's Morris, with pictures",
        desc="The rules of Nine Men's Morris in three phases (placing, moving, flying), how mills and captures work, how a game ends, and five habits that win your first games.",
        lede="Two players, eighteen pieces and a board of three squares. You can learn the rules in five minutes. Here they are, with pictures, plus the habits that win your first games.",
        body='''
<h2 class="gilt">The board and the pieces</h2>
<p>The board is three squares, one inside the other, joined by four lines through the middles of their sides. Pieces sit on the 24 points where lines meet or turn, never inside the squares. Each player has nine pieces, which is where the name comes from: “morris” goes back to a Latin word for a counter or gaming piece.</p>
<p>The game has three phases. You place your pieces, then you move them, and a player who is down to three pieces may fly.</p>

<h2 class="gilt">Phase 1: placing</h2>
<p>Players take turns putting one piece from their hand on any empty point. That is all a turn is, until all eighteen pieces are on the board. Even now, the aim is the same as for the whole game: make mills.</p>

<h2 class="gilt">Mills and taking pieces</h2>
<p>A mill is three of your pieces in a row along one line. Each time you complete a mill, you take one of your opponent's pieces off the board, and it does not come back.</p>
<ul>
<li>You must take a piece that is <b>not</b> part of a mill. Only when every one of your opponent's pieces is in a mill may you take one from a mill.</li>
<li>One mill takes one piece.</li>
<li>A mill counts each time you form it. Breaking a mill and closing it again later takes another piece.</li>
</ul>
{{fig:mill}}

<h2 class="gilt">Phase 2: moving</h2>
<p>When both hands are empty, a turn means sliding one of your pieces along a line to the next point, which must be empty. There is no jumping and no moving across the middle of a square. Pieces that cannot move are blocked, and a player with no legal move at all loses the game.</p>
{{fig:slide}}

<h2 class="gilt">Phase 3: flying</h2>
<p>A player who is down to three pieces may fly: move any one of them to any empty point, anywhere on the board. It makes the weaker side dangerous, because a flying piece can close a mill from across the board.</p>
{{fig:fly}}

<h2 class="gilt">How the game ends</h2>
<ul>
<li>You win when your opponent has only two pieces left, since two pieces can never make a mill.</li>
<li>You also win when your opponent cannot make a legal move.</li>
<li>Rules for draws vary from player to player. On this site a game is drawn when the same position comes round three times, or when 30 moves each pass without a capture.</li>
</ul>

<h2 class="gilt">A first strategy: five habits</h2>
<h3>1. Do not chase mills while placing</h3>
<p>A mill made early takes one piece, but it often leaves your other pieces scattered. Spend the placing phase taking good points and blocking your opponent's rows of two.</p>
<h3>2. Take the busy points</h3>
<p>Corners touch only two other points. The middle point of a side touches three, and on the middle square it touches four. Pieces on busy points stay free to move once the sliding starts.</p>
<h3>3. Count your moves before the placing ends</h3>
<p>Being blocked loses the game, and it happens most often just after the last piece is placed. Before you place your last few pieces, check that each of them will have somewhere to slide.</p>
<h3>4. Build two threats at once</h3>
<p>If you have two rows of two, each waiting for a third piece, your opponent can block only one. The other becomes a mill.</p>
<h3>5. Make a mill that opens and closes</h3>
<p>The strongest shape in the moving phase is a mill where one piece can slide out and back in. Each time it slides back, the mill closes again and you take another piece. If your opponent builds one, block the empty point next to it straight away.</p>
{{play:morris}}
'''),
    dict(
        slug='blog/hnefatafl-rules.html', game='tafl', og='game-tafl',
        h1='Hnefatafl Rules: How to Play Viking Chess',
        title='Hnefatafl Rules: How to Play Viking Chess (Brandubh and Tablut)',
        og_title='Hnefatafl rules: how to play Viking chess',
        desc='How to play Viking chess: the board, how pieces move and capture, how the king escapes or is caught, and the draw rules, as played on 7x7 Brandubh and 9x9 Tablut.',
        lede='A king, his guard and a ring of raiders. The two sides are unequal and want different things, which is what makes Viking chess unlike any game you know. These are the rules our Brandubh and Tablut games use.',
        body='''
<h2 class="gilt">One family, many rule sets</h2>
<p>Hnefatafl is the best known of the tafl games, played across the Viking world. Nobody wrote down the full Viking rules, so every modern rule set is a reconstruction, and they differ in the details: whether the king escapes to the edge or a corner, whether he can capture, how many raiders it takes to catch him. This guide covers exactly one set, the one our game plays, so what you read here is what happens on the board.</p>

<h2 class="gilt">The two boards</h2>
<ul>
<li><b>Brandubh</b>, 7 by 7: 8 raiders against the king and 4 defenders. A quick game, and the best place to start.</li>
<li><b>Tablut</b>, 9 by 9: 16 raiders against the king and 8 defenders. Tablut was recorded by Carl Linnaeus in 1732, on his expedition to Lapland.</li>
</ul>
<p>On both boards the king starts on the throne, the center square, with his defenders around him. The raiders start in groups at the middle of each edge. The four corners and the throne are special squares.</p>

<h2 class="gilt">Moving</h2>
<p>The raiders move first. Every piece, the king included, moves like a rook in chess: any number of empty squares in a straight line, never diagonally and never jumping over another piece.</p>
<p>Only the king may stop on the throne or on a corner. Other pieces may not stop on the throne or pass through it.</p>

<h2 class="gilt">Capturing</h2>
<p>You take an enemy piece by trapping it between two of your own pieces in a straight line, across the board or down it. Pieces are taken only by the move that closes the trap, so a piece may safely move into the gap between two enemies.</p>
<ul>
<li>A corner counts as one of your pieces when you trap against it. So does the throne, but only while it is empty.</li>
<li>The king fights. He can be one of the two pieces in a defenders' capture.</li>
<li>One move can take more than one piece, if it closes traps on several sides at once.</li>
</ul>
{{fig:tafl}}

<h2 class="gilt">Catching the king</h2>
<p>The king is harder to take than other pieces, and how hard depends on where he stands:</p>
<ul>
<li><b>On the throne:</b> raiders on all four sides.</li>
<li><b>Next to the throne:</b> raiders on the other three sides. The throne counts as the fourth.</li>
<li><b>Anywhere else:</b> two raiders on opposite sides, like any other piece. A corner can stand in for one of them.</li>
</ul>
<p>The edge of the board does not help the raiders: a king with his back to the edge cannot be trapped against it.</p>

<h2 class="gilt">Winning, and draws</h2>
<ul>
<li>The defenders win the moment the king reaches any of the four corners.</li>
<li>The raiders win by capturing the king.</li>
<li>A side that has no legal move on its turn loses.</li>
<li>The game is drawn if the same position comes round three times, or if 50 moves each pass without a capture.</li>
</ul>

<h2 class="gilt">Your first games</h2>
<p>As the king, open two routes to corners at the same time: the raiders can block only one per move. As the raiders, guard the squares next to the corners before you go after the king, because a king who reaches the edge near an open corner is usually gone.</p>
<p>Our game opens with five short lessons that walk through the rules above. After that you can defend the king on either board, lead the raiders on Brandubh, against the computer at three levels, or pass one device between two players on Brandubh.</p>
{{play:tafl}}
'''),
    dict(
        slug='blog/nine-mens-morris-around-the-world.html', game='morris', og='game-morris',
        h1="Nine Men's Morris Around the World: Mills, Merels and Morabaraba",
        title="Nine Men's Morris Around the World: Mills, Merels, Mühle and More",
        og_title="Mills, merels, Mühle: Nine Men's Morris around the world",
        desc="Mills, merels, Mühle, Navakankari: where Nine Men's Morris got its names, how morabaraba differs, and what the history really shows.",
        lede="The same board of three squares turns up under many names, carved into stone and cut into turf. Here is what those names mean, how the close relatives differ, and which of the famous stories hold up.",
        body='''
<h2 class="gilt">Mills and Mühle</h2>
<p>In English the game is also called mills or the mill game, after the three-in-a-row that takes a piece. German speakers call it Mühle, which means mill, and the same idea runs through many other European names. The row of three is the heart of the game, so it is no surprise that so many languages named the whole game after it.</p>

<h2 class="gilt">Merels, merrills and morris</h2>
<p>Older English names include merels, merrills, merelles and morelles. The game writer Daniel King traces them, and “morris” with them, to the Latin merellus, a counter or gaming piece. A link to morris dancing has been suggested, but it is speculation, and the gaming-piece origin is the better supported one. Nine men's morris, then, means something close to “nine pieces”, which is exactly what each player has.</p>

<h2 class="gilt">Navakankari</h2>
<p>In India the game is known as Navakankari, from the Sanskrit nava, nine, and kankari, pebbles: nine pebbles for each player. The Gujarati form is Navkaankari, and other Indian languages have names of their own. Boards are drawn on the ground and played with stones or shells, which is how the game has traveled everywhere: all it needs is lines and two colors of pebble.</p>

<h2 class="gilt">Morabaraba: twelve cows</h2>
<p>Morabaraba is a close relative played in Southern Africa, especially in South Africa and Botswana, with a variant in Lesotho. It is almost the same as twelve men's morris: each player has twelve pieces, called cows, and the board adds diagonal lines between the corners of the squares. The name comes from the Southern Sotho moraba-raba, to go round in a circle. Morabaraba is popular with young people in the countryside, it has an organized competitive scene, and Mind Sports South Africa, its national body, is recognized by the South African government's sports department.</p>

<h2 class="gilt">Twelve men's morris</h2>
<p>The larger cousin gives each player twelve pieces and adds the four diagonal lines. Twenty-four pieces on twenty-four points means the board can fill completely during placing, and in some rule sets a full board is a draw. Nine men's morris has no diagonals, and nine pieces each leaves six points free, so there is always room to move.</p>

<h2 class="gilt">What the history really shows</h2>
<ul>
<li><b>Egypt, maybe.</b> Boards cut into roofing slabs at the temple of Kurna have been dated to about 1400 BCE, but some of the same carvings include Coptic crosses, and the historian Friedrich Berger concluded they cannot be dated. Treat any “3,000 years old” claim with care.</li>
<li><b>Rome.</b> Boards cut into Roman buildings suggest the game was well known there, and Ovid may mention it around 8 CE.</li>
<li><b>The Vikings.</b> A game board from the Gokstad ship burial in Norway has Nine Men's Morris on one side and a tafl game on the other.</li>
<li><b>Medieval England.</b> Boards are carved into cloister seats in several English cathedrals, and large boards were cut into village greens. Shakespeare's Titania complains in A Midsummer Night's Dream that the nine men's morris is filled up with mud.</li>
</ul>
<p>The rules most people play today, including flying when a player is down to three pieces, are the common modern ones. Older and regional rule sets differ in the details, which is part of the fun of meeting the game somewhere new.</p>
{{play:morris}}
'''),
    dict(
        slug='blog/free-browser-games-to-play-with-friends.html', game='usurper', og='game-usurper',
        h1='Free Browser Games to Play With Friends',
        title='Free Browser Games to Play With Friends (No Download, No Account)',
        og_title='Free browser games to play with friends: no download, no account',
        desc='Free browser games to play with friends on phones or computers, no download or account: an online party game for 4 to 10, two board games and score challenges.',
        lede='The best game for a group is the one everybody can join in a minute. Every game here opens in a browser on a phone or a computer, with nothing to install and no account to make.',
        body='''
<h2 class="gilt">What makes a good game to play with friends</h2>
<ul>
<li><b>Nothing to install.</b> If one friend has to download an app, make an account and wait for an update, you have lost them.</li>
<li><b>It works on phones.</b> At a party, on a call or in a classroom, a phone is what everyone has.</li>
<li><b>One link gets everyone in.</b> Sending a link in a group chat is easier than explaining a menu.</li>
</ul>
<p>Here is what usurp.games offers for each way of playing together.</p>

<h2 class="gilt">For a group, online: The Usurper</h2>
<p><a href="/games/the-usurper.html">The Usurper</a> is a medieval social deduction game for 4 to 10 players. Most players are loyal knights securing the keep; one or two are secretly the Usurper, sabotaging and striking when nobody is watching. When a knight falls, the council meets, talks and votes someone out.</p>
<ul>
<li>Choose <b>Private room</b> and you get a four-letter code and an invite link. Friends open the link and they are in.</li>
<li>Computer knights fill any empty seats, so two or three friends still get a full match.</li>
<li>Private rooms allow free typing in the council. Public matches use preset quick-chat lines instead.</li>
<li>One player hosts the match in their browser and must keep the page open until it ends.</li>
</ul>
<p>For a full walkthrough, see <a href="/blog/how-to-host-a-game-night-with-the-usurper.html">how to host a game night with The Usurper</a>.</p>

<h2 class="gilt">For two people, side by side: the board games</h2>
<p>Two of the games have a two-player mode on one device: pass the phone or share the screen.</p>
<ul>
<li><a href="/games/viking-chess.html">Viking chess (Hnefatafl)</a>: one player defends the king, the other leads the raiders, on the quick 7 by 7 board.</li>
<li><a href="/games/nine-mens-morris.html">Nine Men's Morris</a>: the old game of mills, quick to learn and hard to master.</li>
</ul>
<p>Both also play against the computer at three levels, so one of you can practice first. New to them? Read <a href="/blog/hnefatafl-rules.html">the Hnefatafl rules</a> or <a href="/blog/how-to-play-nine-mens-morris.html">how to play Nine Men's Morris</a>.</p>

<h2 class="gilt">For friends anywhere: beat my score</h2>
<p>The other games are single-player, but each one ends with a <b>Challenge a friend</b> button that sends your score with a link to the game.</p>
<ul>
<li><a href="/games/archery.html">The King's Archery Contest</a> has a daily contest with the same winds for everyone that day, so scores compare fairly.</li>
<li><a href="/games/trebuchet-game.html">Siege</a>: ten castles to topple with real physics, and stars for stones kept.</li>
<li><a href="/games/joust.html">The Joust</a>, <a href="/games/sword-duel.html">Duel</a> and <a href="/games/castle-defense.html">Hold the Castle</a> for quick rounds of timing, reflexes and defense.</li>
</ul>
<p>All of them are free, with no blood, and they keep your best scores on your own device.</p>
{{play:usurper}}
'''),
    dict(
        slug='blog/how-to-host-a-game-night-with-the-usurper.html', game='usurper', og='game-usurper',
        h1='How to Host a Game Night With The Usurper',
        title='How to Host a Game Night With The Usurper (4 to 10 Players, on Phones)',
        og_title='How to host a game night with The Usurper',
        desc='A practical guide to hosting The Usurper for 4 to 10 players: open a private room, share one link, set the number of knights and run the first match. Works on phones.',
        lede='One person hosts, everyone else taps a link. Here is how to get a group from “what is this?” to their first council vote in a few minutes.',
        body='''
<h2 class="gilt">What you need</h2>
<ul>
<li>A phone, tablet or computer for each player, with an internet connection. Players do not need to be on the same Wi-Fi, or even in the same country.</li>
<li>One host. The match runs in the host's browser, so the host should be on a device that will stay awake and keep the page open until the match ends.</li>
<li>From 4 to 10 knights in a match. Computer knights fill any seats your friends do not, so you can play with as few as two people.</li>
</ul>

<h2 class="gilt">Setting up, step by step</h2>
<ol>
<li>The host opens <a href="/games/the-usurper.html">The Usurper</a> and chooses <b>Private room</b>.</li>
<li>The keep's lobby shows a four-letter room code. Tap <b>Copy invite link</b> and paste it into your group chat, or use the WhatsApp button.</li>
<li>Friends open the link. It takes them straight into the room. If someone types the code instead, that works too.</li>
<li>Everyone can change their name in the lobby, so the council knows who is who.</li>
<li>The host sets how many knights are in the match with the minus and plus buttons. Seats not taken by friends go to computer knights.</li>
<li>When everyone is in, the host taps <b>Start the match</b>.</li>
</ol>

<h2 class="gilt">Explaining the game in one minute</h2>
<p>Read this out before the first match:</p>
<ul>
<li>“Most of us are loyal knights. Walk the keep and do your tasks. Heavy tasks need several knights heaving together.”</li>
<li>“One of us is secretly the Usurper” (two, with seven or more knights). “The Usurper strikes knights down when nobody is watching and sabotages the keep.”</li>
<li>“If you find a fallen knight, raise the alarm. The council meets, we talk and we vote someone out.”</li>
<li>“Knights win by securing the keep or banishing every Usurper. The Usurper wins by matching our numbers, or if the postern gate stays open too long.”</li>
</ul>
<p>The rest people learn by playing. Struck knights come back as ghosts who can still finish tasks, so nobody sits out for long.</p>

<h2 class="gilt">Tips for a good night</h2>
<ul>
<li><b>Play a warm-up.</b> Anyone who wants to practice can start a match against computer knights with Play now before the group arrives.</li>
<li><b>Talk in the council, not before.</b> Private rooms allow free typing during the council. If you are in the same room, agree to save accusations for the council, so the vote matters.</li>
<li><b>Use the strength numbers.</b> Every knight has a strength of 2 to 4. Say yours in the council: the Usurper has to invent one, and a lie shows up at the next heave.</li>
<li><b>Keep the host's page open.</b> If the host closes the page or loses their connection, the match ends for everyone.</li>
<li><b>It suits mixed ages.</b> There is no blood: struck knights simply fall. Public matches have no free typing; in a private room the chat is just your group.</li>
</ul>

<h2 class="gilt">If someone cannot connect</h2>
<p>Some school and office networks block the direct connections the game uses. If a player cannot join, try mobile data instead of that Wi-Fi. If online play is unavailable on the host's network, the game says so and offers a match against computer knights instead.</p>
{{play:usurper}}
'''),
]
