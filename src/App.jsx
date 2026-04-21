import { useState } from 'react'
import './App.css'

const chapters = [
  {
    title: '1. Intro',
    text: '23 de abril. Victor inicia su historia con miedo, pero con ganas de proteger lo que ama.',
  },
  {
    title: '2. Rutina',
    text: 'Entre ajustes de Invisalign y respiraciones cortas, Victor intenta mantener la calma.',
  },
  {
    title: '3. Encuentro con el elefante',
    text: 'Un elefante sabio aparece y le dice que el viaje será tan emocional como heroico.',
  },
  {
    title: '4. Viaje',
    text: 'Bosques, ruinas y dudas. Victor avanza porque piensa en Marta, no porque no tenga miedo.',
  },
  {
    title: '5. Ansiedad',
    text: 'La ansiedad sube y distorsiona su percepción. Victor aprende a respirar y a sostenerse.',
  },
  {
    title: '6. Combate contra el dragón',
    text: 'Victor derrota al dragón (200 HP) y cree que el final feliz ya llegó... pero es una falsa victoria.',
  },
  {
    title: '7. Reencuentro con Marta',
    text: 'Marta no espera ser rescatada: camina hacia Victor con calma, amor y una confianza inquebrantable.',
  },
  {
    title: '8. Revelación',
    text: 'El elefante revela la verdad: nunca fue un enemigo, sino la última prueba para vencer la duda.',
  },
  {
    title: '9. Combate final',
    text: 'La prueba final no mide fuerza bruta: mide el corazón, la gestión del pánico y la claridad.',
  },
  {
    title: '10. Final feliz',
    text: 'De la derrota simbólica nace un rosal. Victor entrega una rosa a Marta y ella le da un libro: amor, historia y crecimiento.',
  },
]

const initialVictor = {
  hp: 100,
  mp: 50,
  panic: 35,
}

function App() {
  const [chapterIndex, setChapterIndex] = useState(0)
  const [victor, setVictor] = useState(initialVictor)
  const [dragonHp, setDragonHp] = useState(200)
  const [elephantHp, setElephantHp] = useState(180)
  const [resistance, setResistance] = useState(false)
  const [log, setLog] = useState('La aventura comienza.')

  const inDragonBattle = chapterIndex === 5
  const inFinalBattle = chapterIndex === 8
  const dragonDefeated = dragonHp <= 0
  const elephantDefeated = elephantHp <= 0

  const nextChapter = () => {
    if (chapterIndex >= chapters.length - 1) {
      return
    }

    const next = chapterIndex + 1
    if (next === 8) {
      setLog('El elefante sabio pone a prueba la ansiedad y la percepción de Victor.')
    }
    setChapterIndex(next)
  }

  const attackDragon = () => {
    if (!inDragonBattle || dragonDefeated) {
      return
    }

    setDragonHp((current) => Math.max(0, current - 50))
    setVictor((current) => ({
      ...current,
      panic: Math.min(100, current.panic + 4),
    }))
    setLog('Victor ataca al dragón y aguanta el temblor en sus manos.')
  }

  const elephantCounter = (hasResistance) => {
    const panicHit = hasResistance ? 4 : 8
    setVictor((current) => ({
      ...current,
      panic: Math.min(100, current.panic + panicHit),
      hp: Math.max(0, current.hp - (hasResistance ? 5 : 10)),
    }))
  }

  const attackElephant = () => {
    if (!inFinalBattle || elephantDefeated) {
      return
    }

    const hasResistance = resistance
    const hit = hasResistance ? 45 : 35
    setElephantHp((current) => Math.max(0, current - hit))
    setLog('El elefante lanza dudas, pero Victor responde con valor.')
    elephantCounter(hasResistance)
    setResistance(false)
  }

  const rememberMarta = () => {
    if (!inFinalBattle || elephantDefeated || victor.mp < 10) {
      return
    }

    setVictor((current) => ({
      ...current,
      mp: current.mp - 10,
      panic: Math.max(0, current.panic - 20),
    }))
    setResistance(true)
    setLog('❤️ Recordar a Marta: el pánico baja y Victor gana resistencia.')
    elephantCounter(true)
  }

  const resetGame = () => {
    setChapterIndex(0)
    setVictor(initialVictor)
    setDragonHp(200)
    setElephantHp(180)
    setResistance(false)
    setLog('La aventura comienza.')
  }

  return (
    <main className="game-shell">
      <header>
        <p className="kicker">RPG narrativo retro CRT</p>
        <h1>Sant Jordi: La Leyenda de Victor</h1>
        <p className="subtitle">
          Inspirado en Final Fantasy, The Legend of Zelda y Baldur&apos;s Gate.
        </p>
      </header>

      <section className="hud">
        <h2>Estado de Victor</h2>
        <ul>
          <li>HP {victor.hp}/100</li>
          <li>MP {victor.mp}/50</li>
          <li>Ansiedad {victor.panic}/100</li>
          <li>Percepción {victor.panic >= 60 ? 'Nublada' : 'Clara'}</li>
        </ul>
      </section>

      <section className="chapter">
        <h2>{chapters[chapterIndex].title}</h2>
        <p>{chapters[chapterIndex].text}</p>

        {inDragonBattle && (
          <div className="battle-box">
            <p>
              🐉 Dragón: <strong>{dragonHp} HP</strong>
            </p>
            <button type="button" onClick={attackDragon} disabled={dragonDefeated}>
              Atacar dragón
            </button>
            {dragonDefeated && (
              <p className="event">
                Victoria. Todo parece terminar bien... pero aún queda la verdadera prueba.
              </p>
            )}
          </div>
        )}

        {inFinalBattle && (
          <div className="battle-box">
            <p>
              🐘 Elefante guardián: <strong>{elephantHp} HP</strong>
            </p>
            <div className="actions">
              <button type="button" onClick={attackElephant} disabled={elephantDefeated}>
                Golpe valiente
              </button>
              <button
                type="button"
                onClick={rememberMarta}
                disabled={elephantDefeated || victor.mp < 10}
              >
                ❤️ Recordar a Marta
              </button>
            </div>
            <p className="event">{log}</p>
            {elephantDefeated && (
              <p className="event">
                El elefante sonríe: &ldquo;Ya estás listo.&rdquo; Nunca fue un enemigo real.
              </p>
            )}
          </div>
        )}

        {chapterIndex === 9 && (
          <div className="ending">
            <p>🌹 Victor entrega la rosa a Marta.</p>
            <p>📖 Marta responde con un libro: una historia compartida.</p>
            <p>🌅 Caminan juntos al atardecer mientras el elefante observa desde lejos.</p>
            <blockquote>
              El verdadero valor no fue derrotar al dragón… sino aprender a creer.
            </blockquote>
          </div>
        )}

        <div className="controls">
          <button
            type="button"
            onClick={nextChapter}
            disabled={
              chapterIndex === chapters.length - 1 ||
              (inDragonBattle && !dragonDefeated) ||
              (inFinalBattle && !elephantDefeated)
            }
          >
            Avanzar historia
          </button>
          <button type="button" onClick={resetGame}>
            Reiniciar
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
