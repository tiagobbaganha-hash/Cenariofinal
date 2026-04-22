import { NextRequest, NextResponse } from 'next/server'

// GIFs curados por categoria — URLs diretas do Tenor CDN (sem API key)
const CURATED: Record<string, {id:string,title:string,url:string}[]> = {
  'trending': [
    {id:'t1',title:'Stonks',url:'https://media1.tenor.com/m/pG_OuXLzaGkAAAAd/stonks.gif'},
    {id:'t2',title:'Money',url:'https://media1.tenor.com/m/OE-Qfn5uassAAAAd/money-rain.gif'},
    {id:'t3',title:'LFG',url:'https://media1.tenor.com/m/CKNkRqvbdgsAAAAd/lets-go-excited.gif'},
    {id:'t4',title:'Win',url:'https://media1.tenor.com/m/ux-DfpS3jBEAAAAd/lets-go-celebrate.gif'},
    {id:'t5',title:'Hype',url:'https://media1.tenor.com/m/3cMxNPSBtpAAAAAd/excited-hyped.gif'},
    {id:'t6',title:'Bruh',url:'https://media1.tenor.com/m/EAJXwYsNJnkAAAAd/bruh-meme.gif'},
    {id:'t7',title:'OMG',url:'https://media1.tenor.com/m/MWFHXdZPtkoAAAAd/omg-oh-my-god.gif'},
    {id:'t8',title:'Fail',url:'https://media1.tenor.com/m/uxMT_-h8mVEAAAAd/sad-cry.gif'},
    {id:'t9',title:'Fire',url:'https://media1.tenor.com/m/lmSJHFcNY-AAAAAd/fire-flames.gif'},
    {id:'t10',title:'Clap',url:'https://media1.tenor.com/m/y4lQ4vqaUmoAAAAd/clap-slow-clap.gif'},
    {id:'t11',title:'Facepalm',url:'https://media1.tenor.com/m/ZxKVdTWnCcQAAAAd/picard-facepalm.gif'},
    {id:'t12',title:'Dance',url:'https://media1.tenor.com/m/3gBSFrAVdDIAAAAd/dance-happy.gif'},
  ],
  'stonks money finance': [
    {id:'m1',title:'Stonks',url:'https://media1.tenor.com/m/pG_OuXLzaGkAAAAd/stonks.gif'},
    {id:'m2',title:'Money Rain',url:'https://media1.tenor.com/m/OE-Qfn5uassAAAAd/money-rain.gif'},
    {id:'m3',title:'Rich',url:'https://media1.tenor.com/m/VPk5DzDFt3AAAAAd/money-rich.gif'},
    {id:'m4',title:'Bull',url:'https://media1.tenor.com/m/BFXpfBKUTxoAAAAd/bull-market.gif'},
    {id:'m5',title:'Bear',url:'https://media1.tenor.com/m/KCpRmPUKa2AAAAAd/number-go-down.gif'},
    {id:'m6',title:'Diamond',url:'https://media1.tenor.com/m/RlNuGh3kCb0AAAAd/diamond-hands-hodl.gif'},
    {id:'m7',title:'Crypto',url:'https://media1.tenor.com/m/6NJk3MEPZHAAAAAC/bitcoin-to-the-moon.gif'},
    {id:'m8',title:'Broke',url:'https://media1.tenor.com/m/7NmUvsLmMfQAAAAd/broke-no-money.gif'},
    {id:'m9',title:'Gains',url:'https://media1.tenor.com/m/5O9INzwLGJoAAAAd/gains-money.gif'},
    {id:'m10',title:'Loss',url:'https://media1.tenor.com/m/KCpRmPUKa2AAAAAd/number-go-down.gif'},
    {id:'m11',title:'HODL',url:'https://media1.tenor.com/m/RlNuGh3kCb0AAAAd/diamond-hands-hodl.gif'},
    {id:'m12',title:'Moon',url:'https://media1.tenor.com/m/6NJk3MEPZHAAAAAC/bitcoin-to-the-moon.gif'},
  ],
  'lets go hype excited': [
    {id:'h1',title:'LFG',url:'https://media1.tenor.com/m/CKNkRqvbdgsAAAAd/lets-go-excited.gif'},
    {id:'h2',title:'Win',url:'https://media1.tenor.com/m/ux-DfpS3jBEAAAAd/lets-go-celebrate.gif'},
    {id:'h3',title:'Hype',url:'https://media1.tenor.com/m/3cMxNPSBtpAAAAAd/excited-hyped.gif'},
    {id:'h4',title:'Yes!',url:'https://media1.tenor.com/m/PqFUAuCxMFkAAAAd/yes-absolutely.gif'},
    {id:'h5',title:'Amazing',url:'https://media1.tenor.com/m/lPJcSaFGxiMAAAAd/amazing-wow.gif'},
    {id:'h6',title:'Party',url:'https://media1.tenor.com/m/lXr_bGQAk7cAAAAd/party-dance.gif'},
    {id:'h7',title:'Champion',url:'https://media1.tenor.com/m/rY93u9tQbybksAAAAd/winner.gif'},
    {id:'h8',title:'Dance',url:'https://media1.tenor.com/m/3gBSFrAVdDIAAAAd/dance-happy.gif'},
    {id:'h9',title:'Fire',url:'https://media1.tenor.com/m/lmSJHFcNY-AAAAAd/fire-flames.gif'},
    {id:'h10',title:'100',url:'https://media1.tenor.com/m/JBNBQR7N2FYAAAAd/100-percent.gif'},
    {id:'h11',title:'Love',url:'https://media1.tenor.com/m/7FKblOWNlZ4AAAAd/love-heart.gif'},
    {id:'h12',title:'Clap',url:'https://media1.tenor.com/m/y4lQ4vqaUmoAAAAd/clap-slow-clap.gif'},
  ],
  'party celebrate': [
    {id:'p1',title:'Party',url:'https://media1.tenor.com/m/lXr_bGQAk7cAAAAd/party-dance.gif'},
    {id:'p2',title:'Confetti',url:'https://media1.tenor.com/m/26tOZ42Mg6pbTUPHW/fireworks.gif'},
    {id:'p3',title:'Celebrate',url:'https://media1.tenor.com/m/ux-DfpS3jBEAAAAd/lets-go-celebrate.gif'},
    {id:'p4',title:'Champagne',url:'https://media1.tenor.com/m/m2T0Ep7VH34AAAAd/champagne-celebration.gif'},
    {id:'p5',title:'Dance',url:'https://media1.tenor.com/m/3gBSFrAVdDIAAAAd/dance-happy.gif'},
    {id:'p6',title:'Win',url:'https://media1.tenor.com/m/rY93u9tQbybksAAAAd/winner.gif'},
    {id:'p7',title:'Amazing',url:'https://media1.tenor.com/m/lPJcSaFGxiMAAAAd/amazing-wow.gif'},
    {id:'p8',title:'Hype',url:'https://media1.tenor.com/m/3cMxNPSBtpAAAAAd/excited-hyped.gif'},
  ],
  'funny meme bruh': [
    {id:'mm1',title:'Bruh',url:'https://media1.tenor.com/m/EAJXwYsNJnkAAAAd/bruh-meme.gif'},
    {id:'mm2',title:'Facepalm',url:'https://media1.tenor.com/m/ZxKVdTWnCcQAAAAd/picard-facepalm.gif'},
    {id:'mm3',title:'Nope',url:'https://media1.tenor.com/m/Kj8LkHm4f_QAAAAd/nope-no.gif'},
    {id:'mm4',title:'Really?',url:'https://media1.tenor.com/m/1IIo0HMQfpkAAAAd/really-seriously.gif'},
    {id:'mm5',title:'SMH',url:'https://media1.tenor.com/m/GsTFKRc2SDQAAAAd/smh-head.gif'},
    {id:'mm6',title:'Crying',url:'https://media1.tenor.com/m/FKdMMi83tgsAAAAd/crying-cry.gif'},
    {id:'mm7',title:'Confused',url:'https://media1.tenor.com/m/GfMy8qC4BPQAAAAd/confused-math.gif'},
    {id:'mm8',title:'OK',url:'https://media1.tenor.com/m/TbHx6z9KXDIAAAAd/ok-fine.gif'},
    {id:'mm9',title:'Shocked',url:'https://media1.tenor.com/m/jyOl8GaNEEsAAAAd/shocked-surprised.gif'},
    {id:'mm10',title:'No Way',url:'https://media1.tenor.com/m/nxNBsZoEjzkAAAAd/no-way-really.gif'},
  ],
  'shocked surprised omg': [
    {id:'s1',title:'OMG',url:'https://media1.tenor.com/m/MWFHXdZPtkoAAAAd/omg-oh-my-god.gif'},
    {id:'s2',title:'No Way',url:'https://media1.tenor.com/m/nxNBsZoEjzkAAAAd/no-way-really.gif'},
    {id:'s3',title:'Shocked',url:'https://media1.tenor.com/m/jyOl8GaNEEsAAAAd/shocked-surprised.gif'},
    {id:'s4',title:'Wow',url:'https://media1.tenor.com/m/2gy0e0pQ3LEAAAAd/wow-face.gif'},
    {id:'s5',title:'What',url:'https://media1.tenor.com/m/EBLcCEGP4GAAAAAd/wait-what.gif'},
    {id:'s6',title:'Mind Blown',url:'https://media1.tenor.com/m/8NTBv-VoH2IAAAAd/mind-blown-explosion.gif'},
  ],
  'fail lose rip': [
    {id:'f1',title:'RIP',url:'https://media1.tenor.com/m/6k8YEMFX-kMAAAAd/rip-rest-in-peace.gif'},
    {id:'f2',title:'Loss',url:'https://media1.tenor.com/m/KCpRmPUKa2AAAAAd/number-go-down.gif'},
    {id:'f3',title:'Sad',url:'https://media1.tenor.com/m/uxMT_-h8mVEAAAAd/sad-cry.gif'},
    {id:'f4',title:'Crying',url:'https://media1.tenor.com/m/FKdMMi83tgsAAAAd/crying-cry.gif'},
    {id:'f5',title:'F in chat',url:'https://media1.tenor.com/m/R3KFMCpAHpcAAAAd/f-in-chat.gif'},
  ],
  'soccer goal football': [
    {id:'ft1',title:'Goal',url:'https://media1.tenor.com/m/M7wm7TrKsEgAAAAd/goal-soccer.gif'},
    {id:'ft2',title:'Celebrate',url:'https://media1.tenor.com/m/J-lqhS5rjFQAAAAd/celebrate-football.gif'},
    {id:'ft3',title:'Win',url:'https://media1.tenor.com/m/ux-DfpS3jBEAAAAd/lets-go-celebrate.gif'},
    {id:'ft4',title:'Dance',url:'https://media1.tenor.com/m/3gBSFrAVdDIAAAAd/dance-happy.gif'},
  ],
  'thumbs up reaction': [
    {id:'r1',title:'Like',url:'https://media1.tenor.com/m/1nSH5S8HQLYAAAAd/like-thumbs-up.gif'},
    {id:'r2',title:'Clap',url:'https://media1.tenor.com/m/y4lQ4vqaUmoAAAAd/clap-slow-clap.gif'},
    {id:'r3',title:'Love',url:'https://media1.tenor.com/m/7FKblOWNlZ4AAAAd/love-heart.gif'},
    {id:'r4',title:'100',url:'https://media1.tenor.com/m/JBNBQR7N2FYAAAAd/100-percent.gif'},
    {id:'r5',title:'Fire',url:'https://media1.tenor.com/m/lmSJHFcNY-AAAAAd/fire-flames.gif'},
    {id:'r6',title:'Salute',url:'https://media1.tenor.com/m/26FLgGTPUDH6UGAbm/salute.gif'},
  ],
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || 'trending').toLowerCase()
  
  // Busca na lista curada
  const exact = CURATED[q]
  if (exact) return NextResponse.json({ gifs: exact })
  
  // Busca parcial por palavras-chave
  for (const [key, gifs] of Object.entries(CURATED)) {
    if (key.includes(q) || q.includes(key.split(' ')[0])) {
      return NextResponse.json({ gifs })
    }
  }
  
  // Fallback: trending
  return NextResponse.json({ gifs: CURATED['trending'] })
}
