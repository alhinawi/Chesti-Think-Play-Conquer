/** English copy for the computer opponents and the 3D positions, keyed by id. */
export const BOTS_EN: Record<string, { tagline: string; greet: string; wins: string; loses: string; checked: string }> = {
  lasker: {
    tagline: 'The longest-reigning world champion in history. A philosopher of the game who beats you quietly.',
    greet: 'I sat on the throne for 27 years. Take your time and start. Nothing rattles me.',
    wins: 'Told you. Chess is psychology before it is pieces.',
    loses: 'Well played. Nobody beats me easily, and you did it.',
    checked: 'Check? Easy, my friend. Attacking is not about volume.',
  },
  capablanca: {
    tagline: 'The Cuban genius. He plays by instinct, as if the pieces move on their own.',
    greet: 'I do not even need to think. The pieces play by themselves. Watch and learn.',
    wins: 'Easy? Yes. You are the one who made it hard on yourself.',
    loses: 'A rare loss. Keep it. Very few can do that.',
    checked: 'Nice check. I will still beat you.',
  },
  botvinnik: {
    tagline: 'Father of the Soviet school. Every move has a calculated, scientific reason.',
    greet: 'I am analyzing you from now, and I know where your weak spot is. Try hiding it.',
    wins: 'Analysis does not lie. Study harder next time.',
    loses: 'This game will go into the textbook. Congratulations, you are now part of the science.',
    checked: 'An expected check. And the reply is prepared.',
  },
  polgar: {
    tagline: 'The strongest woman player in history. She attacks from move one and spares nobody.',
    greet: 'I attack from the first move. If you only plan to defend, close the tab now.',
    wins: 'Told you, no mercy. Attacking is not a crime.',
    loses: 'You survived my attack? That is a medal on your chest.',
    checked: 'Your check only adds fuel to my fire.',
  },
  fischer: {
    tagline: "America's genius. Terrifying accuracy, and he lets no mistake slip by.",
    greet: 'One mistake from you and I am coming. Ready?',
    wins: 'You blundered. I told you I do not forgive.',
    loses: 'How?! No, wait... real respect. This game will be taught.',
    checked: 'Check? Just a nuisance. Focus on the real problem.',
  },
  kasparov: {
    tagline: "Russia's legend. Fire and an attack that never stops from the first move.",
    greet: 'My whole generation passed through here and fell. Get ready, you are next.',
    wins: 'The fire inside me never goes out. Try to cool it down next time.',
    loses: 'Record this in history: you beat Kasparov. But the next one is mine, so do not get used to it.',
    checked: 'Check? Ha. Now see the real fire.',
  },
  nakamura: {
    tagline: 'King of blitz and speed. He plays faster than you can think.',
    greet: 'You have 3 seconds to think. Oh, they just passed.',
    wins: 'GG. I was not even looking at the screen.',
    loses: 'What... you beat me? Revenge. Now. Right away.',
    checked: 'I saw that check before you thought of it.',
  },
  carlsen: {
    tagline: 'The highest rating in the history of the game. To him, endgames are an art of their own.',
    greet: 'Bring everything. I have sat across the greatest players in history, and now I came for you.',
    wins: 'I wrote those endgames. You were only a guest in them.',
    loses: 'I lost? Let me check... yes, really. Celebrate well, this does not repeat.',
    checked: 'One check? Wait until you see the rest.',
  },
}

export const W3_EN: Record<string, { name: string; story: string }> = {
  'opera-mate': {
    name: 'Opera Mate',
    story: 'Morphy plays while listening to the opera, and finishes with `Rd8#`: one rook and a bishop on `g5` are enough to trap the king among his own pieces. Rotate the board and look at the cell where the black king was built in.',
  },
  'immortal-mate': {
    name: 'The Immortal Finish',
    story: 'Anderssen sacrificed both rooks and the queen, and was left with just two bishops and a knight, yet he mated with them: `Be7#`. Look from above: 3 pieces against a whole army, and Black is still mated.',
  },
  'evergreen-mate': {
    name: 'The Evergreen Mate',
    story: 'Another masterpiece by Anderssen: `Bxe7#` and the king is locked in the corner. Try moving the camera behind the black king - you will find every escape square covered.',
  },
  'century-windmill': {
    name: "Fischer's Windmill",
    story: 'Thirteen-year-old Fischer saw further than the grown-ups: after a series of discovered checks, the knight returns with `Ne2+` and the black queen falls. Rotate the board and count the pieces: Black has a queen and a rook, and is lost!',
  },
  'kasparov-topalov': {
    name: "Kasparov's Raid",
    story: 'Topalov resigned here after seeing `Kh6` and `Qh4#` coming. The white queen on `a7` is far away, but the black king sits in the middle of the board, completely exposed.',
  },
  'legal-mate': {
    name: "Légal's Trap",
    story: 'The most famous bait in history: White deliberately lets the queen be taken, and then `Nd5#` mates with two knights and a bishop. From this angle you will see why Black regretted taking the queen.',
  },
  'adams-torre-cage': {
    name: 'The Queen Cage',
    story: 'The white queen offered itself to be taken 3 times in a row (`Qg4`, `Qc4`, `Qc7`) and nobody could touch it. Torre resigned here: the back rank collapses whatever he does.',
  },
  'rubinstein-final': {
    name: "Rubinstein's Symphony",
    story: 'The finish that every chess sage has studied closely: `...Rh3!` and there is no defense. Notice the black rook on `h3` next to the white king - a moment earlier it was on `d2`, offered to 3 pieces.',
  },
  'lasker-king-walk': {
    name: 'Mate by Walking the King',
    story: 'The strangest mate in history: the black king was dragged from `h7` all the way to `g1`, and Lasker finished with `Kd2#` - checkmate by moving his own king! Put the camera beside both kings and enjoy the scene.',
  },
  'steinitz-hunt': {
    name: "Steinitz's Hunt",
    story: 'Here von Bardeleben got up and walked out of the hall: mate is forced in every line. The rook on `h7` cannot be taken, and the queen and knight are ready to finish the job.',
  },
  'deepblue-shock': {
    name: 'The Machine Shock',
    story: 'Kasparov resigned in the deciding game against the computer: Black has an extra piece, but every one of his pieces is tied up. This is the moment history changed - the machine won a full match from a world champion.',
  },
  'gold-coins': {
    name: 'The Gold Coins',
    story: 'Marshall played `...Qg3!!` - the queen is thrown in front of 3 pieces, and the crowd threw gold coins onto the board in admiration. If any piece takes the queen, Black wins by mate or by material.',
  },
}
