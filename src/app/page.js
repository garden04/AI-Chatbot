'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

const WORLDS = [
  { id: 'fantasy', icon: '⚔️', name: '중세 판타지', desc: '마법과 용이 존재하는 중세 세계' },
  { id: 'cyberpunk', icon: '🤖', name: '사이버펑크', desc: '2087년 네온사인이 빛나는 디스토피아 도시' },
  { id: 'martial', icon: '🐉', name: '동양 무협', desc: '고대 동양의 무림 세계' },
  { id: 'space', icon: '🚀', name: '우주 탐험', desc: '은하계를 누비는 우주 탐험가의 이야기' },
  { id: 'horror', icon: '👻', name: '공포 미스터리', desc: '어둠 속에 숨겨진 진실을 파헤치는 이야기' },
  { id: 'isekai', icon: '🌀', name: '현대 이세계', desc: '평범한 일상에서 갑자기 다른 세계로 소환' },
]

export default function Home() {
  const [screen, setScreen] = useState('start') // 'start' | 'game'
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [entries, setEntries] = useState([])
  const [choices, setChoices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [hp, setHp] = useState(100)
  const [level, setLevel] = useState(1)
  const [turnCount, setTurnCount] = useState(0)
  const historyRef = useRef([])
  const storyBoxRef = useRef(null)

  useEffect(() => {
    if (storyBoxRef.current) {
      storyBoxRef.current.scrollTop = storyBoxRef.current.scrollHeight
    }
  }, [entries])

  function buildSystemPrompt(world, hp, level, turn) {
    return `당신은 "${world.name}" 세계관의 텍스트 RPG 게임 마스터입니다.
세계관 설명: ${world.desc}
현재 턴: ${turn}, 플레이어 HP: ${hp}/100, 레벨: ${level}

규칙:
1. 매 턴마다 생생한 묘사로 스토리를 전개하세요 (3~5문장).
2. 반드시 응답 마지막에 JSON 블록을 포함하세요:
\`\`\`json
{
  "choices": ["선택지1", "선택지2", "선택지3"],
  "hp_change": 0,
  "level_up": false
}
\`\`\`
3. choices는 항상 3개의 행동 선택지.
4. hp_change: -10~+10 사이 숫자 (전투나 위험 시 음수, 회복 시 양수).
5. level_up: 중요한 성취 달성 시 true.
6. 한국어로 응답하세요.
7. 선택지는 간결하게 (15자 이내).`
  }

  async function callAI(userMsg, world, currentHp, currentLevel, currentTurn) {
    setIsLoading(true)
    const systemPrompt = buildSystemPrompt(world, currentHp, currentLevel, currentTurn)

    // 최근 20개 메시지(10턴)만 유지하여 토큰 절약
    const trimmedHistory = historyRef.current.slice(-20)
    const contents = []
    for (const msg of trimmedHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
    contents.push({ role: 'user', parts: [{ text: userMsg }] })
    historyRef.current.push({ role: 'user', content: userMsg })

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, systemPrompt }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const fullText = data.text
      historyRef.current.push({ role: 'assistant', content: fullText })

      // JSON 파싱
      let newChoices = ['계속 앞으로 나아간다', '주변을 살펴본다', '잠시 휴식을 취한다']
      let hpChange = 0
      let levelUp = false
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          newChoices = parsed.choices || newChoices
          hpChange = parsed.hp_change || 0
          levelUp = parsed.level_up || false
        } catch (e) {}
      }

      const storyText = fullText.replace(/```json[\s\S]*?```/g, '').trim()
      const newEntries = []

      let newHp = currentHp
      if (hpChange !== 0) {
        newHp = Math.max(0, Math.min(100, currentHp + hpChange))
        setHp(newHp)
        newEntries.push({ type: 'system', text: hpChange < 0 ? `⚔️ HP ${hpChange}` : `💚 HP +${hpChange} 회복` })
      }

      let newLevel = currentLevel
      if (levelUp) {
        newLevel = currentLevel + 1
        setLevel(newLevel)
        newEntries.push({ type: 'system', text: `✨ 레벨 업! Lv.${newLevel}` })
      }

      newEntries.push({ type: 'narrator', text: storyText })
      setEntries(prev => [...prev, ...newEntries])
      setTurnCount(t => t + 1)

      if (newHp <= 0) {
        setEntries(prev => [...prev, { type: 'system', text: '💀 당신은 쓰러졌습니다... 게임 오버.' }])
        setChoices([])
      } else {
        setChoices(newChoices)
      }
    } catch (e) {
      setEntries(prev => [...prev, { type: 'system', text: '오류: ' + e.message }])
    }

    setIsLoading(false)
  }

  async function startGame() {
    if (!selectedWorld) return
    setScreen('game')
    setEntries([])
    setChoices([])
    setHp(100)
    setLevel(1)
    setTurnCount(0)
    historyRef.current = []
    await callAI('게임을 시작해줘. 플레이어가 막 모험을 시작하는 장면으로 오프닝을 써줘.', selectedWorld, 100, 1, 0)
  }

  async function makeChoice(choice) {
    if (isLoading) return
    setEntries(prev => [...prev, { type: 'player', text: choice }])
    setChoices([])
    await callAI(choice, selectedWorld, hp, level, turnCount)
  }

  async function sendCustom() {
    if (isLoading || !customInput.trim()) return
    const text = customInput.trim()
    setCustomInput('')
    setEntries(prev => [...prev, { type: 'player', text }])
    setChoices([])
    await callAI(text, selectedWorld, hp, level, turnCount)
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Chronicles of Fate</h1>
      <p className={styles.subtitle}>AI 텍스트 RPG</p>

      <div className={styles.container}>
        {/* 시작 화면 */}
        {screen === 'start' && (
          <div className={styles.startScreen}>
            <p>AI가 실시간으로 스토리를 생성합니다.<br />세계관을 선택하고 모험을 시작하세요.</p>
            <div className={styles.worldGrid}>
              {WORLDS.map(w => (
                <button
                  key={w.id}
                  className={`${styles.worldBtn} ${selectedWorld?.id === w.id ? styles.selected : ''}`}
                  onClick={() => setSelectedWorld(w)}
                >
                  <span className={styles.icon}>{w.icon}</span>
                  {w.name}
                </button>
              ))}
            </div>
            <hr className={styles.divider} />
            <button
              className={styles.startBtn}
              onClick={startGame}
              disabled={!selectedWorld}
            >
              모험 시작
            </button>
          </div>
        )}

        {/* 게임 화면 */}
        {screen === 'game' && (
          <>
            <div className={styles.statusBar}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>이름</div>
                <div className={styles.statValue} style={{ fontSize: '0.85rem' }}>용사</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>HP</div>
                <div className={styles.statValue}>{hp}</div>
                <div className={styles.hpBar}>
                  <div className={styles.hpFill} style={{ width: `${hp}%` }} />
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>레벨</div>
                <div className={styles.statValue}>{level}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>세계관</div>
                <div className={styles.statValue} style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {selectedWorld?.name}
                </div>
              </div>
            </div>

            <div className={styles.storyBox} ref={storyBoxRef}>
              {entries.map((entry, i) => (
                <div key={i} className={`${styles.storyEntry} ${styles[entry.type]}`}>
                  {entry.text}
                </div>
              ))}
              {isLoading && (
                <div className={styles.typingIndicator}>
                  AI가 이야기를 쓰는 중
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                  <span className={styles.dot}>.</span>
                </div>
              )}
            </div>

            <div className={styles.choices}>
              {choices.map((c, i) => (
                <button
                  key={i}
                  className={styles.choiceBtn}
                  onClick={() => makeChoice(c)}
                  disabled={isLoading}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className={styles.inputRow}>
              <input
                className={styles.customInput}
                placeholder="직접 행동 입력..."
                maxLength={100}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendCustom()}
                disabled={isLoading}
              />
              <button
                className={styles.sendBtn}
                onClick={sendCustom}
                disabled={isLoading}
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
