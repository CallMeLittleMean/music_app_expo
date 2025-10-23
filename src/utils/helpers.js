// Simple LRC parser
// Input: string content of .lrc
// Output: array of { time: number(ms), text: string }
export function parseLRC(lrcText = '') {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split(/\r?\n/);
  const result = [];
  const timeTag = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g; // [mm:ss.xx]

  for (const raw of lines) {
    if (!raw) continue;
    let matches;
    let text = raw.replace(timeTag, '').trim();
    timeTag.lastIndex = 0; // reset

    while ((matches = timeTag.exec(raw))) {
      const m = parseInt(matches[1] || '0', 10);
      const s = parseInt(matches[2] || '0', 10);
      // LRC uses centiseconds (hundredths of a second), so [00:09.56] = 9.56s = 9560ms
      const centiseconds = matches[3] ? parseInt(matches[3].padEnd(2, '0').slice(0, 2), 10) : 0;
      const t = m * 60 * 1000 + s * 1000 + centiseconds * 10;
      result.push({ time: t, text });
    }
  }

  return result
    .filter((r) => r.text && !Number.isNaN(r.time))
    .sort((a, b) => a.time - b.time);
}export function formatTime(ms = 0) {
	const total = Math.max(0, Math.floor(ms / 1000));
	const mm = String(Math.floor(total / 60)).padStart(1, '0');
	const ss = String(total % 60).padStart(2, '0');
	return `${mm}:${ss}`;
}
