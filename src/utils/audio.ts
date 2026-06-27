/**
 * Converts a base64 encoded raw 16-bit PCM (little-endian) mono audio stream (from Gemini TTS 24kHz)
 * into a standard, browser-playable WAV Blob.
 */
export function pcmToWav(pcmBase64: string, sampleRate = 24000): Blob {
  // Decode base64
  const binaryString = window.atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create standard WAV header (44 bytes)
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // Helper to write string bytes
  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* File size (header size + audio data length) */
  view.setUint32(4, 36 + len, true);
  /* WAVE format */
  writeString(view, 8, 'WAVE');
  /* fmt subchunk */
  writeString(view, 12, 'fmt ');
  /* Subchunk size (16 for PCM) */
  view.setUint32(16, 16, true);
  /* Audio format: 1 (uncompressed PCM) */
  view.setUint16(20, 1, true);
  /* Channels: 1 (mono) */
  view.setUint16(22, 1, true);
  /* Sample rate (24000 Hz) */
  view.setUint32(24, sampleRate, true);
  /* Byte rate: sampleRate * channels * bytesPerSample */
  view.setUint32(28, sampleRate * 1 * 2, true);
  /* Block align: channels * bytesPerSample */
  view.setUint16(32, 2, true);
  /* Bits per sample (16 bits) */
  view.setUint16(34, 16, true);
  /* data subchunk */
  writeString(view, 36, 'data');
  /* Audio data size */
  view.setUint32(40, len, true);

  // Return combined Blob
  return new Blob([wavHeader, bytes], { type: 'audio/wav' });
}

/**
 * Calculates estimated voiceover duration in seconds based on Tunisian Arabic words.
 * Conversational Tunisian dialect typically paces at around 125 words per minute.
 */
export function estimateDuration(text: string): number {
  if (!text) return 0;
  // Clean special characters and split by spaces
  const cleanText = text.replace(/[===\/\\#,+()$~%.'":*?<>{}]/g, '');
  const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  // Around 125 WPM (words per minute) -> words / 125 * 60 seconds
  const estSeconds = (words.length / 125) * 60;
  return Math.max(2, Math.round(estSeconds));
}

/**
 * Clean Tunisian dialect script highlight. Returns an array of segments indicating
 * whether a word is highly local Tunisian dialect (Derja) so we can highlight it in the UI.
 */
export function highlightTunisianDialect(text: string): { word: string; isDialect: boolean }[] {
  // Common Tunisian (Derja) marker words
  const dialectWords = [
    'عشيرك', 'لازمتها', 'تحليها', 'تخليكم', 'وتعملو', 'جو', 'تقربكم',
    'المنج', 'هذا', 'باش', 'الروتين', 'تنجموا', 'تلعبوها', 'مبعضكم', 'تتلموا',
    'علاها', 'لصغار', 'للكبار', 'زادة', 'تاو', 'معادش', 'البرة', 'يقلقوك',
    'بالحس', 'متاحهم', 'تتفرهد', 'معاهم', 'وبالطبيعة', 'قِطعْ', 'يقعدوا',
    'تهزوا', 'تخباها', 'بسهولة', 'تستنى', 'عدي', 'كوموند', 'أكاهاو'
  ];

  const words = text.split(/(\s+)/);
  return words.map(part => {
    if (/\s+/.test(part)) {
      return { word: part, isDialect: false };
    }
    // Clean punctuation
    const clean = part.replace(/[^\u0600-\u06FF]/g, '');
    const isDialect = dialectWords.some(dw => clean.includes(dw) || dw.includes(clean)) && clean.length > 1;
    return { word: part, isDialect };
  });
}
